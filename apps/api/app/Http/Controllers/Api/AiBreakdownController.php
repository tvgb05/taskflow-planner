<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AiBreakdownRequest;
use App\Models\Project;
use App\Models\ProjectPlanningFeedback;
use App\Models\Task;
use App\Services\GeminiTaskBreakdownService;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class AiBreakdownController extends Controller
{
    public function store(
        AiBreakdownRequest $request,
        Project $project,
        GeminiTaskBreakdownService $service,
    ): JsonResponse {
        $this->authorize('update', $project);

        $project->load('tasks.subtasks');
        $payload = $request->validated();
        $projectDeadline = $project->deadline?->toDateString();
        $currentTask = $payload['current_task'] ?? null;
        $currentSubtask = $payload['current_subtask'] ?? null;
        $payload['deadline'] = is_array($currentTask)
            ? min($projectDeadline, $currentTask['deadline'])
            : $projectDeadline;
        $payload['available_minutes_per_day'] = $project->available_minutes_per_day;
        $payload['reserved_minutes'] = ($payload['plan_mode'] ?? 'phased') === 'pipeline'
            ? $this->incompleteSubtaskMinutes($project, today()->addDay()->toDateString())
            : $this->incompleteSubtaskMinutes($project);

        if (is_array($currentTask)) {
            $payload['min_tasks'] = 1;
            $payload['max_tasks'] = 1;
            $payload['replacement_phase'] = $currentTask['phase'];
            $payload['replacement_repeat_weekly'] = (bool) ($currentTask['repeat_weekly'] ?? false);
        }

        if (is_array($currentSubtask)) {
            $payload['create_subtasks'] = true;
            $payload['min_subtasks'] = 1;
            $payload['max_subtasks'] = 1;
        }

        $this->rememberFeedback($request, $project, $payload);
        $payload['feedback_context'] = $this->feedbackContext($project);

        try {
            return response()->json($service->suggest($payload));
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 502);
        }
    }

    private function incompleteSubtaskMinutes(Project $project, ?string $scheduledDate = null): int
    {
        return (int) $project->tasks
            ->flatMap(fn (Task $task) => $task->subtasks)
            ->where('status', 'todo')
            ->when($scheduledDate, fn ($subtasks) => $subtasks->where('scheduled_date', $scheduledDate))
            ->sum(fn ($subtask): int => (int) ($subtask->estimated_minutes ?? 30));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function rememberFeedback(AiBreakdownRequest $request, Project $project, array $payload): void
    {
        $dailyFeedback = trim((string) ($payload['feedback'] ?? ''));
        if ($dailyFeedback !== '') {
            $this->storeFeedback(
                $project,
                $request->user()->id,
                $dailyFeedback,
                'daily',
                null,
                null,
                today()->addDay()->toDateString(),
            );
        }

        $regenerationFeedback = trim((string) ($payload['reprompt_feedback'] ?? ''));
        $currentTask = $payload['current_task'] ?? null;
        $currentSubtask = $payload['current_subtask'] ?? null;
        if ($regenerationFeedback === '' || ! is_array($currentTask)) {
            return;
        }

        $targetType = is_array($currentSubtask) ? 'subtask' : 'task';
        $targetTitle = is_array($currentSubtask)
            ? (string) $currentSubtask['title']
            : (string) $currentTask['title'];

        $this->storeFeedback(
            $project,
            $request->user()->id,
            $regenerationFeedback,
            'regeneration',
            $targetType,
            $targetTitle,
            today()->toDateString(),
        );
    }

    private function storeFeedback(
        Project $project,
        int $userId,
        string $content,
        string $kind,
        ?string $targetType,
        ?string $targetTitle,
        string $forDate,
    ): void {
        ProjectPlanningFeedback::firstOrCreate([
            'project_id' => $project->id,
            'user_id' => $userId,
            'content' => $content,
            'kind' => $kind,
            'target_type' => $targetType,
            'target_title' => $targetTitle,
            'for_date' => $forDate,
        ]);
    }

    private function feedbackContext(Project $project): string
    {
        return $project->planningFeedback()
            ->latest()
            ->limit(10)
            ->get()
            ->reverse()
            ->values()
            ->map(function (ProjectPlanningFeedback $feedback): string {
                $target = $feedback->target_title
                    ? " | {$feedback->target_type}: {$feedback->target_title}"
                    : '';

                return "- [{$feedback->for_date->toDateString()} | {$feedback->kind}{$target}] {$feedback->content}";
            })
            ->implode("\n");
    }
}
