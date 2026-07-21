<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StandaloneTaskTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_a_user_can_create_and_list_a_standalone_task(): void
    {
        Carbon::setTestNow('2026-07-20 09:00:00');
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Send the project update',
            'description' => 'Summarize progress and send the update to the team.',
            'status' => Task::STATUS_TODO,
            'priority' => Task::PRIORITY_HIGH,
            'deadline' => '2026-07-21',
            'estimated_minutes' => 30,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.project_id', null)
            ->assertJsonPath('data.standalone', true)
            ->assertJsonPath('data.title', 'Send the project update');
        $this->assertDatabaseHas('tasks', [
            'user_id' => $user->id,
            'project_id' => null,
            'source' => Task::SOURCE_MANUAL,
            'title' => 'Send the project update',
        ]);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Send the project update');
    }

    public function test_a_standalone_task_deadline_cannot_be_in_the_past(): void
    {
        Carbon::setTestNow('2026-07-20 09:00:00');
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/tasks', [
            'title' => 'Already overdue task',
            'status' => Task::STATUS_TODO,
            'priority' => Task::PRIORITY_MEDIUM,
            'deadline' => '2026-07-19',
        ])->assertUnprocessable()->assertJsonValidationErrors('deadline');

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_an_overdue_standalone_task_can_be_completed_without_changing_its_deadline(): void
    {
        Carbon::setTestNow('2026-07-20 09:00:00');
        $user = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'project_id' => null,
            'deadline' => '2026-07-19',
        ]);
        Sanctum::actingAs($user);

        $this->putJson("/api/tasks/{$task->id}", [
            'title' => $task->title,
            'description' => $task->description,
            'status' => Task::STATUS_DONE,
            'priority' => $task->priority,
            'deadline' => '2026-07-19',
            'estimated_minutes' => $task->estimated_minutes,
        ])->assertOk()->assertJsonPath('data.status', Task::STATUS_DONE);

        $this->putJson("/api/tasks/{$task->id}", [
            'title' => $task->title,
            'description' => $task->description,
            'status' => Task::STATUS_DONE,
            'priority' => $task->priority,
            'deadline' => '2026-07-18',
            'estimated_minutes' => $task->estimated_minutes,
        ])->assertUnprocessable()->assertJsonValidationErrors('deadline');
    }

    public function test_a_user_cannot_access_another_users_standalone_task(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = Task::factory()->create([
            'user_id' => $owner->id,
            'project_id' => null,
        ]);
        Sanctum::actingAs($intruder);

        $this->getJson('/api/tasks')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/tasks/{$task->id}")->assertForbidden();
        $this->putJson("/api/tasks/{$task->id}", [])->assertForbidden();
        $this->deleteJson("/api/tasks/{$task->id}")->assertForbidden();
    }
}
