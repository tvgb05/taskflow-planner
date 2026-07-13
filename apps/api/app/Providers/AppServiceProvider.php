<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)
            ->by(strtolower((string) $request->input('email')).'|'.$request->ip()));
        RateLimiter::for('verification', fn (Request $request) => Limit::perMinute(3)
            ->by((string) $request->user()?->id ?: $request->ip()));
        RateLimiter::for('ai', fn (Request $request) => Limit::perMinute(6)
            ->by((string) $request->user()?->id ?: $request->ip()));
        RateLimiter::for('registration-otp', fn (Request $request) => [
            Limit::perMinute(1)
                ->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(10)->by('registration-otp|'.$request->ip()),
        ]);
    }
}
