<?php

namespace App\Services;

use App\Models\RegistrationOtpCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class EmailOtpService
{
    public function __construct(private readonly NodemailerService $mailService) {}

    public function send(string $email): void
    {
        $code = (string) random_int(100000, 999999);
        $this->mailService->sendOtp($email, $code);

        RegistrationOtpCode::updateOrCreate(['email' => $email], [
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'consumed_at' => null,
        ]);
    }

    public function consume(string $email, string $code): void
    {
        $otp = RegistrationOtpCode::where('email', $email)->first();
        if (! $otp || $otp->consumed_at || $otp->expires_at->isPast() || $otp->attempts >= 5) {
            throw ValidationException::withMessages(['otp' => ['The OTP is invalid or expired. Request a new code.']]);
        }

        $otp->increment('attempts');
        if (! Hash::check($code, $otp->code_hash)) {
            throw ValidationException::withMessages(['otp' => ['The OTP is incorrect.']]);
        }

        $otp->update(['consumed_at' => now()]);
    }
}
