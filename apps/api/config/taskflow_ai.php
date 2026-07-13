<?php

return [
    /*
    |--------------------------------------------------------------------------
    | TaskFlow AI Assistant Profile
    |--------------------------------------------------------------------------
    |
    | The profile is inspired by ciembor/agent-rules-books. That project
    | recommends concise "mini" rule sets for practical task use, so this
    | prompt keeps the guidance small and focused on better user outcomes.
    |
    */

    'profile' => env('TASKFLOW_AI_PROFILE', 'portfolio_planner'),

    'agent_rules_source' => 'https://github.com/ciembor/agent-rules-books',

    'assistant_rules' => [
        'Break goals into small, reviewable work items that a junior fullstack developer can finish.',
        'Prefer clean boundaries between frontend UI, API controllers, validation, services, and persistence.',
        'Use the project goal language instead of inventing generic engineering tasks.',
        'Include validation, API integration, persistence, and demo-readiness work when relevant.',
        'Avoid over-engineered architecture, vague research tasks, and duplicate subtasks.',
        'Make estimates realistic for a portfolio MVP and keep the plan schedulable before the deadline.',
    ],
];
