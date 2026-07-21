<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    public const STATUS_TODO = 'todo';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_DONE = 'done';

    public const PRIORITY_LOW = 'low';

    public const PRIORITY_MEDIUM = 'medium';

    public const PRIORITY_HIGH = 'high';

    public const SOURCE_MANUAL = 'manual';

    public const SOURCE_AI = 'ai';

    protected $fillable = [
        'user_id',
        'project_id',
        'title',
        'description',
        'resources',
        'phase',
        'source',
        'status',
        'priority',
        'deadline',
        'estimated_minutes',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'estimated_minutes' => 'integer',
            'resources' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class);
    }
}
