# PayScope

Salary management and pay insights for HR teams. Replaces scattered spreadsheets with a fast, secure web app that stays responsive at 10,000+ employees.

**Live app:** `https://pay-scope-alpha.vercel.app/login`
**Demo logins** (public demo accounts only, created by `pnpm db:seed`; the password is public, so change it with `DEMO_USER_PASSWORD` on any deployed environment):

| Role | Email | Password |
| ---- | ----- | -------- |
| HR Manager (full access) | `hr.demo@acme.example` | `DemoPassw0rd!` |
| Viewer (directory and aggregated data only: no salaries, no writes) | `viewer.demo@acme.example` | `DemoPassw0rd!` |

---

## What is implemented

Tick each box as the work lands. The commit history mirrors this list.

### Product features

- [x] Registration (optional role, default `VIEWER`) and a single login for every role that returns the role, with JWT (API and web UI)
- [x] Employee management: create, view, edit, delete (API and web UI)
- [x] Server-side search, filter (country, department, job title), sort, and pagination
- [x] CSV export (respects current filters) (API and web UI)
- [x] Pay insights (API and web dashboard)
  - [x] Min, median, average, max, p25, p75 by country, job title, and department
  - [x] Headcount distribution and salary bands
  - [x] Pay vs tenure summary
  - [x] Outlier detection (like-for-like: same country, currency, job title and employment type; HR only)
  - [x] Optional USD-normalized view (static rate table, labeled approximate)
- [x] Seed script with exactly 10,000 realistic employees across multiple countries

### Security

- [x] Passwords hashed (bcrypt, cost 12), never stored or logged in plain text
- [x] JWT verification middleware protecting all employee and insights routes
- [x] Role-based access: `HR_MANAGER` (full), `VIEWER` (no writes)
- [x] Role-based data, enforced by the API: a `VIEWER` never receives `salary` (list, detail, CSV export) and cannot sort by it
- [x] Input validation and sanitization (zod) on body, query, and params
- [x] Rate limiting (stricter on auth routes), helmet, restricted CORS
- [x] Enumeration-safe login errors
- [x] Secrets only from environment variables, validated at startup

### Backend engineering

- [x] Modular, domain-oriented layers: routes, controllers, services, repositories
- [x] Centralized error handling with typed application errors
- [x] Structured JSON logging with log levels and automatic redaction
- [x] Request/correlation ID on every request (logs, DB records, responses)
- [x] Database-level `ApplicationLog` with async writes and a fallback logger
- [x] Prisma schema, committed migrations, indexes on filter/sort columns
- [ ] OpenAPI/Swagger documentation

### Frontend engineering

- [x] Feature-based architecture (landing, auth, employees, insights)
- [x] Tailwind design system defined in `tailwind.config.js` plus a global stylesheet
- [x] Protected routes, auth interceptor, auto-logout on 401
- [x] Loading, empty, and error states; keyboard-accessible forms

### Quality

- [x] TypeScript strict mode across the monorepo
- [x] ESLint and Prettier enforced locally and in CI
- [x] Frontend tests (Vitest + React Testing Library)
- [x] Backend unit and integration tests (Vitest + Supertest, real PostgreSQL), all under `tests/`
- [x] Test-location guard: `pnpm lint` fails if a test file appears outside `tests/`
- [ ] Playwright E2E test for the critical flow (both roles, desktop and mobile viewports)
- [ ] GitHub Actions pipeline: type check, lint, format check, tests, build, E2E
- [x] Deployed: web on Vercel, API on Render, managed PostgreSQL seeded with 10,000 employees (checked from outside; see `docs/design-notes.md`)

---

## Tech stack

| Area     | Technology                                              |
| -------- | ------------------------------------------------------- |
| Runtime  | Node.js 24                                          |
| Frontend | React 19.3, TypeScript 6, Vite 8, Tailwind CSS 3.4, React Router 8, TanStack Query |
| Backend  | Express 5, TypeScript, JWT, Zod 4, pino                 |
| Database | PostgreSQL, Prisma 7 (driver adapter), Prisma migrations |
| Testing  | Vitest 5, React Testing Library, Supertest, Playwright  |
| Quality  | ESLint 9, Prettier, TypeScript strict mode              |
| Tooling  | pnpm 12 workspaces, Turborepo, Docker, GitHub Actions   |

Version table and the deliberate holds: [`docs/design-notes.md`](docs/design-notes.md).

---

## Architecture

Monorepo with two independently deployable apps sharing only common packages.

```text
apps/
  web/            React app (feature-based modules)
  api/            Express app (domain modules); prisma/ (schema, migrations) and src/seed live here
packages/
  shared/         zod schemas, constants, pure utilities
  types/          shared TypeScript types
  eslint-config/  shared lint rules
  typescript-config/
tests/            all tests (@payscope/tests), mirroring source paths:
  api/{unit,integration,setup}   web   packages/{shared,types}   e2e (Playwright, Phase 9)
  helpers/ (signed tokens per role)   factories/ (data builders)
scripts/          check-test-locations.mjs (fails if a test file is outside tests/)
docs/             requirements, design notes, architecture, AI prompts, demo script
```

Backend request flow:

```text
Client -> Route -> Middleware -> Controller -> Service -> Repository/Prisma -> PostgreSQL
```

More detail and diagrams: [`docs/architecture.md`](docs/architecture.md).

---

## Getting started

Prerequisites: Node.js 24 (see `.nvmrc`), pnpm 12 (`corepack enable` picks the pinned version), Docker. `pnpm install` also generates the Prisma client into `apps/api/src/generated/` (git-ignored).

```bash
pnpm install
cp .env.example .env            # then set JWT_SECRET (openssl rand -base64 48)
docker compose up -d            # local PostgreSQL (dev + test databases)
pnpm db:migrate && pnpm db:seed # apply migrations, seed 10,000 employees
pnpm dev                        # web on :5173, api on :4000
```

### Environment variables

| Variable           | Description                                  |
| ------------------ | -------------------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string                 |
| `TEST_DATABASE_URL`| Separate database for integration tests      |
| `JWT_SECRET`       | Long random string used to sign tokens       |
| `JWT_EXPIRES_IN`   | Token lifetime (for example `1h`)            |
| `NODE_ENV`         | `development`, `test`, or `production`       |
| `PORT`             | API port                                     |
| `CORS_ORIGIN`      | Allowed web origin                           |
| `LOG_LEVEL`        | Console log level                            |
| `LOG_DB_MIN_LEVEL` | Minimum level persisted to `ApplicationLog`  |
| `VITE_API_URL`     | API base URL used by the web app             |
| `DEMO_USER_PASSWORD` | Optional. Overrides the demo accounts' password when seeding |
| `ALLOW_PRODUCTION_SEED` | Optional. Must be `true` to seed when `NODE_ENV=production` |

### Scripts

| Command                | What it does                          |
| ---------------------- | ------------------------------------- |
| `pnpm dev`             | Run web and api in watch mode         |
| `pnpm build`           | Build all apps and packages           |
| `pnpm typecheck`       | TypeScript checks                     |
| `pnpm lint`            | ESLint, then the test-location guard  |
| `pnpm format:check`    | Prettier check                        |
| `pnpm test`            | Unit tests (api, web, packages)       |
| `pnpm test:integration`| API integration tests (needs Postgres)|
| `pnpm test:e2e`        | Playwright E2E tests (none yet, Phase 9) |
| `pnpm smoke:production`| Run the built API like a host does: fails fast without configuration, answers `/api/v1/health`, stops cleanly on SIGTERM (needs `pnpm build` and `TEST_DATABASE_URL`) |
| `pnpm db:migrate`      | Apply Prisma migrations               |
| `pnpm db:generate`     | Regenerate the Prisma client          |
| `pnpm db:seed`         | Replace all employees with 10,000 seeded ones and upsert the two demo users (deterministic, re-runnable; refuses in production unless `ALLOW_PRODUCTION_SEED=true`) |
| `pnpm db:reset`        | Drop and re-migrate the database, then seed (same production guard) |

---

## API overview

Base path `/api/v1`. All routes except register and login require `Authorization: Bearer <token>`.

| Method | Endpoint                | Description                                   |
| ------ | ----------------------- | --------------------------------------------- |
| POST   | `/auth/register`        | Create an account; optional `role` (`HR_MANAGER` or `VIEWER`), omitted gives a `VIEWER`. Returns `{ user, token }` |
| POST   | `/auth/login`           | Email and password only; returns `{ user, token }`, `user.role` included |
| GET    | `/auth/me`              | Current user, including `role`                |
| POST   | `/auth/logout`          | Client-side token discard (stateless)         |
| GET    | `/employees`            | List with search, filters, sort, pagination. A `VIEWER` gets no `salary` field and cannot sort by salary (400) |
| POST   | `/employees`            | Create (HR_MANAGER)                           |
| GET    | `/employees/:id`        | Get one (no `salary` field for a `VIEWER`)    |
| PUT    | `/employees/:id`        | Update (HR_MANAGER)                           |
| DELETE | `/employees/:id`        | Delete (HR_MANAGER)                           |
| GET    | `/employees/export.csv` | CSV export of the filtered set (no salary column for a `VIEWER`) |
| GET    | `/insights/stats`       | Min, p25, median, avg, p75, max by `groupBy=country\|jobTitle\|department` (or `org` with `view=usd`), per currency |
| GET    | `/insights/headcount`   | Headcount by country, department, job title or employment type |
| GET    | `/insights/salary-bands`| Salary histogram for one `currency` (or `view=usd`); a `VIEWER`'s bands use fixed rounded edges, never the real minimum or maximum |
| GET    | `/insights/tenure`      | Headcount, median and average pay by tenure band |
| GET    | `/insights/outliers`    | Employees outside their group's pay range (HR_MANAGER only, 403 for VIEWER) |

Insights accept optional `country`, `currency`, `department` and `jobTitle` filters. `view=usd` converts with a static, approximate rate table and says so in the response. A `VIEWER` does not receive groups of fewer than 5 people, and stats rows for a `VIEWER` have no `min` or `max`.

### Roles and access

One sign-in page serves every role (email and password only); the API returns the user's `role`, and the app shows the matching experience. Data rules are enforced by the API, not the UI:

| | `HR_MANAGER` | `VIEWER` |
| --- | --- | --- |
| Insights | Full, including the outliers table and min/max | Aggregated statistics only (groups under 5 people hidden, no min/max); outliers endpoint is 403 |
| Employee list and detail | All fields, including salary | Directory fields only: the `salary` key is omitted |
| Sort and filter | Any whitelisted field | Salary sort is rejected with 400 |
| CSV export | All columns | Same rows, no salary column |
| Create, edit, delete | Yes | No (403) |

Registration accepts an optional `role` (`HR_MANAGER` or `VIEWER`); omitting it gives a `VIEWER`. Anything else is a 400.

Web routes: `/` landing, `/login`, `/register`, `/app` and `/app/employees` (signed in; `/app/employees` is the employee list, `/app` is the insights dashboard), `/403` and a 404 page.

Responses use a consistent envelope with a `requestId` for tracing:

```json
{ "success": false, "message": "Invalid credentials", "code": "AUTH_INVALID_CREDENTIALS", "requestId": "req_8f92ab31" }
```

---

## Deploying the API (Render)

The API builds to one file (`apps/api/dist/server.js`, bundled with esbuild) that plain Node runs. Root Directory empty; environment variables `NODE_VERSION=24`, `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` (32+ characters), `CORS_ORIGIN` (the web app's URL); Render sets `PORT`.

| Setting | Value |
| ------- | ----- |
| Build Command | `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm --filter @payscope/api build` |
| Start Command | `cd apps/api && ./node_modules/.bin/prisma migrate deploy && node dist/server.js` |
| Health Check Path | `/api/v1/health` |

Production reads no `.env` file and exits with a clear message if a variable is missing. Details and the reasoning: [`docs/design-notes.md`](docs/design-notes.md).

---

## Key decisions and trade-offs

- **Currency:** salaries are stored in local currency as integer minor units and never silently mixed. Insights are per currency by default.
- **Auth:** short-lived JWT, stateless. Server-side revocation is documented as a future step.
- **Insights:** per-currency by default; the USD view is approximate and labelled. Outliers use Tukey fences within country, currency, job title and employment type. Measurements and the open outlier trade-off are in `docs/design-notes.md`.
- **Roles:** the API filters salary out for `VIEWER` (allowlisted shape, role-aware CSV, salary sort rejected), so the UI cannot leak it. New users default to `VIEWER` (least privilege).
- **Logging:** async database writes with a console fallback, so logging never fails a request.
- **Scope:** payroll, tax, bonuses, approval workflows, and live FX rates are intentionally out of scope.

Full reasoning: [`docs/requirements.md`](docs/requirements.md) and [`docs/design-notes.md`](docs/design-notes.md).

---

## How AI was used

Built with an agentic AI coding tool guided by [`PROJECT_SPEC.md`](PROJECT_SPEC.md). Key prompts and the decisions they produced are logged in [`docs/ai-prompts.md`](docs/ai-prompts.md). Every phase was reviewed, tested, and committed incrementally.

---

## Documentation

- [Requirements (one page)](docs/requirements.md)
- [Design notes and performance](docs/design-notes.md)
- [Architecture diagrams](docs/architecture.md)
- [AI prompts log](docs/ai-prompts.md)
- [Demo script](docs/demo-script.md)

---

## Known limitations

- Anyone can register as `HR_MANAGER` or `VIEWER` (default `VIEWER`). This is an assessment-only simplification; production would use HR-Manager invites for Viewers or admin approval for HR accounts (see `docs/design-notes.md`)
- No password reset, email verification, or refresh-token rotation
- USD normalization uses a static rate table and is approximate
- Single-tenant only
- The seeded demo accounts use a publicly documented password (override with `DEMO_USER_PASSWORD`); seeded data is synthetic and its dates are fixed relative to 2026-06-30
