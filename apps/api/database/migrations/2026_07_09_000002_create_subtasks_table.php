<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subtasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('status')->default('todo');
            $table->unsignedSmallInteger('estimated_minutes')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->timestamps();

            $table->index(['task_id', 'status']);
            $table->index(['scheduled_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subtasks');
    }
};
