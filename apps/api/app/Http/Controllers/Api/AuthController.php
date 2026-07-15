<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendRegistrationOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\EmailOtpService;
use App\Services\RecaptchaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request, EmailOtpService $otpService): JsonResponse
    {
        $request->merge([
            'username' => $this->registrationUsername($request),
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9_]+$/',
                'unique:users,username',
            ],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'otp' => ['required', 'string', 'digits:6'],
        ]);

        $otpService->consume($validated['email'], $validated['otp']);
        unset($validated['otp']);
        $validated['email_verified_at'] = now();
        $user = User::create($validated);
        auth()->guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registration successful.',
            'user' => new UserResource($user),
            'verification_email_sent' => false,
        ], 201);
    }

    public function sendRegistrationOtp(
        SendRegistrationOtpRequest $request,
        RecaptchaService $recaptcha,
        EmailOtpService $otpService,
    ): JsonResponse {
        $recaptcha->verify($request->validated('recaptcha_token'), $request->ip());

        try {
            $otpService->send($request->validated('email'));
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        return response()->json(['message' => 'OTP sent. It expires in 10 minutes.']);
    }

    public function login(Request $request): JsonResponse
    {
        $identifier = trim((string) ($request->input('identifier') ?? $request->input('email')));
        $request->merge(['identifier' => $identifier]);
        $validated = $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        $normalizedIdentifier = Str::lower($validated['identifier']);
        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$normalizedIdentifier])
            ->orWhereRaw('LOWER(username) = ?', [$normalizedIdentifier])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => ['The provided credentials are incorrect.'],
            ]);
        }

        auth()->guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful.',
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        auth()->guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function updateMe(Request $request, EmailOtpService $otpService): JsonResponse
    {
        $user = $request->user();
        $request->merge([
            'username' => Str::lower(trim((string) ($request->input('username') ?? $user->username))),
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $emailChanged = $validated['email'] !== $user->email;
        $user->fill($validated);

        if ($emailChanged) {
            $user->email_verified_at = null;
        }

        $user->save();

        $verificationEmailSent = null;
        if ($emailChanged) {
            try {
                $otpService->send($user->email);
                $verificationEmailSent = true;
            } catch (\RuntimeException) {
                $verificationEmailSent = false;
            }
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => new UserResource($user),
            'verification_email_sent' => $verificationEmailSent,
        ]);
    }

    public function sendVerificationEmail(Request $request, EmailOtpService $otpService): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at !== null) {
            return response()->json([
                'message' => 'Email is already verified.',
                'verification_email_sent' => false,
            ]);
        }

        try {
            $otpService->send($user->email);
        } catch (\RuntimeException) {
            return response()->json([
                'message' => 'Unable to send the verification code. Please try again later.',
                'verification_email_sent' => false,
            ], 503);
        }

        return response()->json([
            'message' => 'Verification code sent. It expires in 10 minutes.',
            'verification_email_sent' => true,
        ]);
    }

    public function verifyEmailOtp(Request $request, EmailOtpService $otpService): JsonResponse
    {
        $validated = $request->validate([
            'otp' => ['required', 'string', 'digits:6'],
        ]);
        $user = $request->user();

        $otpService->consume($user->email, $validated['otp']);
        $user->forceFill(['email_verified_at' => now()])->save();

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => new UserResource($user->refresh()),
        ]);
    }

    private function registrationUsername(Request $request): string
    {
        $provided = Str::lower(trim((string) $request->input('username')));

        if ($provided !== '') {
            return $provided;
        }

        $localPart = Str::before((string) $request->input('email'), '@');
        $base = Str::lower(Str::ascii($localPart));
        $base = trim((string) preg_replace('/[^a-z0-9_]+/', '_', $base), '_');
        $base = strlen($base) >= 3 ? substr($base, 0, 30) : 'user';
        $candidate = $base;
        $suffix = 1;

        while (User::where('username', $candidate)->exists()) {
            $ending = '_'.($suffix++);
            $candidate = substr($base, 0, 30 - strlen($ending)).$ending;
        }

        return $candidate;
    }
}
