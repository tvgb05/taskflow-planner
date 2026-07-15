<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'username')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('username');
        });
    }

    public function down(): void
    {
        // Removing the obsolete account handle is intentionally irreversible.
    }
};
