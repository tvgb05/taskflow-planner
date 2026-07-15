<?php

namespace App\Http\Requests;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'project_type' => [
                'sometimes',
                'string',
                Rule::in([
                    Project::TYPE_SHORT_TERM,
                    Project::TYPE_LONG_TERM,
                    Project::TYPE_DAILY_RECURRING,
                ]),
            ],
            'planning_mode' => [
                'sometimes',
                'string',
                Rule::in(['phased', 'recurring', 'pipeline']),
            ],
            'icon' => [
                'sometimes',
                'string',
                Rule::in([
                    'folder',
                    'rocket',
                    'code',
                    'calendar',
                    'target',
                    'book',
                    'briefcase',
                    'graduation',
                    'database',
                    'wrench',
                    'sparkles',
                    'list',
                ]),
            ],
            'deadline' => ['required', 'date', 'after_or_equal:today'],
            'available_minutes_per_day' => ['required', 'integer', 'min:15', 'max:720'],
        ];
    }
}
