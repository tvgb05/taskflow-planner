<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'icon' => 'folder',
            'project_type' => Project::TYPE_SHORT_TERM,
            'planning_mode' => 'phased',
            'deadline' => today()->addDays(7),
            'available_minutes_per_day' => 120,
        ];
    }
}
