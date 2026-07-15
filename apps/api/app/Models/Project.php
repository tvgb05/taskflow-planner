<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    public const TYPE_SHORT_TERM = 'short_term';

    public const TYPE_LONG_TERM = 'long_term';

    public const TYPE_DAILY_RECURRING = 'daily_recurring';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'icon',
        'project_type',
        'planning_mode',
        'deadline',
        'available_minutes_per_day',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'available_minutes_per_day' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function planningFeedback(): HasMany
    {
        return $this->hasMany(ProjectPlanningFeedback::class);
    }
}
