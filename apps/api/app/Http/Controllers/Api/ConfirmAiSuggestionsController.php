<?php

namespace App\Http\Controllers\Api;

use App\Actions\Projects\ConfirmAiSuggestions;
use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmAiSuggestionsRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;

class ConfirmAiSuggestionsController extends Controller
{
    public function store(
        ConfirmAiSuggestionsRequest $request,
        Project $project,
        ConfirmAiSuggestions $action,
    ): ProjectResource {
        $this->authorize('update', $project);

        return new ProjectResource($action->handle($project, $request->validated()));
    }
}
