<?php

use App\Http\Controllers\Api\AiBreakdownController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConfirmAiSuggestionsController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SubtaskController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/register/otp', [AuthController::class, 'sendRegistrationOtp'])->middleware('throttle:registration-otp');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateMe']);
    Route::post('/email/verification-notification', [AuthController::class, 'sendVerificationEmail'])->middleware('throttle:verification');
    Route::post('/email/verify-otp', [AuthController::class, 'verifyEmailOtp'])->middleware('throttle:verification');

    Route::apiResource('projects', ProjectController::class);

    Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
    Route::get('/tasks', [TaskController::class, 'standaloneIndex']);
    Route::post('/tasks', [TaskController::class, 'standaloneStore']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    Route::get('/tasks/{task}/subtasks', [SubtaskController::class, 'index']);
    Route::post('/tasks/{task}/subtasks', [SubtaskController::class, 'store']);
    Route::put('/subtasks/{subtask}', [SubtaskController::class, 'update']);
    Route::delete('/subtasks/{subtask}', [SubtaskController::class, 'destroy']);

    Route::post('/projects/{project}/generate-schedule', [ScheduleController::class, 'store']);
    Route::post('/projects/{project}/ai-breakdown', [AiBreakdownController::class, 'store'])->middleware('throttle:ai');
    Route::post('/projects/{project}/ai-breakdown/confirm', [ConfirmAiSuggestionsController::class, 'store'])->middleware('throttle:ai');
});
