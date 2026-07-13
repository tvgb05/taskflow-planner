<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubtaskRequest;
use App\Http\Resources\SubtaskResource;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class SubtaskController extends Controller
{
    public function index(Request $request, Task $task): AnonymousResourceCollection
    {
        $this->authorize('view', $task);

        return SubtaskResource::collection($task->subtasks()->latest()->get());
    }

    public function store(SubtaskRequest $request, Task $task): SubtaskResource
    {
        $this->authorize('update', $task);

        $subtask = $task->subtasks()->create($request->validated());

        return new SubtaskResource($subtask);
    }

    public function update(SubtaskRequest $request, Subtask $subtask): SubtaskResource
    {
        $this->authorize('update', $subtask);

        DB::transaction(function () use ($request, $subtask): void {
            $subtask->update($request->validated());

            if ($subtask->status === 'todo' && $subtask->task->status === 'done') {
                $subtask->task->update(['status' => 'todo']);
            }
        });

        return new SubtaskResource($subtask);
    }

    public function destroy(Request $request, Subtask $subtask): JsonResponse
    {
        $this->authorize('delete', $subtask);

        $subtask->delete();

        return response()->json([
            'message' => 'Subtask deleted successfully.',
        ]);
    }
}
