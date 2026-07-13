<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class GeminiTaskBreakdownService
{
    /**
     * @param  array{goal: string, deadline: string, available_minutes_per_day: int, language?: string, planning_profile?: string, ai_style?: string, create_subtasks?: bool, min_tasks?: int, max_tasks?: int, min_subtasks?: int, max_subtasks?: int, reserved_minutes?: int}  $payload
     * @return array{tasks: array<int, array{title: string, description: string, estimated_minutes: int, priority: string, subtasks: array<int, array{title: string, description: string, estimated_minutes: int, scheduled_date: string}>}>}
     */
    public function suggest(array $payload): array
    {
        $apiKey = config('services.gemini.key');
        $model = config('services.gemini.model', 'gemini-3.5-flash');

        if (blank($apiKey)) {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $createSubtasks = (bool) ($payload['create_subtasks'] ?? true);
        $planMode = $payload['plan_mode'] ?? 'phased';
        $payload['planning_end'] = $this->planningEnd($payload, $planMode);
        $budget = $this->scheduleBudget($payload);

        if ($budget['remaining_minutes'] < 5) {
            throw ValidationException::withMessages([
                'schedule' => ['There is no remaining planning capacity in the selected planning window.'],
            ]);
        }
        $minTasks = $this->boundedCount($payload, 'min_tasks', 3);
        $maxTasks = max($minTasks, $this->boundedCount($payload, 'max_tasks', 6));

        if ($planMode === 'pipeline') {
            $minTasks = 1;
            $maxTasks = min(3, $maxTasks);
        }
        $minSubtasks = $this->boundedCount($payload, 'min_subtasks', 2);
        $maxSubtasks = max($minSubtasks, $this->boundedCount($payload, 'max_subtasks', 4));
        $minimumSuggestedMinutes = $createSubtasks ? $minTasks * $minSubtasks * 5 : $minTasks * 5;

        if ($minimumSuggestedMinutes > $budget['remaining_minutes']) {
            throw ValidationException::withMessages([
                'schedule' => ['The requested task and subtask counts cannot fit before the project deadline.'],
            ]);
        }

        $response = Http::timeout((int) config('services.gemini.timeout', 30))->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}",
            [
                'systemInstruction' => [
                    'parts' => [
                        ['text' => $this->systemInstruction()],
                    ],
                ],
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            ['text' => $this->prompt($payload)],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.2,
                    'candidateCount' => 1,
                ],
            ],
        );

        if ($response->failed()) {
            $providerMessage = (string) data_get($response->json(), 'error.message', '');

            if ($response->status() === 429) {
                throw new RuntimeException('Gemini quota is currently exhausted. Try again shortly or enable billing for the selected model.');
            }

            if ($response->status() === 403 || $response->status() === 401) {
                throw new RuntimeException('Gemini rejected the API key or this model is not enabled for the key.');
            }

            report(new RuntimeException('Gemini request failed: '.$providerMessage));

            throw new RuntimeException('Gemini request failed. Please try again later.');
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        $decoded = json_decode((string) $text, true);

        if (! is_array($decoded)) {
            throw ValidationException::withMessages([
                'ai_response' => ['Gemini returned invalid JSON.'],
            ]);
        }

        $tasks = array_is_list($decoded) ? $decoded : ($decoded['tasks'] ?? null);

        if ($tasks === null) {
            throw ValidationException::withMessages([
                'ai_response' => ['Gemini returned JSON that did not include tasks.'],
            ]);
        }

        if (! $createSubtasks && is_array($tasks)) {
            $tasks = array_map(function (mixed $task): mixed {
                if (! is_array($task)) {
                    return $task;
                }

                $task['subtasks'] = [];

                return $task;
            }, $tasks);
        }

        $rules = [
            'tasks' => ['required', 'array', "min:{$minTasks}", "max:{$maxTasks}"],
            'tasks.*.title' => ['required', 'string', 'max:255'],
            'tasks.*.description' => ['required', 'string', 'max:1200'],
            'tasks.*.phase' => ['required', 'string', 'max:120'],
            'tasks.*.deadline' => ['required', 'date', 'after_or_equal:'.CarbonImmutable::today()->toDateString(), 'before_or_equal:'.$payload['planning_end']],
            'tasks.*.estimated_minutes' => ['required', 'integer', 'min:5', 'max:10080'],
            'tasks.*.priority' => ['required', 'in:low,medium,high'],
            'tasks.*.subtasks' => $createSubtasks
                ? ['required', 'array', "min:{$minSubtasks}", "max:{$maxSubtasks}"]
                : ['present', 'array', 'max:0'],
        ];

        if ($createSubtasks) {
            $rules['tasks.*.subtasks.*.title'] = ['required', 'string', 'max:255'];
            $rules['tasks.*.subtasks.*.description'] = ['required', 'string', 'max:800'];
            $rules['tasks.*.subtasks.*.estimated_minutes'] = [
                'required',
                'integer',
                'min:5',
                'max:'.$payload['available_minutes_per_day'],
            ];
            $rules['tasks.*.subtasks.*.scheduled_date'] = [
                'required',
                'date',
                'after_or_equal:'.CarbonImmutable::today()->toDateString(),
                'before_or_equal:'.$payload['planning_end'],
            ];
        }

        $validator = Validator::make(['tasks' => $tasks], $rules);

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                'ai_response' => ['Gemini returned JSON that did not match the expected task schema.'],
            ]);
        }

        $validated = $validator->validated();
        $validated['tasks'] = array_map(function (array $task) use ($createSubtasks): array {
            if ($createSubtasks) {
                $task['estimated_minutes'] = (int) collect($task['subtasks'])->sum('estimated_minutes');
            }

            $task['description'] = trim($task['description']);
            $task['subtasks'] = $task['subtasks'] ?? [];

            return $task;
        }, $validated['tasks']);

        $validated['tasks'] = $this->assignPhases($validated['tasks'], $payload, $planMode);

        if (isset($payload['replacement_phase']) && count($validated['tasks']) === 1) {
            $validated['tasks'][0]['phase'] = $payload['replacement_phase'];
            $validated['tasks'][0]['repeat_weekly'] = (bool) ($payload['replacement_repeat_weekly'] ?? false);
        }

        if ($createSubtasks) {
            $validated['tasks'] = $this->balanceSuggestedSubtaskDates(
                $validated['tasks'],
                $payload,
            );
        }

        if (collect($validated['tasks'])->contains(fn (array $task): bool => $task['estimated_minutes'] > 10080)) {
            throw ValidationException::withMessages([
                'ai_response' => ['Gemini returned a task estimate that exceeds one week of work.'],
            ]);
        }

        $suggestedMinutes = $createSubtasks
            ? collect($validated['tasks'])->flatMap(fn (array $task): array => $task['subtasks'])->sum('estimated_minutes')
            : collect($validated['tasks'])->sum('estimated_minutes');

        if ($suggestedMinutes > $budget['remaining_minutes']) {
            throw ValidationException::withMessages([
                'schedule' => ['Gemini returned suggestions that do not fit before the project deadline.'],
            ]);
        }

        return $validated;
    }

    /**
     * @param  array{goal: string, deadline: string, available_minutes_per_day: int, language?: string, planning_profile?: string, ai_style?: string, create_subtasks?: bool, min_tasks?: int, max_tasks?: int, min_subtasks?: int, max_subtasks?: int, reserved_minutes?: int}  $payload
     */
    private function prompt(array $payload): string
    {
        $createSubtasks = (bool) ($payload['create_subtasks'] ?? true);
        $minTasks = $this->boundedCount($payload, 'min_tasks', 3);
        $maxTasks = max($minTasks, $this->boundedCount($payload, 'max_tasks', 6));
        $minSubtasks = $this->boundedCount($payload, 'min_subtasks', 2);
        $maxSubtasks = max($minSubtasks, $this->boundedCount($payload, 'max_subtasks', 4));
        $budget = $this->scheduleBudget($payload);
        $planMode = $payload['plan_mode'] ?? 'phased';
        if ($planMode === 'pipeline') {
            $minTasks = 1;
            $maxTasks = min(3, $maxTasks);
        }
        $language = match ($payload['language'] ?? 'en') {
            'vi' => 'Vietnamese',
            default => 'English',
        };
        $profile = match ($payload['planning_profile'] ?? 'portfolio') {
            'study' => 'study planner focused on learning, review, practice, and deadlines',
            'work' => 'work sprint planner focused on execution, handoffs, and measurable outcomes',
            'personal' => 'personal goals planner focused on sustainable habits and realistic pacing',
            default => 'portfolio builder focused on demo-ready fullstack project work',
        };
        $style = match ($payload['ai_style'] ?? 'concise') {
            'detailed' => 'make task descriptions and subtask descriptions specific enough to execute without guessing',
            'coach' => 'make wording encouraging while staying concrete, technical, and action-oriented',
            default => 'keep wording concise, but still include the concrete output and acceptance check',
        };
        $today = CarbonImmutable::today()->toDateString();
        $subtaskInstruction = $createSubtasks
            ? "Each task must include {$minSubtasks}-{$maxSubtasks} subtasks. Subtasks must be concrete execution steps for that task and each subtask must include a scheduled_date from {$today} through {$payload['planning_end']}."
            : 'Subtasks are disabled. Return an empty subtasks array for every task.';
        $modeInstruction = match ($planMode) {
            'recurring' => 'Create one detailed, sustainable 7-day template only. It will be repeated by the app, so do not invent a month of duplicate tasks. Use a routine with varied daily actions and practical recovery/rest days where appropriate.',
            'pipeline' => 'Create only the next-day plan. The user feedback below is the highest-priority source of truth; adapt the next actions to it even when it conflicts with a generic template. Do not plan future days.',
            default => 'Create a phased plan across the full available window. Each task must be a distinct phase with its own earlier deadline; do not assign every task to the final project date.',
        };
        $feedback = trim((string) ($payload['feedback_context'] ?? '')) ?: 'No user feedback has been recorded yet.';
        $repromptInstruction = '';

        if (isset($payload['current_task'], $payload['reprompt_feedback'])) {
            $currentTask = json_encode($payload['current_task'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $repromptFeedback = trim((string) $payload['reprompt_feedback']);
            $repromptInstruction = <<<PROMPT

Focused revision request:
- Replace exactly one existing draft task. Do not return alternative options or extra tasks.
- Keep it as a large task or milestone; use subtasks for the smaller steps.
- Preserve useful details that the user did not ask to change.
- Existing draft task: {$currentTask}
- User-requested changes: {$repromptFeedback}
PROMPT;
        }

        return <<<PROMPT
Break this goal into TASKS for a junior fullstack developer building TaskFlow Planner.

Important planning model:
- Tasks are large work packages or milestones, not tiny steps.
- Subtasks are the smaller execution steps inside a task, with a clear description of what to do and how to know it is done.
- Example: "Set up the React and Laravel development environment" is a task. Its subtasks can be "Create the React app shell", "Install Laravel dependencies", "Configure environment variables", and "Verify both dev servers run".
- Task titles and descriptions must be detailed enough for the user to understand the outcome.
- Task descriptions must include the concrete deliverable and what "done" means.
- Subtask titles and descriptions must be detailed enough to execute without extra explanation.
- For health, fitness, or weight-loss goals: suggest an actionable workout routine (exercise, sets/reps or duration, intensity progression) and usable meal/menu choices with portions or composition. Do not create generic tasks about researching or calculating formulas. Include a short safety note when medical context is relevant.
- For software goals: name the feature, implementation area, verification path, and observable output.

Goal: {$payload['goal']}
Deadline: {$payload['deadline']}
Planning window ends: {$payload['planning_end']}
Available minutes per day: {$payload['available_minutes_per_day']}
Schedulable days through deadline, including today: {$budget['days']}
Today: {$today}
Existing incomplete subtask minutes already reserved: {$budget['reserved_minutes']}
Remaining suggested-work budget: {$budget['remaining_minutes']} minutes
Language for all user-facing task and subtask text: {$language}
Planning profile: {$profile}
Style: {$style}
Plan mode: {$planMode}. {$modeInstruction}
Highest-priority user feedback for the next plan: {$feedback}
Task count: return at least {$minTasks} and at most {$maxTasks} tasks.
Subtask rule: {$subtaskInstruction}
{$repromptInstruction}

Return only JSON in this shape:
{
  "tasks": [
    {
      "title": "Large task or milestone title",
      "phase": "Named phase or weekly routine area",
      "description": "Specific outcome, scope, and acceptance notes for this task.",
      "deadline": "{$payload['planning_end']}",
      "estimated_minutes": 180,
      "priority": "high",
      "subtasks": [
        {
          "title": "Concrete step inside this task",
          "description": "Specific action, expected output, and quick acceptance check for this subtask.",
          "estimated_minutes": 45,
          "scheduled_date": "{$today}"
        }
      ]
    }
  ]
}

Use priority values only from low, medium, high.
If subtasks are enabled, each subtask estimate must be between 5 and {$payload['available_minutes_per_day']} minutes, and each task estimated_minutes must equal the sum of its subtasks.
If subtasks are enabled, distribute scheduled_date values evenly from {$today} to {$payload['planning_end']}; do not put every subtask on the deadline when earlier dates are available. Make sure the sum of subtask estimated_minutes for any single scheduled_date is not greater than {$payload['available_minutes_per_day']}.
If subtasks are disabled, each task estimated_minutes must estimate the whole task.
The sum of schedulable work must be less than or equal to {$budget['remaining_minutes']} minutes so the plan can fit before the project deadline.
PROMPT;
    }

    /**
     * @param  array<int, array{title: string, description: string, estimated_minutes: int, priority: string, subtasks: array<int, array{title: string, description: string, estimated_minutes: int, scheduled_date: string}>}>  $tasks
     * @param  array{deadline: string, available_minutes_per_day: int}  $payload
     * @return array<int, array{title: string, description: string, estimated_minutes: int, priority: string, subtasks: array<int, array{title: string, description: string, estimated_minutes: int, scheduled_date: string}>}>
     */
    private function balanceSuggestedSubtaskDates(array $tasks, array $payload): array
    {
        $dates = $this->schedulableDates($payload);
        $usedMinutesByDate = array_fill_keys($dates, 0);
        $capacity = (int) $payload['available_minutes_per_day'];

        foreach ($tasks as $taskIndex => $task) {
            $allowedDates = array_values(array_filter(
                $dates,
                fn (string $date): bool => $date <= $task['deadline'],
            ));

            foreach ($task['subtasks'] as $subtaskIndex => $subtask) {
                $minutes = (int) $subtask['estimated_minutes'];
                $placedDate = null;

                foreach ($this->datesByAvailableLoad($allowedDates, $usedMinutesByDate) as $date) {
                    if ($capacity >= $usedMinutesByDate[$date] + $minutes) {
                        $placedDate = $date;
                        $usedMinutesByDate[$date] += $minutes;
                        break;
                    }
                }

                if ($placedDate === null) {
                    throw ValidationException::withMessages([
                        'schedule' => ['Gemini returned suggestions that cannot be distributed before the project deadline.'],
                    ]);
                }

                $tasks[$taskIndex]['subtasks'][$subtaskIndex]['scheduled_date'] = $placedDate;
            }
        }

        return $tasks;
    }

    /**
     * @param  array{deadline: string}  $payload
     * @return array<int, string>
     */
    private function schedulableDates(array $payload): array
    {
        $dates = [];
        $startDate = CarbonImmutable::today();
        $endDate = CarbonImmutable::parse($payload['planning_end'] ?? $payload['deadline'])->startOfDay();

        for ($date = $startDate; $date->lte($endDate); $date = $date->addDay()) {
            $dates[] = $date->toDateString();
        }

        return $dates;
    }

    /**
     * @param  array<int, string>  $dates
     * @param  array<string, int>  $usedMinutesByDate
     * @return array<int, string>
     */
    private function datesByAvailableLoad(array $dates, array $usedMinutesByDate): array
    {
        $sorted = $dates;

        usort(
            $sorted,
            fn (string $first, string $second): int => [
                $usedMinutesByDate[$first] ?? 0,
                $first,
            ] <=> [
                $usedMinutesByDate[$second] ?? 0,
                $second,
            ],
        );

        return $sorted;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function boundedCount(array $payload, string $key, int $default): int
    {
        return max(1, min(12, (int) ($payload[$key] ?? $default)));
    }

    /**
     * @param  array{deadline: string, available_minutes_per_day: int, reserved_minutes?: int}  $payload
     * @return array{days: int, total_minutes: int, reserved_minutes: int, remaining_minutes: int}
     */
    private function scheduleBudget(array $payload): array
    {
        $startDate = CarbonImmutable::today();
        $endDate = CarbonImmutable::parse($payload['planning_end'] ?? $payload['deadline'])->startOfDay();
        $days = $endDate->lt($startDate)
            ? 0
            : (int) $startDate->diffInDays($endDate) + 1;
        $totalMinutes = $days * (int) $payload['available_minutes_per_day'];
        $reservedMinutes = max(0, (int) ($payload['reserved_minutes'] ?? 0));

        return [
            'days' => $days,
            'total_minutes' => $totalMinutes,
            'reserved_minutes' => $reservedMinutes,
            'remaining_minutes' => max(0, $totalMinutes - $reservedMinutes),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function planningEnd(array $payload, string $planMode): string
    {
        $projectEnd = CarbonImmutable::parse($payload['deadline'])->startOfDay();

        $shortWindowEnd = match ($planMode) {
            'recurring' => CarbonImmutable::today()->addDays(6),
            'pipeline' => CarbonImmutable::today()->addDay(),
            default => null,
        };

        if ($shortWindowEnd !== null) {
            return ($projectEnd->lt($shortWindowEnd) ? $projectEnd : $shortWindowEnd)->toDateString();
        }

        return $projectEnd->toDateString();
    }

    /**
     * @param  array<int, array<string, mixed>>  $tasks
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    private function assignPhases(array $tasks, array $payload, string $planMode): array
    {
        $start = CarbonImmutable::today();
        $end = CarbonImmutable::parse($payload['planning_end'])->startOfDay();
        $days = max(1, (int) $start->diffInDays($end) + 1);
        $count = count($tasks);
        $vietnamese = ($payload['language'] ?? 'en') === 'vi';

        foreach ($tasks as $index => $task) {
            $offset = max(0, (int) ceil((($index + 1) * $days) / max(1, $count)) - 1);
            $deadline = $planMode === 'pipeline'
                ? $end
                : $start->addDays($offset);

            $tasks[$index]['deadline'] = $deadline->toDateString();
            $tasks[$index]['phase'] = $planMode === 'recurring'
                ? ($vietnamese ? 'Lịch lặp hằng tuần: ' : 'Weekly routine: ').trim((string) $task['phase'])
                : ($planMode === 'pipeline'
                    ? ($vietnamese ? 'Kế hoạch ngày kế tiếp' : 'Next-day pipeline')
                    : ($vietnamese
                        ? 'Giai đoạn '.($index + 1).'/'.$count.': '.trim((string) $task['phase'])
                        : 'Phase '.($index + 1).' of '.$count.': '.trim((string) $task['phase'])));
            $tasks[$index]['repeat_weekly'] = $planMode === 'recurring';
        }

        return $tasks;
    }

    private function systemInstruction(): string
    {
        $rules = collect(config('taskflow_ai.assistant_rules', []))
            ->map(fn (string $rule): string => "- {$rule}")
            ->implode("\n");

        $profile = config('taskflow_ai.profile', 'portfolio_planner');
        $source = config('taskflow_ai.agent_rules_source');

        return <<<PROMPT
You are the TaskFlow Planner AI assistant.
Profile: {$profile}
Engineering guidance source: {$source}

Apply these concise planning rules:
{$rules}

Return only valid JSON. Do not include markdown, comments, or prose.
PROMPT;
    }
}
