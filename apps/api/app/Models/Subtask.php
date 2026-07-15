<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subtask extends Model
{
    use HasFactory;

    public const STATUS_TODO = 'todo';

    public const STATUS_DONE = 'done';

    protected $fillable = [
        'task_id',
        'title',
        'description',
        'resources',
        'status',
        'estimated_minutes',
        'scheduled_date',
    ];

    protected function casts(): array
    {
        return [
            'estimated_minutes' => 'integer',
            'scheduled_date' => 'date',
            'resources' => 'array',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
