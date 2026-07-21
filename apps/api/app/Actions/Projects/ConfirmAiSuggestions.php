<?php

namespace App\Actions\Projects;

use App\Models\Project;
use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class ConfirmAiSuggestions
{
    public function handle(Project $project, array $payload): Project
    {
        return DB::transaction(function () use ($project, $payload): Project {
            $cycles = (int) ($payload['recurrence_cycles'] ?? 1);

            foreach ($payload['tasks'] as $taskData) {
                $subtasks = $taskData['subtasks'];
                unset($taskData['subtasks']);
                $repeatWeekly = (bool) ($taskData['repeat_weekly'] ?? false);
                unset($taskData['repeat_weekly']);

                for ($cycle = 0; $cycle < ($repeatWeekly ? $cycles : 1); $cycle++) {
                    $deadline = CarbonImmutable::parse($taskData['deadline'])->addWeeks($cycle);
                    if ($deadline->gt($project->deadline)) {
                        break;
                    }

                    $task = $project->tasks()->create([
                        ...$taskData,
                        'user_id' => $project->user_id,
                        'title' => $repeatWeekly ? 'Week '.($cycle + 1).': '.$taskData['title'] : $taskData['title'],
                        'phase' => $repeatWeekly ? 'Week '.($cycle + 1).' - '.($taskData['phase'] ?? 'Weekly plan') : $taskData['phase'],
                        'source' => Task::SOURCE_AI,
                        'status' => 'todo',
                        'deadline' => $deadline,
                    ]);

                    foreach ($subtasks as $subtaskData) {
                        $scheduledDate = isset($subtaskData['scheduled_date']) && $subtaskData['scheduled_date']
                            ? CarbonImmutable::parse($subtaskData['scheduled_date'])->addWeeks($cycle)
                            : null;
                        if ($scheduledDate && $scheduledDate->gt($project->deadline)) {
                            continue;
                        }

                        $task->subtasks()->create([
                            ...$subtaskData,
                            'scheduled_date' => $scheduledDate,
                            'status' => 'todo',
                        ]);
                    }
                }
            }

            return $project->refresh()->load('tasks.subtasks');
        });
    }
}
