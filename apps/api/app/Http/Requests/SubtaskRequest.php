<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubtaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $resource = $this->route('subtask') ?? $this->route('task');

        return $this->user() !== null
            && ($resource === null || $this->user()->can('update', $resource));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $task = $this->route('task') ?? $this->route('subtask')?->task;
        $deadline = $task?->deadline ?? $task?->project?->deadline;
        $deadlineString = $deadline?->toDateString();

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:todo,done'],
            'estimated_minutes' => ['nullable', 'integer', 'min:5', 'max:720'],
            'scheduled_date' => [
                'nullable',
                'date',
                ...($deadlineString ? ["before_or_equal:{$deadlineString}"] : []),
            ],
        ];
    }
}
