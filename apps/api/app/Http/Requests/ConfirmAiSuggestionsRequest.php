<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfirmAiSuggestionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = $this->route('project');

        return $this->user() !== null
            && ($project === null || $this->user()->can('update', $project));
    }

    public function rules(): array
    {
        $projectDeadline = $this->route('project')?->deadline?->toDateString();

        return [
            'recurrence_cycles' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'tasks' => ['required', 'array', 'min:1', 'max:12'],
            'tasks.*.title' => ['required', 'string', 'max:255'],
            'tasks.*.description' => ['nullable', 'string', 'max:1200'],
            'tasks.*.phase' => ['nullable', 'string', 'max:120'],
            'tasks.*.priority' => ['required', Rule::in(['low', 'medium', 'high'])],
            'tasks.*.deadline' => ['required', 'date', 'after_or_equal:today', "before_or_equal:{$projectDeadline}"],
            'tasks.*.estimated_minutes' => ['nullable', 'integer', 'min:5', 'max:10080'],
            'tasks.*.repeat_weekly' => ['sometimes', 'boolean'],
            'tasks.*.subtasks' => ['present', 'array', 'max:12'],
            'tasks.*.subtasks.*.title' => ['required', 'string', 'max:255'],
            'tasks.*.subtasks.*.description' => ['nullable', 'string', 'max:800'],
            'tasks.*.subtasks.*.estimated_minutes' => ['nullable', 'integer', 'min:5', 'max:720'],
            'tasks.*.subtasks.*.scheduled_date' => [
                'nullable',
                'date',
                'after_or_equal:today',
                ...($projectDeadline ? ["before_or_equal:{$projectDeadline}"] : []),
            ],
        ];
    }
}
