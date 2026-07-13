<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $resource = $this->route('task') ?? $this->route('project');

        return $this->user() !== null
            && ($resource === null || $this->user()->can('update', $resource));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $project = $this->route('project') ?? $this->route('task')?->project;
        $projectDeadline = $project?->deadline?->toDateString();

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'phase' => ['nullable', 'string', 'max:120'],
            'status' => ['required', 'in:todo,in_progress,done'],
            'priority' => ['required', 'in:low,medium,high'],
            'deadline' => [
                'nullable',
                'date',
                'after_or_equal:today',
                ...($projectDeadline ? ["before_or_equal:{$projectDeadline}"] : []),
            ],
            'estimated_minutes' => ['nullable', 'integer', 'min:5', 'max:10080'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'deadline.after_or_equal' => 'The task deadline cannot be earlier than today.',
            'deadline.before_or_equal' => 'The task deadline cannot be later than the project deadline.',
        ];
    }
}
