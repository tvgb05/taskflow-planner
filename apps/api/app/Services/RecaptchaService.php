<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class RecaptchaService
{
    public function verify(?string $token, ?string $ip = null): void
    {
        if (! config('services.recaptcha.required')) {
            return;
        }

        $secret = config('services.recaptcha.secret');
        if (blank($secret) || blank($token)) {
            throw ValidationException::withMessages(['recaptcha_token' => ['Please complete reCAPTCHA before continuing.']]);
        }

        $response = Http::asForm()->timeout(10)->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => $secret,
            'response' => $token,
            'remoteip' => $ip,
        ]);

        if (! $response->successful() || ! $response->json('success')) {
            throw ValidationException::withMessages(['recaptcha_token' => ['reCAPTCHA verification failed. Please try again.']]);
        }
    }
}
