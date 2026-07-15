# TaskFlow Planner

TaskFlow Planner is a small fullstack web application for breaking large goals into tasks and subtasks, estimating effort, and scheduling incomplete work before a project deadline.

## Tech stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Laravel, Sanctum, REST API, Eloquent ORM
- Database: MySQL
- AI: Gemini API through the Laravel backend only

## Features

- Register, login, logout, and cookie-authenticated current user endpoint
- Project CRUD with deadline and available minutes per day
- Task CRUD with status, priority, deadline, filters, and estimates
- Subtask CRUD with done state and scheduled date
- Simple Laravel scheduling service that respects daily capacity
- Gemini 3.5 Flash-backed AI planning with phased, recurring-weekly, and next-day pipeline modes
- Nodemailer and Gmail OTP verification with optional Google reCAPTCHA protection during registration
- Responsive dashboard, project list, project detail, schedule view, and clear states

## Screenshots

Add screenshots after running the app:

- `docs/screenshots/login.png`
- `docs/screenshots/dashboard.png`
- `docs/screenshots/project-detail.png`

## Setup

Read the detailed setup notes in [docs/setup.md](docs/setup.md).

Short version:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
npm install
npm --prefix apps/web install
cd apps/api
composer install
php artisan key:generate
php artisan migrate
cd ../..
npm run dev
```

This starts MySQL, starts the API, starts the web app, and opens `http://localhost:3000` in your browser when the web server is ready.

The root API script uses `scripts/php.mjs`, which can find PHP from PATH or a local XAMPP install at `C:\xampp\php\php.exe`.

View the database in a browser:

```bash
npm run db:studio
```

Open `http://localhost:8080` and use:

```txt
System: MySQL
Server: host.docker.internal
Username: root
Password: your DB password, or leave blank if your local MySQL has no password
Database: taskflow_planner
```

Or run each app manually:

```bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

## Environment variables

Laravel:

```txt
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DB_CONNECTION=mysql
DB_DATABASE=taskflow_planner
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT=90
TASKFLOW_AI_PROFILE=portfolio_planner
NODEMAILER_ENDPOINT=http://localhost:3000/api/internal/send-otp
NODEMAILER_INTERNAL_KEY=
RECAPTCHA_SECRET_KEY=
RECAPTCHA_REQUIRED=false
```

Gemini is called only from Laravel. The AI breakdown prompt uses a concise planning profile inspired by the `mini` guidance pattern from `ciembor/agent-rules-books`.

Next.js:

```txt
NEXT_PUBLIC_API_BASE_URL=/backend/api
API_PROXY_TARGET=http://localhost:8000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RESEND_API_KEY=
RESEND_FROM="TaskFlow Planner <no-reply@mail.taskflow-planner.site>"
NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=465
NODEMAILER_SECURE=true
NODEMAILER_USER=
NODEMAILER_APP_PASSWORD=
NODEMAILER_FROM_NAME="TaskFlow Planner"
NODEMAILER_INTERNAL_KEY=
```

The OTP endpoint uses the Resend HTTPS API when `RESEND_API_KEY` is set and
falls back to Nodemailer SMTP otherwise. Railway Free, Trial, and Hobby plans
must use the HTTPS option because outbound SMTP is unavailable.

`/backend` is a same-origin Next.js proxy to Laravel. It keeps Sanctum session
and CSRF cookies on the web host, including deployments where Railway assigns
separate generated domains to the web and API services.

See [docs/railway-deployment.md](docs/railway-deployment.md) for the complete
Railway service, environment variable, domain, and verification checklist.

## API overview

Main routes are documented in [docs/api.md](docs/api.md). Protected routes use a Sanctum SPA session cookie; the frontend does not store an API token in browser storage.

## Database overview

Relationships and field notes are documented in [docs/database.md](docs/database.md).

## Why this project?

This project was built as a fullstack portfolio project to practice Next.js, Laravel, REST API integration, database design, authentication, and clean development workflow.

## Future improvements

- Kanban board
- Calendar view
- Drag and drop subtasks
- Dark mode
- Export schedule to CSV
- Email reminders
- Docker Compose setup

## CV bullet

```latex
\resumeProjectHeading
{\textbf{TaskFlow Planner} $|$ \textbf{Next.js, TypeScript, Laravel, MySQL, REST API, Gemini API}}
{\textit{Jul 2026}}
{\textit{A fullstack task breakdown and scheduling app with AI-assisted subtask planning}}
\resumeItemListStart
\resumeItem{Built a responsive Next.js dashboard with reusable components for projects, tasks, subtasks, filters, and daily schedule views.}
\resumeItem{Developed RESTful APIs using Laravel routes, controllers, migrations, models, Eloquent ORM, and authentication workflows.}
\resumeItem{Designed relational database structures for users, projects, tasks, subtasks, priorities, deadlines, and scheduled work sessions.}
\resumeItem{Integrated Gemini API for AI-assisted task breakdown, with structured JSON validation before saving subtasks to the database.}
\resumeItem{Used Git and Postman to manage development workflow, test API endpoints, debug issues, and maintain clean project structure.}
\resumeItemListEnd
```
