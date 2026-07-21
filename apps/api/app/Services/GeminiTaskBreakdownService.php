<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class GeminiTaskBreakdownService
{
    /**
     * @param  array{goal: string, deadline: string, available_minutes_per_day: int, language?: string, planning_profile?: string, ai_style?: string, create_subtasks?: bool, min_tasks?: int, max_tasks?: int, min_subtasks?: int, max_subtasks?: int, reserved_minutes?: int}  $payload
     * @return array{tasks: array<int, array{title: string, description: string, estimated_minutes: int, priority: string, subtasks: array<int, array{title: string, description: string, estimated_minutes: int, scheduled_date: string}>}>}
     */
    public function suggest(array $payload): array
    {
        $apiKey = config('services.gemini.key');
        $model = config('services.gemini.model', 'gemini-3.1-flash-lite');

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

        $timeout = max(30, (int) config('services.gemini.timeout', 90));
        $executionTimeout = $timeout + 15;
        if (function_exists('ini_set')) {
            @ini_set('max_execution_time', (string) $executionTimeout);
        }
        if (function_exists('set_time_limit')) {
            @set_time_limit($executionTimeout);
        }

        $requestBody = [
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
                'responseJsonSchema' => $this->responseSchema(
                    $createSubtasks,
                    $minTasks,
                    $maxTasks,
                    $minSubtasks,
                    $maxSubtasks,
                    $payload['available_minutes_per_day'],
                ),
                'candidateCount' => 1,
            ],
        ];
        try {
            $response = $this->requestModel($model, $apiKey, $requestBody, $timeout);
        } catch (ConnectionException $exception) {
            report(new RuntimeException("Gemini connection failed for model {$model}."));

            throw new RuntimeException('Gemini could not be reached before the request timeout. Please try again.');
        }

        if ($response->status() === 400) {
            $requestWithoutSchema = $requestBody;
            unset($requestWithoutSchema['generationConfig']['responseJsonSchema']);

            try {
                $response = $this->requestModel($model, $apiKey, $requestWithoutSchema, $timeout);
            } catch (ConnectionException $exception) {
                report(new RuntimeException("Gemini connection failed for model {$model} without response schema."));

                throw new RuntimeException('Gemini could not be reached before the request timeout. Please try again.');
            }
        }

        if ($response->failed()) {
            $providerMessage = $this->providerErrorMessage($response);

            if ($response->status() === 429) {
                throw new RuntimeException('Gemini quota is currently exhausted. Try again shortly or enable billing for the selected model.');
            }

            if ($response->status() === 403 || $response->status() === 401) {
                throw new RuntimeException('Gemini rejected the API key or this model is not enabled for the key.');
            }

            if ($response->status() === 400) {
                report(new RuntimeException('Gemini rejected the request: '.$providerMessage));

                throw new RuntimeException('Gemini rejected the request: '.($providerMessage ?: 'Invalid request.'));
            }

            if ($this->isTransientStatus($response->status())) {
                throw new RuntimeException('Gemini is temporarily overloaded. Please wait a moment and try again.');
            }

            report(new RuntimeException('Gemini request failed: '.$providerMessage));

            throw new RuntimeException('Gemini request failed. Please try again later.');
        }

        $text = collect(data_get($response->json(), 'candidates.0.content.parts', []))
            ->map(fn (mixed $part): string => is_array($part) ? (string) ($part['text'] ?? '') : '')
            ->implode('');
        $decoded = $this->decodeJsonResponse($text);

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

        if (is_array($tasks)) {
            $tasks = $this->normalizeGeneratedTasks(
                $tasks,
                $createSubtasks,
                $maxTasks,
                $maxSubtasks,
                (int) $payload['available_minutes_per_day'],
            );
        }

        $rules = [
            'tasks' => ['required', 'array', "min:{$minTasks}", "max:{$maxTasks}"],
            'tasks.*.title' => ['required', 'string', 'max:255'],
            'tasks.*.description' => ['required', 'string', 'max:1200'],
            'tasks.*.resources' => ['present', 'array', 'max:5'],
            'tasks.*.resources.*.title' => ['required', 'string', 'max:120'],
            'tasks.*.resources.*.url' => ['required', 'url:http,https', 'max:1000'],
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
            $rules['tasks.*.subtasks.*.resources'] = ['present', 'array', 'max:5'];
            $rules['tasks.*.subtasks.*.resources.*.title'] = ['required', 'string', 'max:120'];
            $rules['tasks.*.subtasks.*.resources.*.url'] = ['required', 'url:http,https', 'max:1000'];
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
            report(new RuntimeException(
                'Gemini schema validation failed: '.json_encode($validator->errors()->toArray()),
            ));

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

    private function decodeJsonResponse(string $text): mixed
    {
        $decoded = json_decode(trim($text), true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        $withoutFence = preg_replace(
            '/^```(?:json)?\s*|\s*```$/i',
            '',
            trim($text),
        );

        return json_decode((string) $withoutFence, true);
    }

    /**
     * Normalize harmless model drift before applying strict business validation.
     *
     * @param  array<int|string, mixed>  $tasks
     * @return array<int, mixed>
     */
    private function normalizeGeneratedTasks(
        array $tasks,
        bool $createSubtasks,
        int $maxTasks,
        int $maxSubtasks,
        int $availableMinutesPerDay,
    ): array {
        $schedulePlaceholder = CarbonImmutable::today()->toDateString();

        return collect(array_slice(array_values($tasks), 0, $maxTasks))
            ->map(function (mixed $task) use (
                $createSubtasks,
                $maxSubtasks,
                $availableMinutesPerDay,
                $schedulePlaceholder,
            ): mixed {
                if (! is_array($task)) {
                    return $task;
                }

                $title = $this->normalizedText($task['title'] ?? null, 255);
                $phase = $this->normalizedText($task['phase'] ?? null, 120);
                $subtasks = $createSubtasks && is_array($task['subtasks'] ?? null)
                    ? array_slice(array_values($task['subtasks']), 0, $maxSubtasks)
                    : [];

                $subtasks = array_map(function (mixed $subtask) use (
                    $availableMinutesPerDay,
                    $schedulePlaceholder,
                ): mixed {
                    if (! is_array($subtask)) {
                        return $subtask;
                    }

                    return [
                        ...$subtask,
                        'title' => $this->normalizedText($subtask['title'] ?? null, 255),
                        'description' => $this->normalizedText($subtask['description'] ?? null, 800),
                        'resources' => $this->normalizedResources($subtask['resources'] ?? null),
                        'estimated_minutes' => $this->normalizedMinutes(
                            $subtask['estimated_minutes'] ?? null,
                            $availableMinutesPerDay,
                        ),
                        // The scheduler redistributes every valid subtask after validation.
                        'scheduled_date' => $schedulePlaceholder,
                    ];
                }, $subtasks);

                $estimatedMinutes = $createSubtasks
                    ? (int) collect($subtasks)
                        ->filter(fn (mixed $subtask): bool => is_array($subtask))
                        ->sum('estimated_minutes')
                    : $this->normalizedMinutes($task['estimated_minutes'] ?? null, 10080);

                return [
                    ...$task,
                    'title' => $title,
                    'phase' => $phase !== '' ? $phase : $title,
                    'description' => $this->normalizedText($task['description'] ?? null, 1200),
                    'resources' => $this->normalizedResources($task['resources'] ?? null),
                    // Task phases and deadlines are assigned deterministically after validation.
                    'deadline' => $schedulePlaceholder,
                    'estimated_minutes' => $estimatedMinutes,
                    'priority' => $this->normalizedPriority($task['priority'] ?? null),
                    'subtasks' => $subtasks,
                ];
            })
            ->values()
            ->all();
    }

    private function normalizedText(mixed $value, int $maxLength): string
    {
        if (! is_scalar($value)) {
            return '';
        }

        return Str::limit(trim((string) $value), $maxLength, '');
    }

    /**
     * @return array<int, array{title: string, url: string}>
     */
    private function normalizedResources(mixed $resources): array
    {
        if (! is_array($resources)) {
            return [];
        }

        return collect($resources)
            ->filter(fn (mixed $resource): bool => is_array($resource))
            ->map(function (array $resource): ?array {
                $url = $this->normalizedText($resource['url'] ?? null, 1000);
                if (str_starts_with(Str::lower($url), 'www.')) {
                    $url = Str::limit('https://'.$url, 1000, '');
                }

                $scheme = parse_url($url, PHP_URL_SCHEME);
                if (! filter_var($url, FILTER_VALIDATE_URL) || ! in_array($scheme, ['http', 'https'], true)) {
                    return null;
                }

                $title = $this->normalizedText($resource['title'] ?? null, 120);

                return [
                    'title' => $title !== '' ? $title : (string) parse_url($url, PHP_URL_HOST),
                    'url' => $url,
                ];
            })
            ->filter()
            ->take(5)
            ->values()
            ->all();
    }

    private function normalizedMinutes(mixed $value, int $maximum): int
    {
        $minutes = is_numeric($value) ? (int) round((float) $value) : 30;

        return max(5, min(max(5, $maximum), $minutes));
    }

    private function normalizedPriority(mixed $value): string
    {
        return match (Str::lower(trim((string) $value))) {
            'high', 'urgent', 'cao' => 'high',
            'low', 'minor', 'thap', 'thấp' => 'low',
            default => 'medium',
        };
    }

    /**
     * @param  array<string, mixed>  $body
     */
    private function requestModel(
        string $model,
        string $apiKey,
        array $body,
        int $timeout,
    ): Response {
        $attempts = max(1, min(5, (int) config('services.gemini.retry_attempts', 3)));

        return Http::acceptJson()
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->connectTimeout(10)
            ->timeout($timeout)
            ->retry(
                $attempts,
                fn (int $attempt): int => min(4000, 500 * (2 ** ($attempt - 1))) + random_int(0, 250),
                fn (Throwable $exception): bool => $exception instanceof RequestException
                    && $this->isTransientStatus($exception->response->status()),
                throw: false,
            )
            ->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent",
                $body,
            );
    }

    private function isTransientStatus(int $status): bool
    {
        return in_array($status, [408, 425, 500, 502, 503, 504], true);
    }

    private function providerErrorMessage(Response $response): string
    {
        $payload = $response->json();
        $message = trim((string) data_get($payload, 'error.message', ''));
        $violations = collect(data_get($payload, 'error.details', []))
            ->flatMap(fn (mixed $detail): array => is_array($detail)
                ? (array) ($detail['fieldViolations'] ?? [])
                : [])
            ->map(function (mixed $violation): string {
                if (! is_array($violation)) {
                    return '';
                }

                $field = trim((string) ($violation['field'] ?? ''));
                $description = trim((string) ($violation['description'] ?? ''));

                return trim($field.($field !== '' && $description !== '' ? ': ' : '').$description);
            })
            ->filter()
            ->unique()
            ->implode('; ');

        return collect([$message, $violations])
            ->filter()
            ->unique()
            ->implode(' - ');
    }

    /**
     * @return array<string, mixed>
     */
    private function responseSchema(
        bool $createSubtasks,
        int $minTasks,
        int $maxTasks,
        int $minSubtasks,
        int $maxSubtasks,
        int $availableMinutesPerDay,
    ): array {
        $resourceSchema = [
            'type' => 'object',
            'required' => ['title', 'url'],
            'properties' => [
                'title' => ['type' => 'string', 'maxLength' => 120],
                'url' => ['type' => 'string', 'format' => 'uri', 'maxLength' => 1000],
            ],
        ];
        $subtaskSchema = [
            'type' => 'object',
            'required' => [
                'title',
                'description',
                'resources',
                'estimated_minutes',
                'scheduled_date',
            ],
            'properties' => [
                'title' => ['type' => 'string', 'maxLength' => 255],
                'description' => ['type' => 'string', 'maxLength' => 800],
                'resources' => [
                    'type' => 'array',
                    'maxItems' => 5,
                    'items' => $resourceSchema,
                ],
                'estimated_minutes' => [
                    'type' => 'integer',
                    'minimum' => 5,
                    'maximum' => $availableMinutesPerDay,
                ],
                'scheduled_date' => ['type' => 'string', 'format' => 'date'],
            ],
        ];

        return [
            'type' => 'object',
            'required' => ['tasks'],
            'properties' => [
                'tasks' => [
                    'type' => 'array',
                    'minItems' => $minTasks,
                    'maxItems' => $maxTasks,
                    'items' => [
                        'type' => 'object',
                        'required' => [
                            'title',
                            'phase',
                            'description',
                            'resources',
                            'deadline',
                            'estimated_minutes',
                            'priority',
                            'subtasks',
                        ],
                        'properties' => [
                            'title' => ['type' => 'string', 'maxLength' => 255],
                            'phase' => ['type' => 'string', 'maxLength' => 120],
                            'description' => ['type' => 'string', 'maxLength' => 1200],
                            'resources' => [
                                'type' => 'array',
                                'maxItems' => 5,
                                'items' => $resourceSchema,
                            ],
                            'deadline' => ['type' => 'string', 'format' => 'date'],
                            'estimated_minutes' => [
                                'type' => 'integer',
                                'minimum' => 5,
                                'maximum' => 10080,
                            ],
                            'priority' => [
                                'type' => 'string',
                                'enum' => ['low', 'medium', 'high'],
                            ],
                            'subtasks' => [
                                'type' => 'array',
                                'minItems' => $createSubtasks ? $minSubtasks : 0,
                                'maxItems' => $createSubtasks ? $maxSubtasks : 0,
                                'items' => $subtaskSchema,
                            ],
                        ],
                    ],
                ],
            ],
        ];
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
        $taskPattern = trim((string) ($payload['task_pattern_context'] ?? ''))
            ?: 'No user-created task examples are available or task-format learning is disabled.';
        $projectType = $payload['project_type'] ?? 'short_term';
        $projectTypeInstruction = match ($projectType) {
            'long_term' => 'This is a long-term project. Organize tasks into meaningful stages with intermediate deadlines and sustainable pacing across the full project window.',
            'daily_recurring' => 'This is a daily recurring project. Prefer repeatable daily actions or a reusable routine, with practical variation and recovery where relevant.',
            default => 'This is a short-term project. Keep the plan focused, immediately actionable, and achievable within a compact delivery window.',
        };
        $repromptInstruction = '';

        if (isset($payload['current_task'], $payload['current_subtask'], $payload['reprompt_feedback'])) {
            $currentTask = json_encode($payload['current_task'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $currentSubtask = json_encode($payload['current_subtask'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $repromptFeedback = trim((string) $payload['reprompt_feedback']);
            $repromptInstruction = <<<PROMPT

Focused subtask revision request:
- Replace exactly one existing draft subtask. Do not return alternatives or extra subtasks.
- Return exactly one task containing exactly one replacement subtask. The task is only a response wrapper.
- Preserve useful subtask details that the user did not ask to change.
- Make the replacement a concrete execution step that fits its parent task and deadline.
- Parent task context: {$currentTask}
- Existing draft subtask: {$currentSubtask}
- User-requested changes: {$repromptFeedback}
PROMPT;
        } elseif (isset($payload['current_task'], $payload['reprompt_feedback'])) {
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
- Include 1-3 useful resources for each task and subtask when a trustworthy resource helps execution. Prefer official documentation, canonical GitHub repositories, and YouTube search URLs. Never invent a specific video, repository, or documentation page. Never return example.com or placeholder URLs.

Goal: {$payload['goal']}
Deadline: {$payload['deadline']}
Planning window ends: {$payload['planning_end']}
Available minutes per day: {$payload['available_minutes_per_day']}
Schedulable days through deadline, including today: {$budget['days']}
Today: {$today}
Existing incomplete subtask minutes already reserved: {$budget['reserved_minutes']}
Remaining suggested-work budget: {$budget['remaining_minutes']} minutes
Language for all user-facing task and subtask text: {$language}
Style: {$style}
Plan mode: {$planMode}. {$modeInstruction}
Project type: {$projectType}. {$projectTypeInstruction}
Remembered project feedback (high-priority preferences; when entries conflict, follow the newer entry):
{$feedback}
User-created task format examples (imitate only their structure, wording style, and detail level; never copy unrelated project facts):
{$taskPattern}
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
      "resources": [],
      "deadline": "{$payload['planning_end']}",
      "estimated_minutes": 180,
      "priority": "high",
      "subtasks": [
        {
          "title": "Concrete step inside this task",
          "description": "Specific action, expected output, and quick acceptance check for this subtask.",
          "resources": [],
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
