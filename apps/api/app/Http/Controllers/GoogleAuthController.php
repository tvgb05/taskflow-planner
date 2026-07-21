<?php

namespace App\Http\Controllers;

use App\Models\User;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->frontendRedirect(['error' => 'google_not_configured']);
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->frontendRedirect(['error' => 'google_not_configured']);
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $exception) {
            report($exception);

            return $this->frontendRedirect(['error' => 'google_auth_failed']);
        }

        if (! $this->hasVerifiedEmail($googleUser)) {
            return $this->frontendRedirect(['error' => 'google_email_unverified']);
        }

        try {
            [$user, $isNewUser] = $this->resolveUser($googleUser);
        } catch (DomainException) {
            return $this->frontendRedirect(['error' => 'google_account_conflict']);
        } catch (Throwable $exception) {
            report($exception);

            return $this->frontendRedirect(['error' => 'google_auth_failed']);
        }

        $guard = auth()->guard('web');
        $guard->setRememberDuration(30 * 24 * 60);
        $guard->login($user, true);
        request()->session()->regenerate();

        return $this->frontendRedirect([
            'new_user' => $isNewUser ? '1' : '0',
        ]);
    }

    /**
     * @return array{0: User, 1: bool}
     */
    private function resolveUser(SocialiteUser $googleUser): array
    {
        $googleId = trim((string) $googleUser->getId());
        $email = Str::lower(trim((string) $googleUser->getEmail()));

        if ($googleId === '' || $email === '') {
            throw new DomainException('Google did not return a usable identity.');
        }

        return DB::transaction(function () use ($googleId, $email, $googleUser): array {
            $linkedUser = User::query()->where('google_id', $googleId)->lockForUpdate()->first();

            if ($linkedUser) {
                if ($linkedUser->email === $email && $linkedUser->email_verified_at === null) {
                    $linkedUser->forceFill(['email_verified_at' => now()])->save();
                }

                return [$linkedUser, false];
            }

            $emailUser = User::query()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->lockForUpdate()
                ->first();

            if ($emailUser) {
                if ($emailUser->google_id !== null && $emailUser->google_id !== $googleId) {
                    throw new DomainException('This email is linked to another Google account.');
                }

                $emailUser->forceFill([
                    'google_id' => $googleId,
                    'email_verified_at' => $emailUser->email_verified_at ?? now(),
                ])->save();

                return [$emailUser, false];
            }

            $name = trim((string) $googleUser->getName());
            $user = User::query()->create([
                'name' => $name !== '' ? $name : Str::before($email, '@'),
                'email' => $email,
                'google_id' => $googleId,
                'email_verified_at' => now(),
                'password' => null,
            ]);

            return [$user, true];
        });
    }

    private function hasVerifiedEmail(SocialiteUser $googleUser): bool
    {
        $email = trim((string) $googleUser->getEmail());
        $verified = data_get(
            $googleUser->user,
            'email_verified',
            data_get($googleUser->user, 'verified_email', false),
        );

        return $email !== '' && filter_var($verified, FILTER_VALIDATE_BOOL);
    }

    private function isConfigured(): bool
    {
        return collect([
            config('services.google.client_id'),
            config('services.google.client_secret'),
            config('services.google.redirect'),
        ])->every(fn (mixed $value): bool => is_string($value) && trim($value) !== '');
    }

    /**
     * @param  array<string, string>  $query
     */
    private function frontendRedirect(array $query): RedirectResponse
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        return redirect()->away(
            $frontendUrl.'/auth/google/complete?'.http_build_query($query),
        );
    }
}
