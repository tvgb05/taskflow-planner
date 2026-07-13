<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiHealthTest extends TestCase
{
    public function test_api_root_returns_a_service_status(): void
    {
        $this->getJson('/')
            ->assertOk()
            ->assertJson([
                'name' => config('app.name'),
                'status' => 'ok',
                'health' => '/up',
                'api' => '/api',
            ]);
    }
}
