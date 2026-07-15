<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubtaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'title' => $this->title,
            'description' => $this->description,
            'resources' => $this->resources ?? [],
            'status' => $this->status,
            'estimated_minutes' => $this->estimated_minutes,
            'scheduled_date' => $this->scheduled_date?->toDateString(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
