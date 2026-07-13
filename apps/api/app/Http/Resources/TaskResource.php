<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'title' => $this->title,
            'description' => $this->description,
            'phase' => $this->phase,
            'status' => $this->status,
            'priority' => $this->priority,
            'deadline' => $this->deadline?->toDateString(),
            'estimated_minutes' => $this->estimated_minutes,
            'subtasks' => SubtaskResource::collection($this->whenLoaded('subtasks')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
