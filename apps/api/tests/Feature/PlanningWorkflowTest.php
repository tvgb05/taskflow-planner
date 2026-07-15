<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\RegistrationOtpCode;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlanningWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_a_user_cannot_access_another_users_project_graph(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $project = Project::factory()->for($owner)->create();
        $task = Task::factory()->for($project)->create();
        $subtask = Subtask::factory()->for($task)->create();
        Sanctum::actingAs($intruder);

        $this->getJson("/api/projects/{$project->id}")->assertForbidden();
        $this->putJson("/api/tasks/{$task->id}", [])->assertForbidden();
        $this->deleteJson("/api/subtasks/{$subtask->id}")->assertForbidden();
    }

    public function test_ai_suggestions_are_confirmed_as_one_project_graph(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create(['deadline' => today()->addDays(2)]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/ai-breakdown/confirm", [
            'tasks' => [[
                'title' => 'Set up the application',
                'phase' => 'Phase 1: Foundation',
                'description' => 'Prepare both runtimes and verify connectivity.',
                'priority' => 'high',
                'deadline' => today()->addDay()->toDateString(),
                'estimated_minutes' => 60,
                'subtasks' => [[
                    'title' => 'Install dependencies',
                    'description' => 'Install PHP and Node dependencies and record versions.',
                    'estimated_minutes' => 60,
                    'scheduled_date' => today()->toDateString(),
                ]],
            ]],
        ]);

        $response->assertOk()->assertJsonPath('data.tasks.0.subtasks.0.title', 'Install dependencies');
        $this->assertDatabaseCount('tasks', 1);
        $this->assertDatabaseCount('subtasks', 1);
    }

    public function test_invalid_ai_confirmation_does_not_partially_persist(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create(['deadline' => today()->addDay()]);
        Sanctum::actingAs($user);

        $this->postJson("/api/projects/{$project->id}/ai-breakdown/confirm", [
            'tasks' => [[
                'title' => 'Valid task', 'priority' => 'high', 'subtasks' => [],
            ], [
                'title' => '', 'priority' => 'invalid', 'subtasks' => [],
            ]],
        ])->assertUnprocessable();

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_a_single_ai_draft_task_can_be_reprompted_without_replacing_the_other_drafts(): void
    {
        Carbon::setTestNow('2026-07-13 09:00:00');
        config()->set('services.gemini.key', 'gemini-test-key');
        config()->set('services.gemini.model', 'gemini-test-model');
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create([
            'deadline' => '2026-07-15',
            'available_minutes_per_day' => 120,
        ]);
        Sanctum::actingAs($user);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode(['tasks' => [[
                                'title' => 'Set up the development environment safely',
                                'phase' => 'Foundation',
                                'description' => 'Install the required tools and verify both applications start successfully.',
                                'deadline' => '2026-07-14',
                                'estimated_minutes' => 60,
                                'priority' => 'high',
                                'subtasks' => [[
                                    'title' => 'Install and verify dependencies',
                                    'description' => 'Install dependencies, start both servers, and record the working versions.',
                                    'estimated_minutes' => 60,
                                    'scheduled_date' => '2026-07-13',
                                ]],
                            ]]]),
                        ]],
                    ],
                ]],
            ]),
        ]);

        $response = $this->postJson("/api/projects/{$project->id}/ai-breakdown", [
            'goal' => 'Build a Laravel and React planner',
            'deadline' => '2026-07-15',
            'available_minutes_per_day' => 120,
            'language' => 'en',
            'plan_mode' => 'phased',
            'create_subtasks' => true,
            'min_tasks' => 1,
            'max_tasks' => 1,
            'min_subtasks' => 1,
            'max_subtasks' => 1,
            'reprompt_feedback' => 'Make the setup steps safer and easier to verify.',
            'current_task' => [
                'title' => 'Set up environment',
                'phase' => 'Phase 1: Foundation',
                'description' => 'Install tools.',
                'deadline' => '2026-07-14',
                'estimated_minutes' => 60,
                'priority' => 'high',
                'repeat_weekly' => false,
                'subtasks' => [[
                    'title' => 'Install dependencies',
                    'description' => 'Install dependencies.',
                    'estimated_minutes' => 60,
                    'scheduled_date' => '2026-07-13',
                ]],
            ],
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'tasks')
            ->assertJsonPath('tasks.0.title', 'Set up the development environment safely')
            ->assertJsonPath('tasks.0.phase', 'Phase 1: Foundation');
        Http::assertSent(fn ($request) => str_contains(
            (string) data_get($request->data(), 'contents.0.parts.0.text'),
            'Make the setup steps safer and easier to verify.',
        ));
    }

    public function test_completing_a_task_completes_its_subtasks(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create();
        $task = Task::factory()->for($project)->create();
        $subtask = Subtask::factory()->for($task)->create();
        Sanctum::actingAs($user);

        $this->putJson("/api/tasks/{$task->id}", [
            'title' => $task->title,
            'description' => $task->description,
            'status' => 'done',
            'priority' => $task->priority,
            'deadline' => null,
            'estimated_minutes' => 60,
        ])->assertOk();

        $this->assertSame('done', $subtask->refresh()->status);
    }

    public function test_task_deadline_must_be_between_today_and_the_project_deadline(): void
    {
        Carbon::setTestNow('2026-07-12 09:00:00');
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create(['deadline' => '2026-07-15']);
        Sanctum::actingAs($user);
        $payload = [
            'title' => 'Validate the planning window',
            'description' => null,
            'status' => 'todo',
            'priority' => 'medium',
            'estimated_minutes' => 30,
        ];

        $this->postJson("/api/projects/{$project->id}/tasks", [
            ...$payload,
            'deadline' => '2026-07-11',
        ])->assertUnprocessable()->assertJsonValidationErrors('deadline');

        $this->postJson("/api/projects/{$project->id}/tasks", [
            ...$payload,
            'deadline' => '2026-07-16',
        ])->assertUnprocessable()->assertJsonValidationErrors('deadline');

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_schedule_spreads_equal_work_across_today_and_tomorrow(): void
    {
        Carbon::setTestNow('2026-07-11 09:00:00');
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create([
            'deadline' => '2026-07-12',
            'available_minutes_per_day' => 60,
        ]);
        $task = Task::factory()->for($project)->create(['priority' => 'high']);
        Subtask::factory()->count(2)->for($task)->create(['estimated_minutes' => 60]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/projects/{$project->id}/generate-schedule");

        $response->assertOk()
            ->assertJsonPath('schedule.0.date', '2026-07-11')
            ->assertJsonPath('schedule.1.date', '2026-07-12');
    }

    public function test_registration_creates_a_session_without_returning_a_bearer_token(): void
    {
        RegistrationOtpCode::create([
            'email' => 'public@example.com',
            'code_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
        ]);
        $this->withHeader('Origin', 'http://localhost:3000');
        $response = $this->postJson('/api/register', [
            'name' => 'Public Demo',
            'email' => 'public@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'otp' => '123456',
        ]);

        $response->assertCreated()->assertJsonMissingPath('token');
        $this->getJson('/api/me')
            ->assertSuccessful()
            ->assertJsonPath('data.email', 'public@example.com')
            ->assertJsonPath('data.username', 'public');
    }

    public function test_a_user_can_login_with_either_email_or_username(): void
    {
        $user = User::factory()->create([
            'username' => 'morning_planner',
            'email' => 'planner@example.com',
            'password' => 'password123',
        ]);
        $this->withHeader('Origin', 'http://localhost:3000');

        $this->postJson('/api/login', [
            'identifier' => 'planner@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.id', $user->id);

        $this->postJson('/api/logout')->assertOk();

        $this->postJson('/api/login', [
            'identifier' => 'MORNING_PLANNER',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.id', $user->id);

        $this->postJson('/api/logout')->assertOk();

        $this->postJson('/api/login', [
            'email' => 'planner@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_a_user_cannot_change_to_an_existing_username(): void
    {
        $user = User::factory()->create(['username' => 'first_user']);
        User::factory()->create(['username' => 'taken_name']);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', [
            'name' => $user->name,
            'username' => 'taken_name',
            'email' => $user->email,
        ])->assertUnprocessable()->assertJsonValidationErrors('username');

        $this->assertSame('first_user', $user->refresh()->username);
    }

    public function test_registration_otp_is_sent_through_nodemailer(): void
    {
        config()->set('services.recaptcha.required', false);
        config()->set('services.nodemailer.endpoint', 'http://localhost:3000/api/internal/send-otp');
        config()->set('services.nodemailer.internal_key', 'internal-test-key');
        Http::fake([
            'http://localhost:3000/api/internal/send-otp' => Http::response(['messageId' => 'message-123']),
        ]);

        $this->postJson('/api/register/otp', [
            'email' => 'otp@example.com',
            'recaptcha_token' => null,
        ])->assertOk();

        $this->assertDatabaseHas('registration_otp_codes', ['email' => 'otp@example.com']);
        Http::assertSent(fn ($request) => $request->url() === 'http://localhost:3000/api/internal/send-otp'
            && $request['to'] === 'otp@example.com'
            && preg_match('/^\d{6}$/', $request['code']) === 1);

        $this->postJson('/api/register/otp', [
            'email' => 'otp@example.com',
            'recaptcha_token' => null,
        ])->assertTooManyRequests()->assertHeader('Retry-After');
    }

    public function test_an_authenticated_user_can_verify_their_email_with_an_otp(): void
    {
        $user = User::factory()->unverified()->create();
        RegistrationOtpCode::create([
            'email' => $user->email,
            'code_hash' => Hash::make('654321'),
            'expires_at' => now()->addMinutes(10),
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/email/verify-otp', ['otp' => '654321'])
            ->assertOk()
            ->assertJsonPath('user.email_verified', true);

        $this->assertNotNull($user->refresh()->email_verified_at);
    }
}
