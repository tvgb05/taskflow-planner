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
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
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
        $email = Str::lower(trim((string) $request->input('email')));
        $request->merge(['email' => $email]);
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$validated['email']])
            ->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $remember = (bool) ($validated['remember'] ?? false);
        $guard = auth()->guard('web');

        if ($remember) {
            $guard->setRememberDuration(30 * 24 * 60);
        }

        $guard->login($user, $remember);
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
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
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
}
