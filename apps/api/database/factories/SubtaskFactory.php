<?php

namespace Database\Factories;

use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubtaskFactory extends Factory
{
    protected $model = Subtask::class;

    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->sentence(),
            'status' => 'todo',
            'estimated_minutes' => 30,
            'scheduled_date' => null,
        ];
    }
}
