<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectPlanningFeedback;
use App\Models\RegistrationOtpCode;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use App\Services\GeminiTaskBreakdownService;
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
                'resources' => [[
                    'title' => 'Laravel installation guide',
                    'url' => 'https://laravel.com/docs/installation',
                ]],
                'priority' => 'high',
                'deadline' => today()->addDay()->toDateString(),
                'estimated_minutes' => 60,
                'subtasks' => [[
                    'title' => 'Install dependencies',
                    'description' => 'Install PHP and Node dependencies and record versions.',
                    'resources' => [[
                        'title' => 'Next.js installation guide',
                        'url' => 'https://nextjs.org/docs/app/getting-started/installation',
                    ]],
                    'estimated_minutes' => 60,
                    'scheduled_date' => today()->toDateString(),
                ]],
            ]],
        ]);

        $response->assertOk()->assertJsonPath('data.tasks.0.subtasks.0.title', 'Install dependencies');
        $this->assertDatabaseCount('tasks', 1);
        $this->assertDatabaseCount('subtasks', 1);
        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'source' => Task::SOURCE_AI,
        ]);
        $this->assertSame(
            [['title' => 'Laravel installation guide', 'url' => 'https://laravel.com/docs/installation']],
            Task::query()->firstOrFail()->resources,
        );
        $this->assertSame(
            [['title' => 'Next.js installation guide', 'url' => 'https://nextjs.org/docs/app/getting-started/installation']],
            Subtask::query()->firstOrFail()->resources,
        );
    }

    public function test_a_project_can_be_classified_when_it_is_created(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/projects', [
            'name' => 'Build a sustainable study routine',
            'description' => 'Plan study work across the semester.',
            'icon' => 'book',
            'project_type' => Project::TYPE_LONG_TERM,
            'planning_mode' => 'recurring',
            'deadline' => today()->addMonth()->toDateString(),
            'available_minutes_per_day' => 90,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.project_type', Project::TYPE_LONG_TERM)
            ->assertJsonPath('data.planning_mode', 'recurring');
        $this->assertDatabaseHas('projects', [
            'user_id' => $user->id,
            'project_type' => Project::TYPE_LONG_TERM,
            'planning_mode' => 'recurring',
        ]);
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
        $this->assertDatabaseHas('project_planning_feedback', [
            'project_id' => $project->id,
            'user_id' => $user->id,
            'kind' => 'regeneration',
            'target_type' => 'task',
            'target_title' => 'Set up environment',
            'content' => 'Make the setup steps safer and easier to verify.',
        ]);
        Http::assertSent(fn ($request) => str_contains(
            (string) data_get($request->data(), 'contents.0.parts.0.text'),
            'Make the setup steps safer and easier to verify.',
        ));
    }

    public function test_a_single_ai_draft_subtask_can_be_regenerated_with_remembered_feedback(): void
    {
        Carbon::setTestNow('2026-07-15 09:00:00');
        config()->set('services.gemini.key', 'gemini-test-key');
        config()->set('services.gemini.model', 'gemini-test-model');
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create([
            'deadline' => '2026-07-17',
            'available_minutes_per_day' => 120,
        ]);
        ProjectPlanningFeedback::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'content' => 'Prefer steps with a clear verification command.',
            'kind' => 'daily',
            'for_date' => '2026-07-15',
        ]);
        Sanctum::actingAs($user);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode(['tasks' => [[
                                'title' => 'Set up the application',
                                'phase' => 'Foundation',
                                'description' => 'Parent task response wrapper.',
                                'deadline' => '2026-07-16',
                                'estimated_minutes' => 45,
                                'priority' => 'high',
                                'subtasks' => [[
                                    'title' => 'Configure and verify the database connection',
                                    'description' => 'Set the database variables, run migrations, and verify the connection with the framework status command.',
                                    'estimated_minutes' => 45,
                                    'scheduled_date' => '2026-07-15',
                                ]],
                            ]]]),
                        ]],
                    ],
                ]],
            ]),
        ]);

        $currentTask = [
            'title' => 'Set up the application',
            'phase' => 'Foundation',
            'description' => 'Install and configure the development environment.',
            'deadline' => '2026-07-16',
            'estimated_minutes' => 90,
            'priority' => 'high',
            'repeat_weekly' => false,
            'subtasks' => [[
                'title' => 'Configure the database',
                'description' => 'Set database variables.',
                'estimated_minutes' => 45,
                'scheduled_date' => '2026-07-15',
            ], [
                'title' => 'Start the applications',
                'description' => 'Start both development servers.',
                'estimated_minutes' => 45,
                'scheduled_date' => '2026-07-16',
            ]],
        ];
        $currentSubtask = $currentTask['subtasks'][0];

        $response = $this->postJson("/api/projects/{$project->id}/ai-breakdown", [
            'goal' => 'Build a Laravel and React planner',
            'deadline' => '2026-07-17',
            'available_minutes_per_day' => 120,
            'language' => 'en',
            'plan_mode' => 'phased',
            'create_subtasks' => true,
            'min_tasks' => 1,
            'max_tasks' => 1,
            'min_subtasks' => 1,
            'max_subtasks' => 1,
            'reprompt_feedback' => 'Include the exact verification command and expected result.',
            'current_task' => $currentTask,
            'current_subtask' => $currentSubtask,
        ]);

        $response->assertOk()
            ->assertJsonCount(1, 'tasks')
            ->assertJsonCount(1, 'tasks.0.subtasks')
            ->assertJsonPath('tasks.0.subtasks.0.title', 'Configure and verify the database connection');
        $this->assertDatabaseHas('project_planning_feedback', [
            'project_id' => $project->id,
            'user_id' => $user->id,
            'kind' => 'regeneration',
            'target_type' => 'subtask',
            'target_title' => 'Configure the database',
            'content' => 'Include the exact verification command and expected result.',
        ]);
        Http::assertSent(function ($request): bool {
            $prompt = (string) data_get($request->data(), 'contents.0.parts.0.text');

            return str_contains($prompt, 'Focused subtask revision request:')
                && str_contains($prompt, 'Prefer steps with a clear verification command.')
                && str_contains($prompt, 'Include the exact verification command and expected result.');
        });
    }

    public function test_ai_task_format_learning_uses_only_manual_tasks_and_can_be_disabled(): void
    {
        Carbon::setTestNow('2026-07-15 09:00:00');
        config()->set('services.gemini.key', 'gemini-test-key');
        config()->set('services.gemini.model', 'gemini-test-model');
        $user = User::factory()->create();
        $project = Project::factory()->for($user)->create([
            'project_type' => Project::TYPE_LONG_TERM,
            'deadline' => '2026-07-18',
            'available_minutes_per_day' => 120,
        ]);
        $manualTask = Task::factory()->for($project)->create([
            'title' => 'Manual pattern: outcome, method, and acceptance check',
            'source' => Task::SOURCE_MANUAL,
        ]);
        $standaloneTask = Task::factory()->create([
            'user_id' => $user->id,
            'project_id' => null,
            'title' => 'One-off pattern: concise independent result',
            'source' => Task::SOURCE_MANUAL,
        ]);
        Subtask::factory()->for($manualTask)->create([
            'title' => 'Manual verification step',
            'description' => 'Run a concrete check and record its result.',
        ]);
        Task::factory()->for($project)->create([
            'title' => 'AI-generated task that must not become a style example',
            'source' => Task::SOURCE_AI,
        ]);
        Sanctum::actingAs($user);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode(['tasks' => [[
                                'title' => 'Create the first measurable milestone',
                                'phase' => 'Milestone 1',
                                'description' => 'Deliver and verify the first project milestone.',
                                'deadline' => '2026-07-16',
                                'estimated_minutes' => 45,
                                'priority' => 'high',
                                'subtasks' => [[
                                    'title' => 'Complete the milestone output',
                                    'description' => 'Produce the output and verify it against the stated acceptance check.',
                                    'estimated_minutes' => 45,
                                    'scheduled_date' => '2026-07-15',
                                ]],
                            ]]]),
                        ]],
                    ],
                ]],
            ]),
        ]);

        $basePayload = [
            'goal' => 'Complete a long-term learning project',
            'deadline' => '2026-07-18',
            'available_minutes_per_day' => 120,
            'language' => 'en',
            'plan_mode' => 'phased',
            'create_subtasks' => true,
            'min_tasks' => 1,
            'max_tasks' => 1,
            'min_subtasks' => 1,
            'max_subtasks' => 1,
        ];

        $this->postJson("/api/projects/{$project->id}/ai-breakdown", [
            ...$basePayload,
            'learn_from_user_tasks' => true,
        ])->assertOk();
        $this->postJson("/api/projects/{$project->id}/ai-breakdown", [
            ...$basePayload,
            'learn_from_user_tasks' => false,
        ])->assertOk();

        $recorded = Http::recorded();
        $learningPrompt = (string) data_get($recorded[0][0]->data(), 'contents.0.parts.0.text');
        $disabledPrompt = (string) data_get($recorded[1][0]->data(), 'contents.0.parts.0.text');

        $this->assertStringContainsString('Project type: long_term.', $learningPrompt);
        $this->assertStringContainsString($manualTask->title, $learningPrompt);
        $this->assertStringContainsString($standaloneTask->title, $learningPrompt);
        $this->assertStringContainsString('Manual verification step', $learningPrompt);
        $this->assertStringNotContainsString('AI-generated task that must not become a style example', $learningPrompt);
        $this->assertStringNotContainsString($manualTask->title, $disabledPrompt);
        $this->assertStringNotContainsString($standaloneTask->title, $disabledPrompt);
        $this->assertStringContainsString('task-format learning is disabled', $disabledPrompt);
    }

    public function test_gemini_retries_the_configured_model_when_it_is_temporarily_unavailable(): void
    {
        Carbon::setTestNow('2026-07-15 09:00:00');
        config()->set('services.gemini.key', 'gemini-test-key');
        config()->set('services.gemini.model', 'gemini-test-model');
        config()->set('services.gemini.retry_attempts', 2);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                ->push([
                    'error' => ['message' => 'The model is currently experiencing high demand.'],
                ], 503)
                ->push([
                    'candidates' => [[
                        'content' => [
                            'parts' => [[
                                'text' => json_encode(['tasks' => [[
                                    'title' => 'Prepare the crochet materials',
                                    'phase' => 'Preparation',
                                    'description' => 'Choose beginner-friendly yarn and a matching hook, then verify the gauge.',
                                    'resources' => [],
                                    'deadline' => '2026-07-16',
                                    'estimated_minutes' => 30,
                                    'priority' => 'high',
                                    'subtasks' => [[
                                        'title' => 'Choose yarn and hook',
                                        'description' => 'Select medium yarn and the recommended hook size, then make a small test chain.',
                                        'resources' => [],
                                        'estimated_minutes' => 30,
                                        'scheduled_date' => '2026-07-15',
                                    ]],
                                ]]]),
                            ]],
                        ],
                    ]],
                ]),
        ]);

        $result = app(GeminiTaskBreakdownService::class)->suggest([
            'goal' => 'Crochet a simple tote bag for a beginner.',
            'deadline' => '2026-07-16',
            'available_minutes_per_day' => 60,
            'language' => 'en',
            'plan_mode' => 'phased',
            'create_subtasks' => true,
            'min_tasks' => 1,
            'max_tasks' => 1,
            'min_subtasks' => 1,
            'max_subtasks' => 1,
        ]);

        $this->assertSame('Prepare the crochet materials', $result['tasks'][0]['title']);
        $recorded = Http::recorded();
        $this->assertCount(2, $recorded);
        $this->assertStringContainsString('/models/gemini-test-model:generateContent', $recorded[0][0]->url());
        $this->assertStringContainsString('/models/gemini-test-model:generateContent', $recorded[1][0]->url());
        $this->assertSame(['gemini-test-key'], $recorded[1][0]->header('x-goog-api-key'));
        $this->assertStringNotContainsString('key=', $recorded[1][0]->url());
        $this->assertSame(
            'object',
            data_get($recorded[1][0]->data(), 'generationConfig.responseJsonSchema.type'),
        );
    }

    public function test_gemini_retries_without_response_schema_when_the_provider_rejects_it(): void
    {
        Carbon::setTestNow('2026-07-16 09:00:00');
        config()->set('services.gemini.key', 'gemini-test-key');
        config()->set('services.gemini.model', 'gemini-test-model');
        config()->set('services.gemini.retry_attempts', 1);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                ->push([
                    'error' => [
                        'code' => 400,
                        'message' => 'Request contains an invalid argument.',
                        'status' => 'INVALID_ARGUMENT',
                    ],
                ], 400)
                ->push([
                    'candidates' => [[
                        'content' => [
                            'parts' => [[
                                'text' => json_encode(['tasks' => [[
                                    'title' => 'Prepare the crochet materials',
                                    'phase' => 'Preparation',
                                    'description' => 'Choose beginner-friendly yarn and a matching hook, then verify the gauge.',
                                    'resources' => [],
                                    'deadline' => '2026-07-17',
                                    'estimated_minutes' => 30,
                                    'priority' => 'high',
                                    'subtasks' => [[
                                        'title' => 'Choose yarn and hook',
                                        'description' => 'Select medium yarn and the recommended hook size, then make a small test chain.',
                                        'resources' => [],
                                        'estimated_minutes' => 30,
                                        'scheduled_date' => '2026-07-16',
                                    ]],
                                ]]]),
                            ]],
                        ],
                    ]],
                ]),
        ]);

        $result = app(GeminiTaskBreakdownService::class)->suggest([
            'goal' => 'Crochet a simple tote bag for a beginner.',
            'deadline' => '2026-07-17',
            'available_minutes_per_day' => 60,
            'language' => 'en',
            'plan_mode' => 'phased',
            'create_subtasks' => true,
            'min_tasks' => 1,
            'max_tasks' => 1,
            'min_subtasks' => 1,
            'max_subtasks' => 1,
        ]);

        $this->assertSame('Prepare the crochet materials', $result['tasks'][0]['title']);
        $recorded = Http::recorded();
        $this->assertCount(2, $recorded);
        $this->assertSame(
            'object',
            data_get($recorded[0][0]->data(), 'generationConfig.responseJsonSchema.type'),
        );
        $this->assertNull(
            data_get($recorded[1][0]->data(), 'generationConfig.responseJsonSchema'),
        );
        $this->assertStringContainsString('/models/gemini-test-model:generateContent', $recorded[1][0]->url());
    }

    public function test_gemini_does_not_retry_when_the_model_quota_is_exhausted(): void
    {
        Carbon::setTestNow('2026-07-16 09:00:00');
        config()->set('services.gemini.key', 'gemini-test-key');
        config()->set('services.gemini.model', 'gemini-test-model');
        config()->set('services.gemini.retry_attempts', 3);
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'error' => ['message' => 'Quota exceeded for this project.'],
            ], 429),
        ]);

        try {
            app(GeminiTaskBreakdownService::class)->suggest([
                'goal' => 'Crochet a simple tote bag for a beginner.',
                'deadline' => '2026-07-17',
                'available_minutes_per_day' => 60,
                'language' => 'en',
                'plan_mode' => 'phased',
                'create_subtasks' => true,
                'min_tasks' => 1,
                'max_tasks' => 1,
                'min_subtasks' => 1,
                'max_subtasks' => 1,
            ]);
            $this->fail('Expected the exhausted Gemini quota to stop the request.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('quota is currently exhausted', $exception->getMessage());
        }

        $this->assertCount(1, Http::recorded());
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
            ->assertJsonPath('data.email', 'public@example.com');
    }

    public function test_a_user_can_login_with_email(): void
    {
        $user = User::factory()->create([
            'email' => 'planner@example.com',
            'password' => 'password123',
        ]);
        $this->withHeader('Origin', 'http://localhost:3000');

        $this->postJson('/api/login', [
            'email' => 'planner@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.id', $user->id);

        $this->postJson('/api/logout')->assertOk();

        $this->postJson('/api/login', [
            'email' => 'PLANNER@EXAMPLE.COM',
            'password' => 'password123',
        ])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_a_user_can_stay_signed_in_for_thirty_days(): void
    {
        Carbon::setTestNow('2026-07-16 09:00:00');
        $user = User::factory()->create([
            'email' => 'remember@example.com',
            'password' => 'password123',
        ]);
        $this->withHeader('Origin', 'http://localhost:3000');

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
            'remember' => true,
        ]);
        $recallerName = auth()->guard('web')->getRecallerName();
        $recallerCookie = collect($response->headers->getCookies())
            ->first(fn ($cookie): bool => $cookie->getName() === $recallerName);

        $response->assertOk()->assertCookie($recallerName);
        $this->assertNotNull($recallerCookie);
        $this->assertEqualsWithDelta(
            now()->addDays(30)->timestamp,
            $recallerCookie->getExpiresTime(),
            5,
        );
        $this->assertNotNull($user->refresh()->remember_token);
    }

    public function test_a_user_cannot_change_to_an_existing_email(): void
    {
        $user = User::factory()->create(['email' => 'first@example.com']);
        User::factory()->create(['email' => 'taken@example.com']);
        Sanctum::actingAs($user);

        $this->putJson('/api/me', [
            'name' => $user->name,
            'email' => 'taken@example.com',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertSame('first@example.com', $user->refresh()->email);
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
