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

        if (($payload['plan_mode'] ?? 'phased') === 'pipeline') {
            $feedback = trim((string) ($payload['feedback'] ?? ''));

            if ($feedback !== '') {
                ProjectPlanningFeedback::create([
                    'project_id' => $project->id,
                    'user_id' => $request->user()->id,
                    'content' => $feedback,
                    'for_date' => today()->addDay(),
                ]);
            }

            $payload['feedback_context'] = $feedback !== ''
                ? $feedback
                : $project->planningFeedback()->latest()->value('content');
        }

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
}
