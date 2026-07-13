<?php

namespace App\Policies;

use App\Models\Subtask;
use App\Models\User;

class SubtaskPolicy
{
    public function update(User $user, Subtask $subtask): bool
    {
        return $subtask->task()->whereHas('project', fn ($query) => $query->where('user_id', $user->id))->exists();
    }

    public function delete(User $user, Subtask $subtask): bool
    {
        return $this->update($user, $subtask);
    }
}
