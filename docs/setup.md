# Setup Guide

## Requirements

- PHP 8.2+
- Composer
- Node.js 20+
- MySQL
- Gemini API key for AI suggestions

## Backend

```bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
```

Create a MySQL database:

```sql
CREATE DATABASE taskflow_planner;
```

Update `.env` if needed:

```txt
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=taskflow_planner
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_TIMEOUT=90
TASKFLOW_AI_PROFILE=portfolio_planner
NODEMAILER_ENDPOINT=http://localhost:3000/api/internal/send-otp
NODEMAILER_INTERNAL_KEY=
RECAPTCHA_SECRET_KEY=
RECAPTCHA_REQUIRED=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/backend/api/auth/google/callback
```

Laravel sends OTP payloads to a private Next.js route protected by `NODEMAILER_INTERNAL_KEY`. The route uses Nodemailer and Gmail SMTP to deliver each code directly to the email entered during registration or profile verification.

For a public HTTPS deployment, use the frontend host in `SANCTUM_STATEFUL_DOMAINS`, configure a shared parent `SESSION_DOMAIN` for sibling subdomains, and set `SESSION_SECURE_COOKIE=true`.

When web and API use separate Railway-provided domains, configure the Next.js
same-origin proxy instead of sharing a cookie domain:

```txt
NEXT_PUBLIC_API_BASE_URL=/backend/api
API_PROXY_TARGET=https://api-taskflow-planner.up.railway.app
```

The browser then requests `/backend/*` from the web domain and Next.js forwards
the request to Laravel. Keep `SESSION_DOMAIN=null`; never use
`.up.railway.app` as a cookie domain.

For Google login, create a Web application OAuth client in Google Cloud and add
the exact frontend proxy callback as an authorized redirect URI. Local
development uses:

```txt
http://localhost:3000/backend/api/auth/google/callback
```

The Laravel callback creates or links only identities that include a verified
Google email. Existing password login remains available after linking.

Run migrations and serve the API:

```bash
php artisan migrate
php artisan serve
```

## Frontend

```bash
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in `apps/web/.env.local` to display Google reCAPTCHA on registration. Use a matching server `RECAPTCHA_SECRET_KEY`; keep `RECAPTCHA_REQUIRED=false` only for local development without a configured widget.

Configure the server-only mail variables in `apps/web/.env.local`:

```txt
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

When `RESEND_API_KEY` is present, OTP email uses Resend's HTTPS API. Otherwise
it falls back to Nodemailer SMTP. Verify `mail.taskflow-planner.site` in Resend
before using that sender.

Use a Google App Password for `NODEMAILER_APP_PASSWORD`, not the account's regular password. `NODEMAILER_INTERNAL_KEY` must match the value in `apps/api/.env`.

Open:

```txt
http://localhost:3000
```

## Run both apps

From the repository root, install the root helper dependency once:

```bash
npm install
```

Then start Laravel and Next.js together:

```bash
npm run dev
```

This also starts XAMPP MySQL when needed and opens `http://localhost:3000` automatically when the web server is ready.
The API script can find PHP from PATH or from `C:\xampp\php\php.exe`.

This runs:

```txt
node scripts/start-mysql.mjs
node scripts/php.mjs apps/api/artisan serve --host=127.0.0.1 --port=8000
npm --prefix apps/web run dev
node scripts/open-web.mjs
```

## View the database

The project includes an Adminer helper script, which gives you a browser UI for MySQL similar to Prisma Studio:

```bash
npm run db:studio
```

Open:

```txt
http://localhost:8080
```

Use these login values when MySQL is running on your machine:

```txt
System: MySQL
Server: host.docker.internal
Username: root
Password: your DB password, or blank for the default local setup
Database: taskflow_planner
```

Stop it with `Ctrl+C` in the terminal running `npm run db:studio`.

## Postman testing checklist

1. Request `GET /sanctum/csrf-cookie` with a cookie jar enabled.
2. Register or login while preserving the `XSRF-TOKEN` and session cookies.
3. Send the decoded `XSRF-TOKEN` value as `X-XSRF-TOKEN` on state-changing requests.
4. Create a project.
5. Create tasks for the project.
6. Create subtasks for tasks.
7. Generate a schedule.
8. Call AI breakdown after setting `GEMINI_API_KEY`.
9. Verify a second user cannot access the first user's projects, tasks, or subtasks.

## Common issues

- If frontend requests fail, confirm `NEXT_PUBLIC_API_BASE_URL=/backend/api` and `API_PROXY_TARGET` points to the Laravel origin without a trailing `/api`.
- If CORS fails, confirm `FRONTEND_URL=http://localhost:3000` in Laravel `.env`.
- If AI suggestions fail, set the key with `$env:GEMINI_API_KEY="your_key"; npm run api:set-gemini`, then restart `npm run dev`.
- If the web app opens but API calls fail, run `npm run doctor` from the repository root.
