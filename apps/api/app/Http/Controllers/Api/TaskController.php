<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function standaloneIndex(Request $request): AnonymousResourceCollection
    {
        $tasks = $request->user()
            ->tasks()
            ->whereNull('project_id')
            ->with('subtasks')
            ->latest()
            ->get();

        return TaskResource::collection($tasks);
    }

    public function standaloneStore(TaskRequest $request): TaskResource
    {
        $task = $request->user()->tasks()->create([
            ...$request->validated(),
            'project_id' => null,
            'source' => Task::SOURCE_MANUAL,
        ]);

        return new TaskResource($task->load('subtasks'));
    }

    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $this->authorize('view', $project);

        $query = $project->tasks()->with('subtasks')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority')->toString());
        }

        if ($request->filled('deadline')) {
            $query->whereDate('deadline', '<=', $request->date('deadline'));
        }

        return TaskResource::collection($query->get());
    }

    public function store(TaskRequest $request, Project $project): TaskResource
    {
        $this->authorize('update', $project);

        $task = $project->tasks()->create([
            ...$request->validated(),
            'user_id' => $project->user_id,
        ]);

        return new TaskResource($task->load('subtasks'));
    }

    public function show(Request $request, Task $task): TaskResource
    {
        $this->authorize('view', $task);

        return new TaskResource($task->load('subtasks'));
    }

    public function update(TaskRequest $request, Task $task): TaskResource
    {
        $this->authorize('update', $task);

        DB::transaction(function () use ($request, $task): void {
            $task->update($request->validated());

            if ($task->status === Task::STATUS_DONE) {
                $task->subtasks()->update(['status' => 'done']);
            }
        });

        return new TaskResource($task->refresh()->load('subtasks'));
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully.',
        ]);
    }
}
