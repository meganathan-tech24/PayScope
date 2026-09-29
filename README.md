# PayScope

Salary management and pay insights for HR teams. Replaces scattered spreadsheets with a fast, secure web app that stays responsive at 10,000+ employees.

**Live app:** `<add URL after deployment>`
**API docs (Swagger):** `<live-url>/api/docs`
**Demo video:** `<add link>`
**Demo login:** `<email>` / `<password>` (demo account only, created by the seed script)

---

## What is implemented

Tick each box as the work lands. The commit history mirrors this list.

### Product features

- [x] Registration and login with JWT
- [ ] Employee management: create, view, edit, delete
- [ ] Server-side search, filter (country, department, job title), sort, and pagination
- [ ] CSV export (respects current filters)
- [ ] Pay insights
  - [ ] Min, median, average, max, p25, p75 by country, job title, and department
  - [ ] Headcount distribution and salary bands
  - [ ] Pay vs tenure summary
  - [ ] Outlier detection (vs job-title median within a country)
  - [ ] Optional USD-normalized view (static rate table, labeled approximate)
- [ ] Seed script with exactly 10,000 realistic employees across multiple countries

### Security

- [x] Passwords hashed (bcrypt/Argon2id), never stored or logged in plain text
- [ ] JWT verification middleware protecting all employee and insights routes
- [ ] Role-based access: `HR_MANAGER` (full), `VIEWER` (read-only)
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

- [ ] Feature-based architecture (auth, employees, insights)
- [ ] Tailwind design system defined in `tailwind.config.js` plus a global stylesheet
- [ ] Protected routes, auth interceptor, auto-logout on 401
- [ ] Loading, empty, and error states; keyboard-accessible forms

### Quality

- [x] TypeScript strict mode across the monorepo
- [x] ESLint and Prettier enforced locally and in CI
- [ ] Frontend tests (Vitest + React Testing Library)
- [x] Backend unit and integration tests (Vitest + Supertest, real PostgreSQL)
- [ ] Playwright E2E test for the critical flow
- [ ] GitHub Actions pipeline: type check, lint, format check, tests, build, E2E
- [ ] Deployed with a managed PostgreSQL database, seeded with 10,000 employees

---

## Tech stack

| Area     | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query |
| Backend  | Node.js, Express, TypeScript, JWT, zod, pino            |
| Database | PostgreSQL, Prisma ORM, Prisma migrations               |
| Testing  | Vitest, React Testing Library, Supertest, Playwright    |
| Quality  | ESLint, Prettier, TypeScript strict mode                |
| Tooling  | pnpm workspaces, Turborepo, Docker, GitHub Actions      |

---

## Architecture

Monorepo with two independently deployable apps sharing only common packages.

```text
apps/
  web/            React app (feature-based modules)
  api/            Express app (domain modules)
packages/
  shared/         zod schemas, constants, pure utilities
  types/          shared TypeScript types
  eslint-config/  shared lint rules
  typescript-config/
prisma/           schema, migrations, seed
tests/e2e/        Playwright tests
docs/             requirements, design notes, architecture, AI prompts, demo script
```

Backend request flow:

```text
Client -> Route -> Middleware -> Controller -> Service -> Repository/Prisma -> PostgreSQL
```

More detail and diagrams: [`docs/architecture.md`](docs/architecture.md).

---

## Getting started

Prerequisites: Node.js 20+, pnpm, Docker.

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

### Scripts

| Command                | What it does                          |
| ---------------------- | ------------------------------------- |
| `pnpm dev`             | Run web and api in watch mode         |
| `pnpm build`           | Build all apps and packages           |
| `pnpm typecheck`       | TypeScript checks                     |
| `pnpm lint`            | ESLint                                |
| `pnpm format:check`    | Prettier check                        |
| `pnpm test`            | Unit tests                            |
| `pnpm test:integration`| API integration tests (needs Postgres)|
| `pnpm test:e2e`        | Playwright E2E tests                  |
| `pnpm db:migrate`      | Apply Prisma migrations               |
| `pnpm db:seed`         | Reset and seed 10,000 employees       |

---

## API overview

Base path `/api/v1`. All routes except register and login require `Authorization: Bearer <token>`.

| Method | Endpoint                | Description                                   |
| ------ | ----------------------- | --------------------------------------------- |
| POST   | `/auth/register`        | Create an account, returns `{ user, token }`  |
| POST   | `/auth/login`           | Log in, returns `{ user, token }`             |
| GET    | `/auth/me`              | Current user                                  |
| POST   | `/auth/logout`          | Client-side token discard (stateless)         |
| GET    | `/employees`            | List with search, filters, sort, pagination   |
| POST   | `/employees`            | Create (HR_MANAGER)                           |
| GET    | `/employees/:id`        | Get one                                       |
| PUT    | `/employees/:id`        | Update (HR_MANAGER)                           |
| DELETE | `/employees/:id`        | Delete (HR_MANAGER)                           |
| GET    | `/employees/export.csv` | CSV export of the filtered set                |
| GET    | `/insights/*`           | Salary stats, bands, tenure, outliers         |

Responses use a consistent envelope with a `requestId` for tracing:

```json
{ "success": false, "message": "Invalid credentials", "code": "AUTH_INVALID_CREDENTIALS", "requestId": "req_8f92ab31" }
```

---

## Key decisions and trade-offs

- **Currency:** salaries are stored in local currency as integer minor units and never silently mixed. Insights are per currency by default.
- **Auth:** short-lived JWT, stateless. Server-side revocation is documented as a future step.
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

- Registration defaults to the `HR_MANAGER` role (demo simplification)
- No password reset, email verification, or refresh-token rotation
- USD normalization uses a static rate table and is approximate
- Single-tenant only
