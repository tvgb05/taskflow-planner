<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_planning_feedback', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->date('for_date');
            $table->timestamps();

            $table->index(['project_id', 'for_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_planning_feedback');
    }
};
