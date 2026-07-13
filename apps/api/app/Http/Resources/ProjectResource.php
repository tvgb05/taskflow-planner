<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $tasks = $this->whenLoaded('tasks');
        $tasksCount = $this->relationLoaded('tasks') ? $tasks->count() : (int) ($this->tasks_count ?? 0);
        $doneCount = $this->relationLoaded('tasks')
            ? $tasks->where('status', 'done')->count()
            : (int) ($this->done_tasks_count ?? 0);

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'description' => $this->description,
            'icon' => $this->icon ?? 'folder',
            'deadline' => $this->deadline?->toDateString(),
            'available_minutes_per_day' => $this->available_minutes_per_day,
            'tasks_count' => $tasksCount,
            'done_tasks_count' => $doneCount,
            'progress' => $tasksCount > 0 ? round(($doneCount / $tasksCount) * 100) : 0,
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
