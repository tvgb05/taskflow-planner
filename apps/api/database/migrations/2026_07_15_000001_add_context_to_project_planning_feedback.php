<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_planning_feedback', function (Blueprint $table): void {
            $table->string('kind', 30)->default('daily')->after('content');
            $table->string('target_type', 30)->nullable()->after('kind');
            $table->string('target_title')->nullable()->after('target_type');
            $table->index(['project_id', 'kind', 'created_at'], 'project_feedback_kind_created_index');
        });
    }

    public function down(): void
    {
        Schema::table('project_planning_feedback', function (Blueprint $table): void {
            $table->dropIndex('project_feedback_kind_created_index');
            $table->dropColumn(['kind', 'target_type', 'target_title']);
        });
    }
};
