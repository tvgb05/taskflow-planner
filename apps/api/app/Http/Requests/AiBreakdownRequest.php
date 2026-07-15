<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AiBreakdownRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = $this->route('project');

        return $this->user() !== null
            && ($project === null || $this->user()->can('update', $project));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'goal' => ['required', 'string', 'max:1000'],
            'deadline' => ['required', 'date'],
            'available_minutes_per_day' => ['required', 'integer', 'min:15', 'max:720'],
            'language' => ['sometimes', 'string', 'in:en,vi'],
            'planning_profile' => ['sometimes', 'string', 'in:portfolio,study,work,personal'],
            'ai_style' => ['sometimes', 'string', 'in:concise,detailed,coach'],
            'plan_mode' => ['sometimes', 'string', 'in:phased,recurring,pipeline'],
            'recurrence_cycles' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'feedback' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'learn_from_user_tasks' => ['sometimes', 'boolean'],
            'create_subtasks' => ['sometimes', 'boolean'],
            'min_tasks' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'max_tasks' => ['sometimes', 'integer', 'min:1', 'max:12', 'gte:min_tasks'],
            'min_subtasks' => ['sometimes', 'integer', 'min:1', 'max:12'],
            'max_subtasks' => ['sometimes', 'integer', 'min:1', 'max:12', 'gte:min_subtasks'],
            'reprompt_feedback' => ['sometimes', 'required_with:current_task', 'string', 'max:2000'],
            'current_task' => ['sometimes', 'required_with:reprompt_feedback', 'array'],
            'current_task.title' => ['required_with:current_task', 'string', 'max:255'],
            'current_task.description' => ['required_with:current_task', 'string', 'max:1200'],
            'current_task.resources' => ['sometimes', 'array', 'max:5'],
            'current_task.resources.*.title' => ['required', 'string', 'max:120'],
            'current_task.resources.*.url' => ['required', 'url:http,https', 'max:1000'],
            'current_task.phase' => ['required_with:current_task', 'string', 'max:120'],
            'current_task.deadline' => ['required_with:current_task', 'date'],
            'current_task.estimated_minutes' => ['required_with:current_task', 'integer', 'min:5', 'max:10080'],
            'current_task.priority' => ['required_with:current_task', 'string', 'in:low,medium,high'],
            'current_task.repeat_weekly' => ['sometimes', 'boolean'],
            'current_task.subtasks' => ['required_with:current_task', 'array', 'max:12'],
            'current_task.subtasks.*.title' => ['required', 'string', 'max:255'],
            'current_task.subtasks.*.description' => ['required', 'string', 'max:800'],
            'current_task.subtasks.*.resources' => ['sometimes', 'array', 'max:5'],
            'current_task.subtasks.*.resources.*.title' => ['required', 'string', 'max:120'],
            'current_task.subtasks.*.resources.*.url' => ['required', 'url:http,https', 'max:1000'],
            'current_task.subtasks.*.estimated_minutes' => ['required', 'integer', 'min:5', 'max:720'],
            'current_task.subtasks.*.scheduled_date' => ['required', 'date'],
            'current_subtask' => ['sometimes', 'required_with:current_task,reprompt_feedback', 'array'],
            'current_subtask.title' => ['required_with:current_subtask', 'string', 'max:255'],
            'current_subtask.description' => ['required_with:current_subtask', 'string', 'max:800'],
            'current_subtask.resources' => ['sometimes', 'array', 'max:5'],
            'current_subtask.resources.*.title' => ['required', 'string', 'max:120'],
            'current_subtask.resources.*.url' => ['required', 'url:http,https', 'max:1000'],
            'current_subtask.estimated_minutes' => ['required_with:current_subtask', 'integer', 'min:5', 'max:720'],
            'current_subtask.scheduled_date' => ['required_with:current_subtask', 'date'],
        ];
    }
}
