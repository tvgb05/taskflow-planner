# API Reference

Base URL:

```txt
http://localhost:8000/api
```

Protected endpoints use a Sanctum SPA session cookie. Before register/login, request:

```txt
GET http://localhost:8000/sanctum/csrf-cookie
```

Browser requests include credentials and send `X-XSRF-TOKEN` for state-changing requests.

## Auth

| Method | Endpoint | Notes |
| --- | --- | --- |
| POST | `/register` | Creates a verified user from a valid OTP and starts a session. |
| POST | `/register/otp` | Verifies reCAPTCHA and sends a six-digit OTP through Nodemailer and Gmail. |
| POST | `/login` | Starts a session using a username or email. |
| POST | `/logout` | Ends the current session. |
| GET | `/me` | Returns the current user. |
| PUT | `/me` | Updates the current user's name, username, or email. |
| POST | `/email/verification-notification` | Sends a verification OTP through Nodemailer and Gmail. |
| POST | `/email/verify-otp` | Verifies the authenticated user's email with a six-digit OTP. |

Register body:

```json
{
  "name": "Demo User",
  "username": "demo_user",
  "email": "demo@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "otp": "123456"
}
```

Login body:

```json
{
  "identifier": "demo_user",
  "password": "password123"
}
```

`identifier` accepts either the username or email address. Usernames contain
3-30 lowercase letters, numbers, or underscores.

## Projects

| Method | Endpoint |
| --- | --- |
| GET | `/projects` |
| POST | `/projects` |
| GET | `/projects/{project}` |
| PUT | `/projects/{project}` |
| DELETE | `/projects/{project}` |

Project body:

```json
{
  "name": "Portfolio sprint",
  "description": "Build TaskFlow Planner",
  "icon": "code",
  "deadline": "2026-07-15",
  "available_minutes_per_day": 120
}
```

## Tasks

| Method | Endpoint |
| --- | --- |
| GET | `/projects/{project}/tasks` |
| POST | `/projects/{project}/tasks` |
| GET | `/tasks/{task}` |
| PUT | `/tasks/{task}` |
| DELETE | `/tasks/{task}` |

Task filters:

```txt
?status=todo&priority=high&deadline=2026-07-15
```

Task body:

```json
{
  "title": "Build project CRUD",
  "description": "Routes, controller, validation, resources",
  "status": "todo",
  "priority": "high",
  "deadline": "2026-07-12",
  "estimated_minutes": 180
}
```

## Subtasks

| Method | Endpoint |
| --- | --- |
| GET | `/tasks/{task}/subtasks` |
| POST | `/tasks/{task}/subtasks` |
| PUT | `/subtasks/{subtask}` |
| DELETE | `/subtasks/{subtask}` |

Subtask body:

```json
{
  "title": "Create project migration",
  "description": "Add the table and verify its indexes.",
  "status": "todo",
  "estimated_minutes": 30,
  "scheduled_date": "2026-07-10"
}
```

## Scheduling

```txt
POST /projects/{project}/generate-schedule
```

The API schedules incomplete subtasks from today through the project deadline, ordered by parent task priority, parent task deadline, and subtask creation time.

## AI breakdown

```txt
POST /projects/{project}/ai-breakdown
```

Request:

```json
{
  "goal": "Build a fullstack portfolio project using Next.js and Laravel",
  "deadline": "2026-07-15",
  "available_minutes_per_day": 120,
  "plan_mode": "phased"
}
```

`plan_mode` can be `phased` (deadline-based milestones), `recurring` (a detailed weekly template repeated when saved), or `pipeline` (only the next day). Optional `feedback` and regeneration feedback are stored as project-specific AI memory. The ten most recent entries are included in future prompts, with newer entries taking precedence when preferences conflict.

To regenerate one draft task, send that task as `current_task` with `reprompt_feedback`. To regenerate only one draft subtask, also send it as `current_subtask`. The response contains one task; for subtask regeneration, that task contains exactly one replacement subtask.

Response:

```json
{
  "tasks": [
    {
      "title": "Set up the development environment",
      "phase": "Phase 1 of 3: Foundation",
      "description": "Prepare both runtimes and verify connectivity.",
      "deadline": "2026-07-12",
      "estimated_minutes": 120,
      "priority": "high",
      "repeat_weekly": false,
      "subtasks": [
        {
          "title": "Install frontend dependencies",
          "description": "Install packages and verify the dev server.",
          "estimated_minutes": 60,
          "scheduled_date": "2026-07-11"
        }
      ]
    }
  ]
}
```

The endpoint only returns validated suggestions. After review, save the whole graph atomically with `POST /projects/{project}/ai-breakdown/confirm` and body `{ "tasks": [...] }`.

The backend prompt is configured in `config/taskflow_ai.php`. It uses a compact planning profile inspired by `ciembor/agent-rules-books` and keeps the final response constrained to validated JSON.
