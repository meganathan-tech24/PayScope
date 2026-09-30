# ACME Salary Management: Project Spec for Claude Code

> This file holds the full requirements. `CLAUDE.md` (repo root) holds the rules that must always be followed and is loaded every session. **If the two disagree, `CLAUDE.md` wins and this file must be fixed to match.** Status of each phase is in section 12.

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

- Public landing page, a single sign-in page for every role, and registration with an account type (HR Manager or Viewer)
- JWT authentication and **role-based experience and data** (`HR_MANAGER` sees everything; `VIEWER` never receives individual salaries)
- Employee CRUD with: full name, email, job title, department, country, currency, salary, employment type, hire date
- Server-side search, filter, sort and pagination
- Salary insights dashboard (distribution and comparison views); an outliers table for HR Managers only
- CSV export (Viewers get it without the salary column)
- Seed script generating 10,000 realistic employees

**Deliberately out of scope (explain reasoning and what it would take later)**

- Payroll and tax calculation
- Bonuses, equity, benefits, salary history/audit trail
- Approval workflows
- Live FX rates (use a documented static rate table for optional USD normalization)
- Admin tooling for roles (public role self-selection at registration is an assessment-only simplification; see section 7)
- Password reset, email verification, refresh-token rotation, SSO
- Multi-tenancy

### Currency rule

Store salary in **local currency as integer minor units**. Insights are computed **per currency/country by default**. Never silently mix currencies. An optional USD-normalized org-wide view uses a static, documented rate table and is clearly labeled as approximate.

---

## 2. Technology stack (mandatory)

Versions are the latest stable releases verified in change request A (see the table in `docs/design-notes.md`); never use canary, experimental or alpha builds. Verify with `pnpm view` / `pnpm outdated -r` at the start of any phase that touches dependencies, and re-run all gates after an upgrade.

### Runtime and tooling

- **Node.js 24 LTS** (pinned in `.nvmrc`, root `engines` and CI; Node 20 is end-of-life)
- **pnpm 12** workspaces + **Turborepo** (keep the Turbo config minimal)

### Frontend

- **React 19.3** + **TypeScript 6** (strict), **Vite 8**
- **Tailwind CSS 3.4** with a `tailwind.config.js` theme (v4 only with an explicit `@config`)
- **React Router 8**
- State management appropriate to the need: **TanStack Query** for server state, minimal local/global state otherwise (Context or Zustand only if truly needed)
- **Vitest 5** + React Testing Library

### Backend

- Node.js + **Express 5** + TypeScript, RESTful API, JWT authentication
- **Zod 4** for validation, **pino** for logging
- Vitest + Supertest

### Database

- **PostgreSQL** + **Prisma 7** (`prisma-client` generator with the `@prisma/adapter-pg` driver adapter; the client is generated into `apps/api/src/generated/`, git-ignored, on install)
- Prisma migrations (committed), seed script

### Code quality

- ESLint 9, Prettier, TypeScript **strict mode**
- Automated lint, format check, type-check and tests (locally and in CI)

### Repository

- **Monorepo**; `apps/web` and `apps/api` must stay **independently deployable** and share only `packages/*`. No cross-imports between the apps.

---

## 3. Monorepo structure

```text
project-root/
├── apps/
│   ├── web/                     # React app
│   └── api/                     # Express app
│       ├── prisma/              # schema.prisma, migrations/ — lives here, not at
│       │                         # the repo root: Prisma's client generator infers its
│       │                         # "project root" from the schema file's own directory, and
│       │                         # @prisma/client is deliberately only installed in apps/api
│       │                         # (avoids pnpm's non-hoisted node_modules resolution across
│       │                         # workspace packages) — co-locating them is required, not
│       │                         # just tidy. See docs/design-notes.md.
│       ├── prisma.config.ts     # Prisma 7 config (datasource URL, migrations path)
│       └── src/seed/            # seed runner and generator (type-checked with the API)
├── packages/
│   ├── shared/                  # zod schemas (incl. employee response schemas), ROLES, constants, pure utilities
│   ├── types/                   # shared TypeScript types (API contracts, Role, EmployeeFull / EmployeeDirectory)
│   ├── ui/                      # (optional) shared UI primitives; skip if web-only is simpler
│   ├── eslint-config/
│   └── typescript-config/
├── tests/                       # @payscope/tests: ALL test code lives here (see section 11)
│   ├── api/{unit,integration,setup}/
│   ├── web/{features,components,setup}/
│   ├── packages/{shared,types}/
│   ├── e2e/{specs,pages}/       # Playwright
│   ├── helpers/  factories/
│   ├── vitest.config.ts         # projects: api-unit, api-integration, web, packages
│   ├── playwright.config.ts     # added in Phase 9
│   ├── tsconfig.json
│   └── package.json
├── scripts/
│   └── check-test-locations.mjs # fails if a test file exists outside tests/
├── docs/
│   ├── requirements.md          # ONE page (Phase 0)
│   ├── design-notes.md
│   ├── ai-prompts.md
│   ├── architecture.md          # Mermaid diagrams
│   └── demo-script.md
├── .github/workflows/ci.yml
├── docker-compose.yml           # local Postgres (dev + test DBs)
├── .env.example
├── .nvmrc
├── package.json
├── pnpm-workspace.yaml          # apps/*, packages/*, tests
├── turbo.json
├── tsconfig.json
├── prettier.config.js
└── README.md
```

There are **no** `__tests__` folders or `*.test.*` files inside `apps/*` or `packages/*`. Test paths mirror the source paths they cover.

Pragmatism note: if `packages/ui` adds no value, omit it and record why in `design-notes.md`.

---

## 4. Frontend architecture

**Feature-based modular architecture.** Do not create a global folder where all components, hooks, API calls and state are mixed. Each feature owns its components, hooks, services (API), schemas (validation), types and state. Tests live in the root `tests/` package, not in the feature folders.

```text
apps/web/src/
├── app/
│   ├── router/          # routes, ProtectedRoute, role guard
│   ├── providers/       # QueryClient, Auth provider
│   ├── store/           # only if global state is truly needed
│   └── config/          # env access (VITE_API_URL etc.)
├── features/
│   ├── landing/         # hero, features, how it works, calls to action, footer
│   ├── auth/            # single login form, register form (role selector), hooks, services, schemas
│   ├── employees/       # table / cards, filters, form modal, hooks, services, schemas
│   ├── insights/        # charts, summary cards, hooks, services
│   └── ...
├── pages/               # thin route-level components composing features
├── components/
│   ├── ui/              # Button, Input, Modal, Table, Badge, Spinner...
│   └── layout/          # AppShell, Navbar, Sidebar
├── hooks/               # cross-feature hooks
├── services/            # http client (axios/fetch wrapper, interceptors)
├── lib/  utils/  types/  styles/
```

### Pages and routes (all required)

| Route | Page | Access |
| --- | --- | --- |
| `/` | **Landing page**: hero, what PayScope does, key features, how it works, calls to action, footer | public |
| `/login` | **Sign in** (one page for every role) | public |
| `/register` | **Register** (account type selector: HR Manager or Viewer) | public |
| `/app` | Dashboard / insights, content depends on the user's role | authenticated |
| `/app/employees` | Employee list, content depends on the user's role | authenticated |
| `*` | 404 page; 403 page for role violations | any |

### Frontend principles

- Component composition, Single Responsibility, separation of UI and business logic
- Components contain **no** direct API/implementation details; they call feature hooks and services
- Strict typing, reusable components, minimal global state, clear feature boundaries
- No duplicated API or business logic; no unnecessary abstractions

### Auth and roles on the client

- **One** sign-in page (`/login`) for every role. Login takes email and password only; there is no portal or role field. The API returns the user's `role` with the login response and from `GET /auth/me`.
- After sign in, redirect to `/app`; the app reads the role and renders the matching experience. Signed-in users visiting `/login` or `/register` are redirected to `/app`.
- Register page with client-side validation (shared zod schemas), an account type selector (`HR_MANAGER` or `VIEWER`) and clear server-error display.
- Store the JWT and attach it through an HTTP client interceptor; `ProtectedRoute` and a role guard; auto-logout on 401; a 403 page; visible logout.
- Token storage choice (localStorage vs httpOnly cookie) must be justified in `design-notes.md` (XSS vs CSRF trade-off).

### Role-based experience

| | `HR_MANAGER` | `VIEWER` |
| --- | --- | --- |
| Dashboard / insights | Full: salary statistics by country, job title and department, bands, tenure, outliers table | Aggregated statistics only. No outliers table (it lists individuals with salaries) |
| Employee list and detail | All fields, including individual salary | Directory fields only. Individual salary is omitted by the API |
| Sort and filter | Any whitelisted field, including salary | Salary sort or filter is rejected with a validation error (it would leak ordering) |
| CSV export | All columns | Same rows, without the salary column |
| Create, edit, delete | Yes | No (403). Write controls are not rendered |
| Navigation | Employees, Insights, Export, Add employee | Employees, Insights |

- The UI must not render empty salary columns or disabled write buttons for Viewers: show a layout designed for read-only use.
- The API enforces all of this; the UI only reflects it (section 9).

### Employees UI

- Table with server-side pagination, debounced search, filters (country, department, job title), column sorting; below the `md` breakpoint it renders as stacked cards
- HR Manager: create/edit modal with inline validation, delete confirmation, export button. Viewer: read-only directory
- Loading, empty and error states; keyboard accessible

### Insights UI

- Summary cards and charts (Recharts): pay by country / job title / department, salary distribution; the outliers table for HR Managers only
- Currency always shown explicitly; optional USD-normalized toggle clearly labeled

### Responsive design (mandatory on every page)

- Mobile-first with Tailwind breakpoints defined in `tailwind.config.js`. Verify at about 360px, 768px and 1280px widths.
- No horizontal page scroll. Wide tables scroll inside their own container, or render as stacked cards below `md`.
- Navigation collapses into a menu button on small screens. Forms are single-column on mobile. Touch targets are at least 44px.
- Charts use responsive containers. Landing sections stack cleanly on mobile.
- Accessible: labelled inputs, visible focus states, sufficient contrast, keyboard operable, semantic landmarks.
- No inline style objects; use theme tokens and the shared component classes.

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
│   │   └── auth.types.ts
│   ├── employees/         # same shape, plus employees.serializer.ts (role-based shapes) and employees.access.ts (role query rules)
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
├── seed/                  # deterministic seed (run.ts, seed.ts, generator, guard)
└── server.ts              # process bootstrap
```

### Layer responsibilities

- **Routes:** define endpoints and attach middleware
- **Controllers (thin):** parse the request, call services, shape the response and HTTP status
- **Services:** business logic and rules, including **role-based field filtering** (section 9). **Never** put business logic in routes or controllers.
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

- Register and login return `{ user, token }`, where `user` includes `role`. `GET /auth/me` returns the user with `role` too. **Never** return the password hash.
- **One login for every role:** login takes `email` and `password` only (strict schema). There is no portal or role field.
- The JWT payload carries only the user id (`sub`) and `role`.
- Hash passwords with **bcrypt (cost 12)** or **Argon2id**. Never store or log plain text. State the choice in `design-notes.md`.
- Validate and sanitize all input: required fields, email format and lowercase/trim normalization, password strength rules
- Login failures (unknown email, wrong password) return identical responses (prevent user enumeration), and take similar time
- JWT signed with `JWT_SECRET`, expiry from `JWT_EXPIRES_IN`. **Fail fast at startup** if secrets are missing.
- `authenticate` middleware verifies the Bearer token: 401 for missing/invalid/expired; `authorize(...roles)` middleware: 403 for insufficient role
- **Roles:** `HR_MANAGER` (full access) and `VIEWER` (directory and aggregated data only, no writes).
- **Registration role:** `role` is optional and accepted only from the enum `HR_MANAGER | VIEWER`; when omitted it defaults to **`VIEWER`** (least privilege). The schema stays `.strict()`: an unknown role, a different case, `null` or any other extra field is a 400. The `User.role` column default is also `VIEWER`.
- Public self-selection of the role is an **assessment-only simplification** (a reviewer can try both experiences without an admin). Document it in `design-notes.md`, with the production alternative: HR Managers invite Viewers, or an admin approves HR Manager accounts and self-registration only ever creates a `VIEWER`.
- Seed two demo accounts (one `HR_MANAGER`, one `VIEWER`), clearly labelled as demo-only, with credentials in the README.
- Rate limiting on auth routes; proper 409 on duplicate email
- **All** `/api/v1/employees` and `/api/v1/insights` routes require a valid JWT; write routes require `HR_MANAGER`; role-restricted data is filtered in the API, never only in the UI (section 9)
- **Logout/token invalidation:** JWTs are stateless. Use short-lived access tokens, client-side token discard, and document what a server-side revocation strategy (e.g. `tokenVersion` on the user, or a denylist) would add later. Implement `tokenVersion` only if it stays small.

---

## 8. Database (PostgreSQL + Prisma)

- Prisma schema, version-controlled migrations, seed script
- Proper relationships, foreign-key constraints, unique constraints, and **indexes on every filter/sort column**
- Transactions for atomic operations (batch seeding, CSV import if built)
- Avoid N+1 patterns and unnecessary round trips

**Models (as built; `User.role` defaults to `VIEWER`):**

```prisma
enum Role            { HR_MANAGER VIEWER }
enum EmploymentType  { FULL_TIME PART_TIME CONTRACT INTERN }
enum LogLevel        { DEBUG INFO WARN ERROR FATAL }

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(VIEWER)   // least privilege; own migration, registration passes the role explicitly
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

### Role-based data (enforced by the API)

Field-level filtering happens **in the service layer**, through one serializer, so no controller or repository can forget it. Every employee service function takes the caller's role and returns one of two wire shapes (types in `@payscope/types`, zod response schemas in `@payscope/shared`):

- `EmployeeFull` (`HR_MANAGER`): all fields, including `salary` (integer minor units)
- `EmployeeDirectory` (`VIEWER`): the same fields **without a `salary` key at all** (omitted, never `null`). It is built from an explicit allowlist, so a column added to the model later stays hidden from Viewers until deliberately listed. Any role other than exactly `HR_MANAGER` gets this shape.

| Endpoint | `HR_MANAGER` | `VIEWER` |
| --- | --- | --- |
| `GET /employees`, `GET /employees/:id` | Full shape | Directory shape |
| `GET /employees` or export with `sortBy=salary` | Allowed | **400** validation error (sorted order would leak salary ranking). Any future salary filter is rejected the same way |
| `GET /employees/export.csv` | All columns | Same rows and order, **no salary column** (header included) |
| `POST`, `PUT`, `DELETE /employees` | Allowed (responses use the full shape) | 403 |
| Insights | Full, including the outliers endpoint | Aggregated statistics only; the outliers endpoint is **403** (it lists individuals with salaries) |

### Endpoints

**Employees**

- `GET    /employees` with `page, pageSize, search, country, department, jobTitle, sortBy, sortDir`
- `GET    /employees/:id`
- `POST   /employees`
- `PUT    /employees/:id`
- `DELETE /employees/:id`
- `GET    /employees/export.csv` (respects the current filters; stream it, do not buffer 10k rows in memory unnecessarily; no salary column for `VIEWER`)

**Insights** (all questions HR actually asks; `GET /insights/...`, any signed-in role unless noted; optional `country`, `currency`, `department`, `jobTitle` filters)

- `stats?groupBy=country|jobTitle|department[&view=usd]`: min / p25 / median / avg / p75 / max and headcount by group, always **per currency** (native view), using Postgres `percentile_cont` through parameterized `$queryRaw`. `groupBy=org` (one org-wide row) is only allowed with `view=usd`.
- `headcount?by=country|department|jobTitle|employmentType`: headcount distribution (no salary data)
- `salary-bands?currency=XXX&buckets=10` (or `view=usd`): equal-width salary histogram
- `tenure`: headcount, median and average pay by tenure band (`<1y`, `1-3y`, `3-5y`, `5-10y`, `10y+`)
- `outliers?limit=50`: employees outside the Tukey fences of their country, currency and job-title group (groups of at least 8); **`HR_MANAGER` only**, 403 for `VIEWER`
- `view=usd`: optional org-wide normalization from a static, documented rate table; results are US cents, labelled `approximate`, and report employees with no rate instead of dropping them
- For a `VIEWER`, groups (and salary-band sets) with fewer than 5 employees are suppressed, with a count of what was hidden, because a statistic over one person is that person's salary

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

### Where tests live

**All** test code lives in the root `tests/` workspace package (`@payscope/tests`). There are no `__tests__` folders or `*.test.*` files in `apps/*` or `packages/*`, and test paths **mirror** the source paths they cover. `scripts/check-test-locations.mjs` enforces this: it fails if a `*.test.*`, `*.spec.*` or `__tests__` path exists outside `tests/`, and it runs inside `pnpm lint` (so it runs locally and in CI's Lint step).

```text
tests/
├── api/
│   ├── unit/                 # config, lib (password, jwt, logger redaction), middleware, modules/{auth,employees,insights}
│   ├── integration/          # health, auth, employees, insights (real PostgreSQL)
│   └── setup/                # global setup (migrate), per-test DB truncate
├── web/
│   ├── features/{landing,auth,employees,insights}/
│   ├── components/
│   └── setup/                # jsdom, RTL setup
├── packages/{shared,types}/
├── e2e/{specs,pages}/        # Playwright: *.spec.ts, page objects
├── helpers/                  # signed test tokens (any role), request helpers
├── factories/                # employee and user data builders
├── vitest.config.ts          # projects: api-unit, api-integration, web, packages
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

Folders also exist for source areas the sketch above does not list (for example `app/`, `seed/`, `database/`). Files use `.test.ts` / `.test.tsx` (unit, integration) or `.spec.ts` (Playwright). Source is imported through the `@api/*`, `@web/*`, `@shared/*` aliases. `@prisma/client` is never a dependency of `tests`: tests use the API's own client, adapter and `prisma.config.ts` (documented in `docs/design-notes.md`).

Scripts keep their names: `pnpm test` (unit: api-unit + web + packages), `pnpm test:integration`, `pnpm test:e2e`. Every bug fix gets a regression test.

### Frontend (Vitest + React Testing Library)

Test user-visible behavior, not implementation details: rendering, interactions, form validation, auth flows, loading and error states, feature logic, service behavior, edge cases. **Required coverage:**

- the single login page: success, failure, redirect to `/app`
- register with the role selector
- the landing page calls to action
- role-based UI for both roles: `HR_MANAGER` sees salary and write controls; `VIEWER` sees no salary column, no write controls and no outliers table
- responsive behavior of the main layout where testable

### Backend (Vitest + Supertest)

- **Unit:** services, business rules, auth logic (hashing/JWT), validation schemas, serializers, utilities, error classification, logger redaction
- **Integration:** routes + middleware + controllers + services + Prisma + real PostgreSQL (`TEST_DATABASE_URL`, never the dev database; migrated once, tables truncated between tests). Cover registration, login, protected endpoints, employee CRUD, authorization, insights correctness on a small known dataset.
- **API cases:** success, invalid input, unauthorized (401), forbidden (403), not found, conflict (409), validation failures, database errors, internal errors, edge cases (negative salary, unknown currency, duplicate email, bad pagination)
- Test that the error response never leaks internals in `NODE_ENV=production`
- **Role-based data (required):**
  - registration: role defaults to `VIEWER`, both explicit roles work, invalid or unknown roles and extra fields are rejected; login and `/auth/me` return the role
  - a `VIEWER` response never contains a `salary` key (list, detail, export), checked with the strict directory schema and on the raw response text; `HR_MANAGER` always does
  - salary sort (and any salary filter) is rejected for `VIEWER`
  - the outliers endpoint returns 403 for `VIEWER`
  - `HR_MANAGER` behavior is pinned by regression tests, so role rules can only take data away from a Viewer

### E2E (Playwright, critical flows only)

```text
Register -> Login -> Authenticated Dashboard -> Feature interaction (create/edit employee, view insights) -> Logout
```

Run the critical flow for **both** roles, on a **desktop and a mobile viewport** (Playwright projects). Test the seed/generator determinism and salary-band generation with unit tests.

---

## 12. Phased delivery plan

Each phase ends with passing type-check, lint, format check and tests, and one or more small commits.

**Status (from git history and code):** Phases 0 to 6 are done. Change requests A (toolchain upgrade), B (tests consolidated under `tests/`), C (role-aware auth and data) and D (spec sync) are done; E is deferred until before Phase 10. **Phase 7 is next.** The web app is still the Phase 1 scaffold (app shell, router and query provider, design tokens, no pages). CI is a skeleton with no E2E yet. Nothing is deployed.

**Phase 0: Requirements (no code)**
Write `/docs/requirements.md` on **ONE page**: Goal, Persona, Scope and features, **What is deliberately left out and why**, Assumptions, Success criteria. Present it, list assumptions or open questions, and **wait for my approval**.

**Phase 1: Monorepo, tooling and design system**
pnpm workspaces + Turborepo, shared TS/ESLint configs, Prettier, `docker-compose` (dev + test Postgres), `.env.example`, Tailwind config and global stylesheet with the tokens and component classes, husky/lint-staged (optional), CI skeleton.

**Phase 2: Backend foundation and cross-cutting concerns**
Config validation, Prisma setup and initial migration, app factory, request ID, logger (with redaction), AppError + global error handler, `ApplicationLog` persistence with async writes and fallback, validation middleware, rate limiting, helmet/CORS, health check. Tests for each.

**Phase 3: Authentication** (done; role-aware follow-up in change request C)
Auth module (register/login/me/logout), JWT middleware, role authorization, tests (including hash-not-plain, expired/invalid token, enumeration-safe login, duplicate email). Registration accepts an optional `role` (default `VIEWER`); login returns the role.

**Phase 4: Employees module** (done; role-based shapes in change request C)
CRUD, search/filter/sort/pagination, CSV export, indexes, tests. `VIEWER` gets the directory shape, no salary column in the export, and cannot sort by salary.

**Phase 5: Seeding (10,000 employees)**
Deterministic seed (seeded RNG): 8-10 countries with matching currencies, realistic name pools, 15-20 job titles with plausible per-country salary bands, departments, hire dates. Use `createMany` in batches inside transactions; must finish in seconds; re-runnable (`pnpm db:seed` resets employees and reseeds). Also seed two **clearly labeled demo** accounts, one `HR_MANAGER` and one `VIEWER` (credentials in README).

**Phase 6: Insights module** (done)
Percentile/statistics queries, bands, tenure, optional USD view, and the **HR-only outliers endpoint** (403 for `VIEWER`; the other insights endpoints return aggregated statistics to both roles). Record measured timings on 10k rows in `design-notes.md`. Tests on a small hand-checked dataset, including the role rules.

**Phase 7: Web foundation, landing page and auth UI**
Providers, router (`/`, `/login`, `/register`, `/app`, `/app/employees`, 404 and 403 pages), `ProtectedRoute` and role guard, HTTP client with interceptors and auto-logout on 401, the **landing page**, the **single login page**, the **register page** (account type selector), AppShell with visible logout, and responsive navigation. Component tests for login, register, landing calls to action, and guards.

**Phase 8: Employees UI, role-based dashboards and responsive pass**
Employee table/cards, filters, form modal (HR Manager), read-only directory layout (Viewer), and the insights **dashboards for both roles** (full with outliers for HR Manager; aggregated only for Viewer), charts, and the responsive pass at about 360, 768 and 1280px. Component tests for the form, role-based UI for both roles, and one critical flow.

**Phase 9: E2E, CI/CD and docs**
Playwright critical-flow test (both roles, desktop and mobile viewports), full CI pipeline, OpenAPI docs, README, `architecture.md` (Mermaid), `demo-script.md`.

**Phase 10: Deployment and readiness**
Dockerfiles for both apps, deploy the API + managed PostgreSQL + web (suggest the simplest reliable option, e.g. Render, Railway, Fly.io or AWS), run migrations on deploy, a **production-start smoke check** (see section 13), seed production with 10,000 employees, put the live URL in the README. Prepare the demo video script.

---

## 13. CI/CD quality gates

`.github/workflows/ci.yml` runs on every pull request (and on push to `main`), on the Node version in `.nvmrc`, with a Postgres service container:

```text
Install (pnpm, cached) -> Type check -> ESLint + test-location guard (pnpm lint) -> Prettier check -> Unit tests -> Integration tests -> Build -> E2E tests
```

The test-location guard (`scripts/check-test-locations.mjs`) runs inside `pnpm lint`, so the Lint step fails if a test file appears outside `tests/`. The pipeline fails if any mandatory gate fails. Only green code is eligible for merge and deploy. Use Turborepo caching where it helps (the `@payscope/tests` tasks also hash the source they cover, so a cached result can never go stale).

**Planned (change request E): production-start smoke check.** After Build, start the compiled API the way production does and call `/health`. This is needed because `pnpm build` followed by `node dist/server.js` does not start today (`@payscope/shared` is consumed as TypeScript source); the defect is recorded in `docs/design-notes.md`, and no gate catches it yet. Not implemented at the time of writing.

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
DEMO_USER_PASSWORD=         # optional: overrides the demo accounts' password when seeding
ALLOW_PRODUCTION_SEED=      # optional: must be true to seed when NODE_ENV=production

# web
VITE_API_URL=http://localhost:4000/api/v1
```

Never commit real secrets. Validate all env vars with zod at startup and fail fast.

---

## 15. Code quality standards

TypeScript strict mode everywhere; ESLint + Prettier enforced locally and in CI; consistent naming; Single Responsibility; clear module boundaries; no duplicated business logic; no unnecessary global state; no hard-coded secrets; no dead code; no unnecessary over-engineering.

**Root scripts (pnpm + turbo):** `dev`, `build`, `typecheck`, `lint` (ESLint in every package, then the test-location guard), `format`, `format:check`, `test` (unit: api-unit + web + packages), `test:integration`, `test:e2e`, `db:migrate`, `db:generate`, `db:seed`, `db:reset`. Script names never change when files move; CI and Turbo tasks point at `tests/`.

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
- [ ] Insights answer real HR questions and are verified by tests on a known dataset; the outliers endpoint is HR-only
- [ ] Role-based data is enforced by the API: a `VIEWER` never receives a salary (list, detail, export), cannot sort by it, and has no write access; proven by tests
- [ ] All tests live in `tests/`, and the location guard passes in `pnpm lint`
- [ ] Landing, single login and register pages work, are role-aware after sign in, and are responsive at about 360, 768 and 1280px
- [ ] Tailwind theme lives in `tailwind.config.js` with a global stylesheet and reusable component classes
- [ ] Each phase is its own commit(s) with Conventional Commit messages
- [ ] `/docs` contains requirements (one page), design-notes, architecture, ai-prompts, demo-script
- [ ] App is deployed and the README links to the live URL
- [ ] Short demo video recorded from `demo-script.md`

---

## 19. Start here

Phases 0 to 6 and change requests A to D are done (section 12). **Continue with Phase 7 only**, in plan mode, and wait for approval before each further phase. `CLAUDE.md` holds the standing workflow rules.
