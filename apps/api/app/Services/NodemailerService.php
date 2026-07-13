<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class NodemailerService
{
    public function sendOtp(string $email, string $code): void
    {
        $endpoint = config('services.nodemailer.endpoint');
        $internalKey = config('services.nodemailer.internal_key');

        if (blank($endpoint) || blank($internalKey)) {
            throw new RuntimeException('Nodemailer is not configured. Set NODEMAILER_ENDPOINT and NODEMAILER_INTERNAL_KEY.');
        }

        try {
            $response = Http::withToken($internalKey)
                ->acceptJson()
                ->timeout(20)
                ->post($endpoint, ['to' => $email, 'code' => $code]);
        } catch (ConnectionException $exception) {
            Log::warning('Nodemailer service is unreachable.', [
                'email' => $email,
                'error' => $exception->getMessage(),
            ]);

            throw new RuntimeException('The email service is unavailable. Please try again later.');
        }

        if ($response->failed()) {
            Log::warning('Nodemailer OTP delivery failed.', [
                'email' => $email,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RuntimeException('Unable to send the OTP email through Gmail. Please try again later.');
        }
    }
}
