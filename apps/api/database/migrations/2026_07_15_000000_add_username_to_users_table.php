<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('username', 30)->nullable()->unique()->after('name');
        });

        DB::table('users')
            ->select(['id', 'email'])
            ->orderBy('id')
            ->each(function (object $user): void {
                $localPart = Str::before((string) $user->email, '@');
                $base = Str::lower(Str::ascii($localPart));
                $base = trim((string) preg_replace('/[^a-z0-9_]+/', '_', $base), '_');
                $base = strlen($base) >= 3 ? substr($base, 0, 30) : 'user';
                $candidate = $base;
                $suffix = 1;

                while (DB::table('users')->where('username', $candidate)->exists()) {
                    $ending = '_'.($suffix++);
                    $candidate = substr($base, 0, 30 - strlen($ending)).$ending;
                }

                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['username' => $candidate]);
            });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('username', 30)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
