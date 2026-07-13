<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\ScheduleGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function store(Request $request, Project $project, ScheduleGeneratorService $service): JsonResponse
    {
        $this->authorize('update', $project);

        return response()->json($service->generate($project));
    }
}
