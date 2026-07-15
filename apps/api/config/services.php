<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Nodemailer, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'nodemailer' => [
        'endpoint' => env('NODEMAILER_ENDPOINT', 'http://localhost:3000/api/internal/send-otp'),
        'internal_key' => env('NODEMAILER_INTERNAL_KEY'),
    ],

    'recaptcha' => [
        'secret' => env('RECAPTCHA_SECRET_KEY'),
        'required' => env('RECAPTCHA_REQUIRED', false),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.5-flash'),
        'fallback_model' => env('GEMINI_FALLBACK_MODEL', 'gemini-3.1-flash-lite'),
        'retry_attempts' => env('GEMINI_RETRY_ATTEMPTS', 3),
        'primary_timeout' => env('GEMINI_PRIMARY_TIMEOUT', 20),
        'timeout' => env('GEMINI_TIMEOUT', 90),
    ],

];
