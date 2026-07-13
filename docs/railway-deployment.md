# Railway deployment

TaskFlow Planner runs as three services in one Railway project:

```txt
web    -> /apps/web
api    -> /apps/api
MySQL  -> Railway MySQL
```

The web service proxies `/backend/*` to Laravel. The browser therefore uses
only the web origin for Sanctum cookies and CSRF, even when Railway assigns
unrelated generated domains to web and API.

## 1. MySQL service

Create a Railway MySQL database and name the service `MySQL`. It does not need
an HTTP public domain.

## 2. API service

Create another service from the same GitHub repository and set:

```txt
Service name: api
Root Directory: /apps/api
Watch Paths: /apps/api/**
Pre-deploy Command: php artisan migrate --force
```

Leave Build Command and Start Command empty so Railpack can detect Laravel and
serve it with PHP-FPM and Caddy.

Generate an application key locally:

```powershell
node scripts/php.mjs apps/api/artisan key:generate --show
```

Generate a separate internal key:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add these API service variables. Replace secret placeholders and use Railway's
autocomplete if a service name differs:

```env
APP_NAME=TaskFlowPlanner
APP_ENV=production
APP_KEY=<generated-app-key>
APP_DEBUG=false
APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://${{web.RAILWAY_PUBLIC_DOMAIN}}

LOG_CHANNEL=stderr
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=${{web.RAILWAY_PUBLIC_DOMAIN}}

CACHE_STORE=database
QUEUE_CONNECTION=database

GEMINI_API_KEY=<gemini-key>
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT=60
TASKFLOW_AI_PROFILE=portfolio_planner

NODEMAILER_ENDPOINT=https://${{web.RAILWAY_PUBLIC_DOMAIN}}/api/internal/send-otp
NODEMAILER_INTERNAL_KEY=<shared-internal-key>

RECAPTCHA_SECRET_KEY=
RECAPTCHA_REQUIRED=false
```

Deploy the API and generate an HTTP public domain. In the domain settings, set
the target port to `8080`, which is the port used by Railpack's Laravel server.
Apply the staged variable changes again if needed, and verify:

```txt
https://<api-domain>/up
```

It must return HTTP 200.

## 3. Web service

Use the existing repository service and set:

```txt
Service name: web
Root Directory: /apps/web
Watch Paths: /apps/web/**
Build Command: npm run build
Start Command: npx next start --hostname 0.0.0.0 --port $PORT
```

Do not define a fixed `PORT`. Let Railway inject it, then generate the web
domain after the deployment reports that Next.js is ready.

Add these web service variables:

```env
NEXT_PUBLIC_API_BASE_URL=/backend/api
API_PROXY_TARGET=https://api-taskflow-planner.up.railway.app
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=465
NODEMAILER_SECURE=true
NODEMAILER_USER=<gmail-address>
NODEMAILER_APP_PASSWORD=<google-app-password>
NODEMAILER_FROM_NAME=TaskFlow Planner
NODEMAILER_INTERNAL_KEY=<shared-internal-key>
```

Replace the sample `API_PROXY_TARGET` with the exact generated domain shown in
the API service's Networking tab. Using
`https://${{api.RAILWAY_PUBLIC_DOMAIN}}` is also supported when the service is
actually named `api` and already has a public domain, but enter the literal
domain if Railway resolves that reference to an empty value. The target is an
origin only; do not append `/api` or a trailing slash.
`NODEMAILER_INTERNAL_KEY` must be identical in web and API.

Redeploy the web service after changing either `NEXT_PUBLIC_*` variable because
Next.js includes public environment values in its production build.

## 4. Verification

Check these in order:

1. `https://<api-domain>/up` returns HTTP 200.
2. `https://<web-domain>/backend` returns JSON with `status: ok`.
3. `https://<web-domain>/backend/up` returns HTTP 200 through Next.js.
4. `https://<web-domain>/backend/sanctum/csrf-cookie` returns 204 or 200 and sets `XSRF-TOKEN`.
5. Registration sends OTP to the entered email.
6. Login loads the dashboard without CORS or HTTP 419 errors.
7. Project creation, AI suggestions, and schedule saving reach Laravel.

If step 1 fails, inspect API Runtime Logs and database variables. If step 1
passes but step 2 fails, inspect `API_PROXY_TARGET` and redeploy web. If login
returns 419, verify `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, secure cookies,
and the shared web origin.

Never set `SESSION_DOMAIN=.up.railway.app`. Railway owns that shared domain.
Seal Gemini, Gmail, application, database, and internal keys in Railway after
the deployment works.
