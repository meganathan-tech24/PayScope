# ACME Salary Management: Project Spec for Claude Code

> Put this file at the repo root (and copy it to `CLAUDE.md` so it is loaded every session). Then start Claude Code with:
> **"Read PROJECT_SPEC.md and start with Phase 0 only. Stop and wait for my approval before writing any code."**

---

## 0. Role, goal and how to work

You are my pair-engineer for a hiring assessment. Build a **production-quality employee salary management web application** for an **HR Manager** at ACME, an organization with **10,000 employees across multiple countries**. Today HR manages everything in Excel, which is tedious. The HR Manager must be able to **manage salary data in a web app and answer questions about how the org pays people**.

The reviewers assess: clarity of thinking, product judgment, engineering fundamentals, meaningful tests, and _intentional_ use of AI. They explicitly say: **"We are not looking for the most complex system, but for good engineering judgment."**

### Working rules (apply for the whole project)

1. **Work in phases** (section 12). After each phase run type-check, lint, format check and tests, then make **small, incremental commits** using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`). Never squash. The commit history must show how the solution evolved.
2. **Phase 0 comes first.** Produce the one-page requirements doc and wait for my approval before building.
3. Keep `/docs/ai-prompts.md` updated with the key prompts and instructions used, and the decisions that resulted.
4. Keep `/docs/design-notes.md` updated with trade-offs and performance notes _as you go_, not at the end.
5. **Do not over-engineer.** Every abstraction must have a clear purpose. If a requirement below is heavy for the value it adds, implement the smallest version that is correct and secure, and record the trade-off in `design-notes.md`.
6. Ask me before any decision that changes scope. Otherwise state your assumption in one line and proceed.

---

## 1. Product context

**Persona:** HR Manager of ACME.

**Problem:** Salary data for 10,000 employees across multiple countries lives in spreadsheets. It is hard to search, keep consistent, or analyze.

**Core jobs to be done:**

- Find, add, edit and remove employees and their salary data quickly (10k rows must feel fast).
- Understand how the org pays people: by country, job title, department, tenure; spot outliers and inconsistencies.
- Export data when needed.

### Proposed scope (challenge it in Phase 0 if you disagree)

**In scope**

- Registration and login (JWT), protected app
- Employee CRUD with: full name, email, job title, department, country, currency, salary, employment type, hire date
- Server-side search, filter, sort and pagination
- Salary insights dashboard (distribution and comparison views)
- CSV export
- Seed script generating 10,000 realistic employees

**Deliberately out of scope (explain reasoning and what it would take later)**

- Payroll and tax calculation
- Bonuses, equity, benefits, salary history/audit trail
- Approval workflows
- Live FX rates (use a documented static rate table for optional USD normalization)
- Password reset, email verification, refresh-token rotation, SSO
- Multi-tenancy

### Currency rule

Store salary in **local currency as integer minor units**. Insights are computed **per currency/country by default**. Never silently mix currencies. An optional USD-normalized org-wide view uses a static, documented rate table and is clearly labeled as approximate.

---

## 2. Technology stack (mandatory)

### Frontend

- React.js + **TypeScript** (Vite)
- **Tailwind CSS**
- React Router
- State management appropriate to the need: **TanStack Query** for server state, minimal local/global state otherwise (Context or Zustand only if truly needed)
- Vitest + React Testing Library

### Backend

- Node.js + Express.js + **TypeScript**
- RESTful API, JWT authentication
- Vitest (or Jest) + Supertest

### Database

- **PostgreSQL** + **Prisma ORM**
- Prisma migrations (committed), Prisma seed

### Code quality

- ESLint, Prettier, TypeScript **strict mode**
- Automated lint, format check, type-check and tests (locally and in CI)

### Repository

- **Monorepo** with **pnpm workspaces**, plus **Turborepo** for task orchestration (keep the Turbo config minimal)
- `apps/web` and `apps/api` must stay **independently deployable** and share only `packages/*`. No cross-imports between the apps.

---

## 3. Monorepo structure

```text
project-root/
├── apps/
│   ├── web/                     # React app
│   └── api/                     # Express app
├── packages/
│   ├── shared/                  # zod schemas, constants, pure utilities shared by web + api
│   ├── types/                   # shared TypeScript types (API contracts, DTOs)
│   ├── ui/                      # (optional) shared UI primitives; skip if web-only is simpler
│   ├── eslint-config/
│   └── typescript-config/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   └── e2e/                     # Playwright
├── docs/
│   ├── requirements.md          # ONE page (Phase 0)
│   ├── design-notes.md
│   ├── ai-prompts.md
│   ├── architecture.md          # Mermaid diagrams
│   └── demo-script.md
├── .github/workflows/ci.yml
├── docker-compose.yml           # local Postgres (dev + test DBs)
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
└── README.md
```

Pragmatism note: if `packages/ui` adds no value, omit it and record why in `design-notes.md`.

---

## 4. Frontend architecture

**Feature-based modular architecture.** Do not create a global folder where all components, hooks, API calls and state are mixed. Each feature owns its components, hooks, services (API), schemas (validation), types, state and tests.

```text
apps/web/src/
├── app/
│   ├── router/          # routes, ProtectedRoute
│   ├── providers/       # QueryClient, Auth provider
│   ├── store/           # only if global state is truly needed
│   └── config/          # env access (VITE_API_URL etc.)
├── features/
│   ├── auth/            # components, hooks, services, schemas, types, __tests__
│   ├── employees/       # table, filters, form modal, hooks, services, schemas, tests
│   ├── insights/        # charts, summary cards, hooks, services, tests
│   └── ...
├── pages/               # thin route-level components composing features
├── components/
│   ├── ui/              # Button, Input, Modal, Table, Badge, Spinner...
│   └── layout/          # AppShell, Navbar, Sidebar
├── hooks/               # cross-feature hooks
├── services/            # http client (axios/fetch wrapper, interceptors)
├── lib/  utils/  types/  styles/
```

### Frontend principles

- Component composition, Single Responsibility, separation of UI and business logic
- Components contain **no** direct API/implementation details; they call feature hooks and services
- Strict typing, reusable components, minimal global state, clear feature boundaries
- No duplicated API or business logic; no unnecessary abstractions

### Auth on the client

- Register and Login pages with client-side validation (shared zod schemas) and clear server-error display
- Store the JWT and attach it through an HTTP client interceptor; `ProtectedRoute` wrapper; auto-logout on 401; visible logout
- Token storage choice (localStorage vs httpOnly cookie) must be justified in `design-notes.md` (XSS vs CSRF trade-off)

### Employees UI

- Table with server-side pagination, debounced search, filters (country, department, job title), column sorting
- Create/edit modal with inline validation, delete confirmation
- Loading, empty and error states; keyboard accessible

### Insights UI

- Summary cards and charts (Recharts): pay by country / job title / department, salary distribution, outliers table
- Currency always shown explicitly; optional USD-normalized toggle clearly labeled

---

## 5. Tailwind CSS design system

Define the design system in **`tailwind.config.js`** (or the equivalent for your Tailwind version), reusable across React components and backed by a global stylesheet:

- Colors: brand, neutral, semantic (success, warning, danger, info)
- Typography: font families, font sizes, line heights
- Spacing scale, breakpoints, border radius, shadows, other design tokens
- **Global stylesheet** (`styles/index.css`): Tailwind directives, base styles, and a small set of reusable component classes via `@layer components` (buttons, inputs, cards, table styles, badges)

Components use these tokens. **No inline style objects**, no duplicated styling definitions, no one-off magic values.

---

## 6. Backend architecture

**Modular, domain-oriented layered architecture.** One isolated module per business domain.

```text
apps/api/src/
├── app/
│   ├── routes.ts          # mounts module routers under /api/v1
│   ├── app.ts             # express app factory (used by tests)
│   └── config/            # validated env config (zod), fail fast on missing secrets
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.schema.ts
│   │   ├── auth.types.ts
│   │   └── __tests__/
│   ├── employees/         # same shape
│   ├── insights/          # same shape (queries mostly raw SQL via repository)
│   └── logs/              # (optional) read-only admin listing of ApplicationLog
├── database/
│   ├── prisma.ts          # single PrismaClient
│   └── transactions.ts    # transaction helper
├── middleware/
│   ├── request-id.middleware.ts
│   ├── auth.middleware.ts          # verify JWT
│   ├── authorize.middleware.ts     # role checks
│   ├── validation.middleware.ts    # zod for body, query, params
│   ├── rate-limit.middleware.ts
│   └── error.middleware.ts         # global error handler
├── lib/                   # logger, password hashing, jwt helpers, errors
├── utils/  types/  constants/
└── server.ts              # process bootstrap
```

### Layer responsibilities

- **Routes:** define endpoints and attach middleware
- **Controllers (thin):** parse the request, call services, shape the response and HTTP status
- **Services:** business logic and rules. **Never** put business logic in routes or controllers.
- **Repositories:** Prisma access. Use them where they add real separation or testability; do not create abstractions for their own sake.
- **Schemas (zod):** validate body, query params, route params, auth input, and business constraints where appropriate

### Request flow

```text
Client -> Route -> Middleware -> Controller -> Service -> Repository/Prisma -> PostgreSQL
```

Keep HTTP concerns, business logic and database access clearly separated.

---

## 7. Authentication and authorization

Implement secure **JWT** authentication.

**Endpoints:**

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET  /api/v1/auth/me` (protected)
- `POST /api/v1/auth/logout` (see logout note)

**Requirements:**

- Register and login return `{ user, token }`. **Never** return the password hash.
- Hash passwords with **bcrypt (cost 12)** or **Argon2id**. Never store or log plain text. State the choice in `design-notes.md`.
- Validate and sanitize all input: required fields, email format and lowercase/trim normalization, password strength rules
- Generic "Invalid credentials" on login failure (prevent user enumeration)
- JWT signed with `JWT_SECRET`, expiry from `JWT_EXPIRES_IN`. **Fail fast at startup** if secrets are missing.
- `authenticate` middleware verifies the Bearer token: 401 for missing/invalid/expired; `authorize(...roles)` middleware: 403 for insufficient role
- **Roles:** `HR_MANAGER` (full access) and `VIEWER` (read-only). Registration defaults to `HR_MANAGER` for this assessment (document it as a demo simplification). Only `HR_MANAGER` can create, update or delete employees.
- Rate limiting on auth routes; proper 409 on duplicate email
- **All** `/api/v1/employees` and `/api/v1/insights` routes are protected
- **Logout/token invalidation:** JWTs are stateless. Use short-lived access tokens, client-side token discard, and document what a server-side revocation strategy (e.g. `tokenVersion` on the user, or a denylist) would add later. Implement `tokenVersion` only if it stays small.

---

## 8. Database (PostgreSQL + Prisma)

- Prisma schema, version-controlled migrations, seed script
- Proper relationships, foreign-key constraints, unique constraints, and **indexes on every filter/sort column**
- Transactions for atomic operations (batch seeding, CSV import if built)
- Avoid N+1 patterns and unnecessary round trips

**Models (starting point; refine in Phase 0/1):**

```prisma
enum Role            { HR_MANAGER VIEWER }
enum EmploymentType  { FULL_TIME PART_TIME CONTRACT INTERN }
enum LogLevel        { DEBUG INFO WARN ERROR FATAL }

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(HR_MANAGER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Employee {
  id             String         @id @default(uuid())
  fullName       String
  email          String         @unique
  jobTitle       String
  department     String
  country        String         // ISO 3166-1 alpha-2
  currency       String         // ISO 4217
  salary         Int            // integer minor units, CHECK (salary >= 0) in a migration
  employmentType EmploymentType
  hireDate       DateTime       @db.Date
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@index([country])
  @@index([department])
  @@index([jobTitle])
  @@index([salary])
  @@index([country, jobTitle])
}

model ApplicationLog {
  id          String   @id @default(uuid())
  level       LogLevel
  message     String
  errorCode   String?
  service     String?
  environment String?
  requestId   String?
  method      String?
  path        String?
  statusCode  Int?
  userId      String?
  stack       String?
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([level])
  @@index([requestId])
  @@index([userId])
  @@index([createdAt])
  @@index([errorCode])
}
```

Add database-level constraints where valuable (e.g. `CHECK (salary >= 0)` through a SQL migration).

---

## 9. API design

- Base path `/api/v1`, consistent conventions for methods, status codes, request/response shapes, pagination, filtering, sorting
- Consistent **success** and **error** envelopes:

```json
{ "success": true,  "data": { }, "meta": { "page": 1, "pageSize": 25, "total": 10000, "requestId": "req_8f92ab31" } }
{ "success": false, "message": "Invalid credentials", "code": "AUTH_INVALID_CREDENTIALS", "requestId": "req_8f92ab31" }
```

### Endpoints

**Employees**

- `GET    /employees` with `page, pageSize, search, country, department, jobTitle, sortBy, sortDir`
- `GET    /employees/:id`
- `POST   /employees`
- `PUT    /employees/:id`
- `DELETE /employees/:id`
- `GET    /employees/export.csv` (respects the current filters; stream it, do not buffer 10k rows in memory unnecessarily)

**Insights** (all questions HR actually asks)

- Min / median / avg / max / p25 / p75 salary **by country, job title, department** (per currency), using Postgres `percentile_cont` through parameterized `$queryRaw`
- Headcount distribution and salary bands (histogram buckets)
- Pay vs tenure summary
- Outliers: employees far above or below their job-title median within a country
- Optional USD-normalized org-wide summary (static documented rate table, labeled approximate)

Provide **OpenAPI/Swagger** docs (e.g. `swagger-ui-express` at `/api/docs`, generated from or kept in sync with the zod schemas).

---

## 10. Cross-cutting backend concerns

### 10.1 Centralized error handling

Global Express error middleware. All errors flow through it. It must:

1. Capture the original error
2. Get or generate the request ID
3. Classify the error (validation, auth, forbidden, not found, conflict, database, unexpected)
4. Log it (structured logger)
5. Persist relevant information (`ApplicationLog`)
6. Return the consistent API error response
7. Never expose stack traces, DB errors, secrets or internals in production

Use typed application errors (e.g. `AppError` with `code`, `statusCode`, `isOperational`). No duplicated error handling in controllers.

### 10.2 Structured logging

- One centralized logger (e.g. **pino**), JSON output. **No scattered `console.log`.** Enforce with an ESLint `no-console` rule.
- Levels: DEBUG, INFO, WARN, ERROR, FATAL
- Every log includes: level, timestamp, service, environment, requestId, method, path, statusCode, userId (when known), errorCode, message, stack (non-production or ERROR+), metadata
- Design a **transport-style abstraction** so console/JSON, database and (later) Sentry / Datadog / Grafana-Loki / ELK can be plugged in. Only implement console + database now.

### 10.3 Request / correlation ID

- Middleware assigns a unique ID per request (accept a trusted incoming `X-Request-Id`, otherwise generate `req_<nanoid>`)
- Include it in: all logs, error logs, `ApplicationLog` rows, response header `X-Request-Id`, error response bodies, and downstream calls where applicable

### 10.4 Database-level application logging

- Persist important errors and operational logs (WARN and above by default; configurable) to `ApplicationLog`
- Write **asynchronously** (fire-and-forget with a small in-process buffer or batch) so logging does not add API latency. Document when a queue or worker would replace it at higher volume.

### 10.5 Logging security

Never log: passwords, JWTs, refresh tokens, API keys, Authorization headers, cookies, DB credentials, unnecessary personal data. Implement **automatic redaction** in the logger (paths such as `req.headers.authorization`, `req.headers.cookie`, `*.password`, `*.token`, `*.passwordHash`). Add tests that prove redaction works.

### 10.6 Logging reliability

Logging failures must never fail the request:

```text
Application Error -> Attempt DB logging -> DB logging fails -> Fallback console logger -> Return the ORIGINAL API error
```

Add a test that simulates a DB logging failure and asserts the original response is unchanged.

### 10.7 Security controls

`helmet`, CORS restricted to `CORS_ORIGIN`, rate limiting (stricter on auth), request body size limit, protection against malformed JSON, parameterized queries only (no string-built SQL), secure cookie flags if cookies are used, environment-based secrets, no stack traces to clients in production.

---

## 11. Testing strategy (mandatory; fast, deterministic, easy to read)

### Frontend (Vitest + React Testing Library)

Test user-visible behavior, not implementation details: rendering, interactions, form validation, auth flows, loading and error states, feature logic, service behavior, edge cases.

```text
features/auth/__tests__/LoginForm.test.tsx
features/auth/__tests__/RegisterForm.test.tsx
features/auth/__tests__/auth.service.test.ts
features/employees/__tests__/EmployeeForm.test.tsx
```

### Backend (Vitest/Jest + Supertest)

- **Unit:** services, business rules, auth logic (hashing/JWT), validation schemas, utilities, error classification, logger redaction
- **Integration:** routes + middleware + controllers + services + Prisma + real PostgreSQL (a separate test database from `docker-compose`, migrated once, tables truncated between tests). Cover registration, login, protected endpoints, employee CRUD, authorization (403 for `VIEWER` writes), insights correctness on a small known dataset.
- **API cases:** success, invalid input, unauthorized (401), forbidden (403), not found, conflict (409), validation failures, database errors, internal errors, edge cases (negative salary, unknown currency, duplicate email, bad pagination)
- Test that the error response never leaks internals in `NODE_ENV=production`

### E2E (Playwright, critical flows only)

```text
Register -> Login -> Authenticated Dashboard -> Feature interaction (create/edit employee, view insights) -> Logout
```

Test the seed/generator determinism and salary-band generation with unit tests.

---

## 12. Phased delivery plan

Each phase ends with passing type-check, lint, format check and tests, and one or more small commits.

**Phase 0: Requirements (no code)**
Write `/docs/requirements.md` on **ONE page**: Goal, Persona, Scope and features, **What is deliberately left out and why**, Assumptions, Success criteria. Present it, list assumptions or open questions, and **wait for my approval**.

**Phase 1: Monorepo, tooling and design system**
pnpm workspaces + Turborepo, shared TS/ESLint configs, Prettier, `docker-compose` (dev + test Postgres), `.env.example`, Tailwind config and global stylesheet with the tokens and component classes, husky/lint-staged (optional), CI skeleton.

**Phase 2: Backend foundation and cross-cutting concerns**
Config validation, Prisma setup and initial migration, app factory, request ID, logger (with redaction), AppError + global error handler, `ApplicationLog` persistence with async writes and fallback, validation middleware, rate limiting, helmet/CORS, health check. Tests for each.

**Phase 3: Authentication**
Auth module (register/login/me/logout), JWT middleware, role authorization, tests (including hash-not-plain, expired/invalid token, enumeration-safe login, duplicate email).

**Phase 4: Employees module**
CRUD, search/filter/sort/pagination, CSV export, indexes, tests.

**Phase 5: Seeding (10,000 employees)**
Deterministic seed (seeded RNG): 8-10 countries with matching currencies, realistic name pools, 15-20 job titles with plausible per-country salary bands, departments, hire dates. Use `createMany` in batches inside transactions; must finish in seconds; re-runnable (`pnpm db:seed` resets employees and reseeds). Also seed one **clearly labeled demo** HR user (credentials in README).

**Phase 6: Insights module**
Percentile/statistics queries, bands, tenure, outliers, optional USD view. Record measured timings on 10k rows in `design-notes.md`. Tests on a small hand-checked dataset.

**Phase 7: Web foundation and auth UI**
Providers, router, ProtectedRoute, HTTP client with interceptors, Login/Register, AppShell. Component tests.

**Phase 8: Employees UI and Insights UI**
Table, filters, form modal, charts. Component tests for the form and one critical flow.

**Phase 9: E2E, CI/CD and docs**
Playwright critical-flow test, full CI pipeline, OpenAPI docs, README, `architecture.md` (Mermaid), `demo-script.md`.

**Phase 10: Deployment and readiness**
Dockerfiles for both apps, deploy the API + managed PostgreSQL + web (suggest the simplest reliable option, e.g. Render, Railway, Fly.io or AWS), run migrations on deploy, seed production with 10,000 employees, put the live URL in the README. Prepare the demo video script.

---

## 13. CI/CD quality gates

`.github/workflows/ci.yml` runs on every pull request (and on push to `main`), with a Postgres service container:

```text
Install (pnpm, cached) -> Type check -> ESLint -> Prettier check -> Unit tests -> Integration tests -> Build -> E2E tests
```

The pipeline fails if any mandatory gate fails. Only green code is eligible for merge and deploy. Use Turborepo caching where it helps.

---

## 14. Environment configuration

Provide `.env.example` (committed) and per-environment files (`.env.development`, `.env.test`, `.env.production` as **templates without real secrets**; real values come from the deployment environment or a secrets manager).

```text
# api
DATABASE_URL=
TEST_DATABASE_URL=
JWT_SECRET=                 # long random string: openssl rand -base64 48
JWT_EXPIRES_IN=1h
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
LOG_DB_MIN_LEVEL=warn

# web
VITE_API_URL=http://localhost:4000/api/v1
```

Never commit real secrets. Validate all env vars with zod at startup and fail fast.

---

## 15. Code quality standards

TypeScript strict mode everywhere; ESLint + Prettier enforced locally and in CI; consistent naming; Single Responsibility; clear module boundaries; no duplicated business logic; no unnecessary global state; no hard-coded secrets; no dead code; no unnecessary over-engineering.

**Root scripts (pnpm + turbo):** `dev`, `build`, `typecheck`, `lint`, `format`, `format:check`, `test`, `test:integration`, `test:e2e`, `db:migrate`, `db:seed`, `db:reset`.

---

## 16. Documentation and artifacts to commit

- `README.md`: overview, architecture, stack, monorepo structure, local setup in a handful of commands, env variables table, DB setup, Prisma migration and seed commands, running web/api/tests/E2E, lint/format, build, deployment, API docs link, live URL, demo credentials, AI-usage summary, known limitations
- `docs/requirements.md` (one page), `docs/design-notes.md` (trade-offs, performance numbers), `docs/architecture.md` (Mermaid diagrams: system, request flow, ERD), `docs/ai-prompts.md`, `docs/demo-script.md`
- OpenAPI/Swagger docs served by the API

---

## 17. Priorities when trade-offs appear

1. Security
2. Maintainability
3. Testability
4. Scalability
5. Performance
6. Developer experience
7. Clear architecture

If time is limited, protect this order of importance for the submission: **working, deployed, seeded app with auth -> employees CRUD -> insights -> tests -> docs/commit history -> stretch items** (OpenAPI polish, Playwright breadth, USD normalization, admin log viewer).

---

## 18. Definition of done

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` all pass, and CI is green
- [ ] Seed produces exactly **10,000** employees in seconds and is re-runnable
- [ ] Passwords are hashed, secrets come only from env, every non-auth API route requires a valid JWT, and write routes require `HR_MANAGER`
- [ ] Centralized error handling, structured logging with redaction, request IDs, and DB-level `ApplicationLog` with a proven non-blocking fallback
- [ ] Insights answer real HR questions and are verified by tests on a known dataset
- [ ] Tailwind theme lives in `tailwind.config.js` with a global stylesheet and reusable component classes
- [ ] Each phase is its own commit(s) with Conventional Commit messages
- [ ] `/docs` contains requirements (one page), design-notes, architecture, ai-prompts, demo-script
- [ ] App is deployed and the README links to the live URL
- [ ] Short demo video recorded from `demo-script.md`

---

## 19. Start here

**Begin with Phase 0 only.** Present the one-page requirements document, list any assumptions and open questions, and wait for my approval before writing code.
