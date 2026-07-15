<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->string('project_type', 30)->default('short_term')->after('icon');
            $table->index(['user_id', 'project_type']);
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->string('source', 20)->default('manual')->after('phase');
            $table->index(['project_id', 'source']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropIndex(['project_id', 'source']);
            $table->dropColumn('source');
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'project_type']);
            $table->dropColumn('project_type');
        });
    }
};
