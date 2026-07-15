<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->sentence(),
            'source' => Task::SOURCE_MANUAL,
            'status' => 'todo',
            'priority' => 'medium',
            'deadline' => null,
            'estimated_minutes' => 60,
        ];
    }
}
