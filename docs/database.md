# Database Notes

## Tables

### users

Laravel default user table with name, email, password, remember token, timestamps, and Sanctum token support.

### projects

| Field | Type |
| --- | --- |
| id | bigint |
| user_id | foreign id |
| name | string |
| description | text nullable |
| icon | string |
| deadline | date |
| available_minutes_per_day | unsigned small integer |
| created_at / updated_at | timestamps |

### tasks

| Field | Type |
| --- | --- |
| id | bigint |
| project_id | foreign id |
| title | string |
| description | text nullable |
| phase | string nullable |
| status | string: `todo`, `in_progress`, `done` |
| priority | string: `low`, `medium`, `high` |
| deadline | date nullable |
| estimated_minutes | unsigned small integer nullable |
| created_at / updated_at | timestamps |

### subtasks

| Field | Type |
| --- | --- |
| id | bigint |
| task_id | foreign id |
| title | string |
| description | text nullable |
| status | string: `todo`, `done` |
| estimated_minutes | unsigned small integer nullable |
| scheduled_date | date nullable |
| created_at / updated_at | timestamps |

### sessions and personal_access_tokens

The browser uses the `sessions` table through Sanctum SPA cookie authentication. The personal access token table remains available for a future CLI or trusted machine client, but the web app does not store bearer tokens.

## Relationships

- User has many projects.
- Project belongs to user.
- Project has many tasks.
- Task belongs to project.
- Task has many subtasks.
- Subtask belongs to task.

## Ownership rules

- Projects are scoped to the authenticated user.
- Tasks are authorized through their parent project.
- Subtasks are authorized through their task and parent project.

## Scheduling logic

The scheduling service:

1. Loads all incomplete subtasks for the project.
2. Sorts them by parent task priority, parent task deadline, then creation date.
3. Assigns each subtask from today through the project deadline.
4. Tracks used minutes per date.
5. Rejects schedules that exceed the available time window or daily capacity.
6. Saves `scheduled_date` on each subtask and returns a grouped schedule.
