<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subtasks', function (Blueprint $table): void {
            $table->text('description')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('subtasks', function (Blueprint $table): void {
            $table->dropColumn('description');
        });
    }
};
