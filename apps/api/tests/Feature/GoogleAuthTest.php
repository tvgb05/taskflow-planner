<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('app.frontend_url', 'https://taskflow-planner.test');
        config()->set('services.google', [
            'client_id' => 'google-client-id',
            'client_secret' => 'google-client-secret',
            'redirect' => 'https://taskflow-planner.test/backend/api/auth/google/callback',
        ]);
    }

    public function test_google_redirect_starts_the_oauth_flow(): void
    {
        Socialite::fake('google');

        $this->get('/api/auth/google/redirect')->assertRedirect();
    }

    public function test_google_redirect_reports_missing_configuration(): void
    {
        config()->set('services.google.client_secret', null);

        $this->get('/api/auth/google/redirect')->assertRedirect(
            'https://taskflow-planner.test/auth/google/complete?error=google_not_configured',
        );
    }

    public function test_a_verified_google_identity_creates_and_logs_in_a_new_user(): void
    {
        Socialite::fake('google', $this->googleUser(
            id: 'google-user-123',
            email: 'new-user@example.com',
            name: 'New Google User',
        ));

        $response = $this->get('/api/auth/google/callback');

        $response->assertRedirect(
            'https://taskflow-planner.test/auth/google/complete?new_user=1',
        );
        $this->assertDatabaseHas('users', [
            'name' => 'New Google User',
            'email' => 'new-user@example.com',
            'google_id' => 'google-user-123',
            'password' => null,
        ]);
        $user = User::query()->where('google_id', 'google-user-123')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);
        $this->assertAuthenticatedAs($user);
    }

    public function test_google_links_to_an_existing_local_account_with_the_same_verified_email(): void
    {
        $passwordHash = Hash::make('existing-password');
        $user = User::factory()->create([
            'email' => 'member@example.com',
            'email_verified_at' => null,
            'password' => $passwordHash,
        ]);
        Socialite::fake('google', $this->googleUser(
            id: 'google-member-456',
            email: 'MEMBER@example.com',
            name: 'Different Google Name',
        ));

        $this->get('/api/auth/google/callback')->assertRedirect(
            'https://taskflow-planner.test/auth/google/complete?new_user=0',
        );

        $user->refresh();
        $this->assertDatabaseCount('users', 1);
        $this->assertSame('google-member-456', $user->google_id);
        $this->assertSame($passwordHash, $user->password);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('member@example.com', $user->email);
        $this->assertAuthenticatedAs($user);
    }

    public function test_google_rejects_an_unverified_email(): void
    {
        Socialite::fake('google', $this->googleUser(
            id: 'google-unverified',
            email: 'unverified@example.com',
            name: 'Unverified User',
            verified: false,
        ));

        $this->get('/api/auth/google/callback')->assertRedirect(
            'https://taskflow-planner.test/auth/google/complete?error=google_email_unverified',
        );
        $this->assertDatabaseCount('users', 0);
        $this->assertGuest();
    }

    public function test_google_does_not_replace_a_different_linked_identity(): void
    {
        User::factory()->create([
            'email' => 'linked@example.com',
            'google_id' => 'original-google-id',
        ]);
        Socialite::fake('google', $this->googleUser(
            id: 'different-google-id',
            email: 'linked@example.com',
            name: 'Conflicting User',
        ));

        $this->get('/api/auth/google/callback')->assertRedirect(
            'https://taskflow-planner.test/auth/google/complete?error=google_account_conflict',
        );
        $this->assertDatabaseMissing('users', [
            'email' => 'linked@example.com',
            'google_id' => 'different-google-id',
        ]);
        $this->assertGuest();
    }

    public function test_a_google_only_user_gets_a_normal_error_from_password_login(): void
    {
        User::factory()->create([
            'email' => 'google-only@example.com',
            'google_id' => 'google-only-id',
            'password' => null,
        ]);

        $this->postJson('/api/login', [
            'email' => 'google-only@example.com',
            'password' => 'not-a-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    private function googleUser(
        string $id,
        string $email,
        string $name,
        bool $verified = true,
    ): SocialiteUser {
        return SocialiteUser::fake([
            'id' => $id,
            'sub' => $id,
            'email' => $email,
            'email_verified' => $verified,
            'name' => $name,
        ]);
    }
}
