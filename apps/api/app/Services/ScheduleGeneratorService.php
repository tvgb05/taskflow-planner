<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Subtask;
use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScheduleGeneratorService
{
    /**
     * @return array<string, mixed>
     */
    public function generate(Project $project): array
    {
        $project->load('tasks.subtasks');

        $capacity = (int) $project->available_minutes_per_day;
        $startDate = CarbonImmutable::today();
        $endDate = CarbonImmutable::parse($project->deadline)->startOfDay();

        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages([
                'deadline' => ['Project deadline must be today or in the future to generate a schedule.'],
            ]);
        }

        $items = $this->incompleteSubtasks($project);
        $dates = [];
        $usedMinutesByDate = [];
        $schedule = [];
        $assignments = [];

        for ($date = $startDate; $date->lte($endDate); $date = $date->addDay()) {
            $dates[] = $date->toDateString();
        }

        foreach ($items as $item) {
            $subtask = $item['subtask'];
            $task = $item['task'];
            $minutes = (int) ($subtask->estimated_minutes ?? 30);

            if ($minutes > $capacity) {
                throw ValidationException::withMessages([
                    'available_minutes_per_day' => [
                        "Subtask '{$subtask->title}' needs {$minutes} minutes, which exceeds the daily capacity.",
                    ],
                ]);
            }

            $placed = false;

            foreach ($this->datesByAvailableLoad($dates, $usedMinutesByDate) as $dateKey) {
                $usedMinutesByDate[$dateKey] ??= 0;

                if ($capacity >= $usedMinutesByDate[$dateKey] + $minutes) {
                    $usedMinutesByDate[$dateKey] += $minutes;
                    $assignments[] = ['subtask' => $subtask, 'date' => $dateKey];

                    $schedule[$dateKey][] = [
                        'id' => $subtask->id,
                        'title' => $subtask->title,
                        'task_id' => $task->id,
                        'task_title' => $task->title,
                        'priority' => $task->priority,
                        'estimated_minutes' => $minutes,
                    ];

                    $placed = true;
                    break;
                }
            }

            if (! $placed) {
                throw ValidationException::withMessages([
                    'schedule' => ['There is not enough available time before the project deadline.'],
                ]);
            }
        }

        DB::transaction(function () use ($assignments): void {
            foreach ($assignments as $assignment) {
                $assignment['subtask']->update(['scheduled_date' => $assignment['date']]);
            }
        });

        return [
            'project_id' => $project->id,
            'daily_capacity_minutes' => $capacity,
            'schedule' => collect($schedule)
                ->sortKeys()
                ->map(function (array $subtasks, string $date) use ($usedMinutesByDate): array {
                    return [
                        'date' => $date,
                        'used_minutes' => $usedMinutesByDate[$date] ?? 0,
                        'subtasks' => $subtasks,
                    ];
                })->values()->all(),
        ];
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
     * @return Collection<int, array{task: Task, subtask: Subtask}>
     */
    private function incompleteSubtasks(Project $project): Collection
    {
        return $project->tasks
            ->flatMap(fn (Task $task) => $task->subtasks
                ->where('status', 'todo')
                ->map(fn ($subtask) => ['task' => $task, 'subtask' => $subtask]))
            ->sortBy(function (array $item): string {
                $task = $item['task'];
                $subtask = $item['subtask'];

                return implode('|', [
                    $this->priorityWeight($task->priority),
                    $task->deadline?->format('Y-m-d') ?? '9999-12-31',
                    $subtask->created_at?->format('Y-m-d H:i:s') ?? '',
                ]);
            })
            ->values();
    }

    private function priorityWeight(string $priority): int
    {
        return match ($priority) {
            'high' => 0,
            'medium' => 1,
            default => 2,
        };
    }
}
