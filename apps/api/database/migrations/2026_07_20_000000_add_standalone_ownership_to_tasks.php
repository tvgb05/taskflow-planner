<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreignId('user_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
        });

        DB::table('tasks')->whereNull('user_id')->update([
            'user_id' => DB::raw('(SELECT projects.user_id FROM projects WHERE projects.id = tasks.project_id)'),
        ]);

        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreignId('project_id')->nullable()->change();
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'deadline']);
        });
    }

    public function down(): void
    {
        DB::table('tasks')->whereNull('project_id')->delete();

        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['user_id', 'deadline']);
            $table->foreignId('project_id')->nullable(false)->change();
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
