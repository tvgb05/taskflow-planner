<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->string('planning_mode', 30)->default('phased')->after('project_type');
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->json('resources')->nullable()->after('description');
        });

        Schema::table('subtasks', function (Blueprint $table): void {
            $table->json('resources')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('subtasks', function (Blueprint $table): void {
            $table->dropColumn('resources');
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropColumn('resources');
        });

        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn('planning_mode');
        });
    }
};
