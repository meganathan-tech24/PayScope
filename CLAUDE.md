# PayScope: Claude Code instructions

Full requirements live in `PROJECT_SPEC.md`. Read it at the start of every session. This file holds the rules that must always be followed. If the two ever disagree, this file wins, and you must fix `PROJECT_SPEC.md` to match.

## Project
PayScope is a salary management and pay insights app for an HR Manager at ACME (10,000 employees, multiple countries). It is a hiring assessment: reviewers value clear thinking, good engineering judgment, meaningful tests, and intentional AI use. Do not over-engineer.

## Stack and versions
- Monorepo: pnpm workspaces + Turborepo (`apps/web`, `apps/api` incl. `apps/api/prisma/`, `packages/*`, `tests/`)
- Runtime: **Node.js 24** (Current, enters LTS in October 2026). Pin it in `.nvmrc`, root `engines`, CI and Dockerfiles. Fallback: if a dependency or the hosting platform does not support 24, use **Node 24 LTS** and record why in `docs/design-notes.md`. Node 20 is end-of-life: do not use it.
- Web: **React 19.3.0** (latest stable), TypeScript, Vite, Tailwind CSS, React Router (latest stable, v8.x), TanStack Query
- API: Express, TypeScript, JWT, zod, pino
- DB: PostgreSQL + Prisma (migrations committed)
- Tests: Vitest, React Testing Library, Supertest, Playwright
- Quality: ESLint, Prettier, TypeScript strict

### Version policy
- Use the **latest stable** release of Node, React, React DOM, React Router, Vite, TypeScript, Vitest, Express, Prisma and other tooling. Never use canary, experimental or alpha builds.
- Verify, do not assume: run `pnpm view <package> version` and `pnpm outdated -r`, and check nodejs.org for the Node release status. Do this at the start of any phase that touches dependencies, and after any upgrade run the full quality gates.
- Do not blindly jump majors. Tailwind must keep a `tailwind.config.js` theme (v3, or v4 with an explicit `@config`). pnpm 12 (August 2026) is new: upgrade only if install and tests pass, otherwise stay on the current pin.
- Record the final versions in a table in `docs/design-notes.md`, and remove any old workaround pins (for example the Vite pin made for Node 20.9) once they are no longer needed.

## Workflow rules
1. Work one phase at a time, in the order given in `PROJECT_SPEC.md` section 12. Never start the next phase without my go-ahead.
2. After each phase run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` (and `pnpm test:integration` when the API changed). Fix failures before committing.
3. Make small, incremental Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`). Never squash. Never force-push.
4. Append to `docs/ai-prompts.md` after each phase (prompt used + decision made) and to `docs/design-notes.md` when a trade-off is made.
5. Tick the matching boxes in `README.md` ("What is implemented") only when the feature is actually done and tested.
6. If a requirement is heavy for its value, build the smallest correct and secure version and note the trade-off. Ask before changing scope.
7. Keep responses short and commit after each item. Never put attack payloads (command-execution or DDE-style strings) in code, tests, comments or docs; use harmless samples.

## Frontend: pages, routes and roles

### Pages (all required)
| Route | Page | Access |
| --- | --- | --- |
| `/` | **Landing page**: hero, what PayScope does, key features, how it works, calls to action, footer | public |
| `/login` | **Sign in** (one page for every role) | public |
| `/register` | **Register** (account type selector: HR Manager or Viewer) | public |
| `/app` | Dashboard / insights, content depends on the user's role | authenticated |
| `/app/employees` | Employee list, content depends on the user's role | authenticated |
| `*` | 404 page; 403 page for role violations | any |

### One login, role-based experience
- There is **one** sign-in page (`/login`) for every role. Login takes email and password only. There is no portal or role field in the login request.
- The API returns the user's `role` with the login response, and `GET /auth/me` returns it too. The token payload carries only the user id and role.
- After sign in, redirect to `/app`. The app reads the role and renders the matching experience (see the table below). Signed-in users visiting `/login` or `/register` are redirected to `/app`.
- Registration accepts `role` only from the enum `HR_MANAGER | VIEWER` (schema stays `.strict()`, no other extra fields). Public self-selection of role is an assessment-only simplification: document it in `docs/design-notes.md`, together with the production alternative (HR Managers invite Viewers, or an admin approves HR Manager accounts).
- Provide `ProtectedRoute` and a role guard, auto-logout on 401, a 403 page, and a visible logout.
- Seed two demo accounts (one `HR_MANAGER`, one `VIEWER`), clearly labelled as demo-only, with credentials in the README.

### Role-based data (enforced by the API, not just the UI)
| | `HR_MANAGER` | `VIEWER` |
| --- | --- | --- |
| Dashboard / insights | Full: salary statistics by country, job title and department, bands, tenure, outliers table | Aggregated statistics only. No outliers table (it lists individuals with salaries) |
| Employee list and detail | All fields, including individual salary | Directory fields only. **Individual salary is omitted by the API** |
| Sort and filter | Any whitelisted field, including salary | Salary sort or filter is rejected with a validation error (it would leak ordering) |
| CSV export | All columns | Same rows, **without the salary column** |
| Create, edit, delete | Yes | No (403). Write controls are not rendered |
| Navigation | Employees, Insights, Export, Add employee | Employees, Insights |

- Field-level filtering happens in the service layer so no controller or repository can forget it. The Viewer response schema must not contain `salary` at all (omit the key, do not send null).
- The UI must not render empty salary columns or disabled write buttons for Viewers: show a layout designed for read-only use.
- Insights endpoints that expose individuals (outliers) require `HR_MANAGER` (403 for `VIEWER`).
- If you think this split is wrong for the product, say so before implementing; do not silently soften it.

### Responsive design (mandatory on every page)
- Mobile-first with Tailwind breakpoints defined in `tailwind.config.js`. Verify at about 360px, 768px and 1280px widths.
- No horizontal page scroll. Wide tables scroll inside their own container, or render as stacked cards below the `md` breakpoint.
- Navigation collapses into a menu button on small screens. Forms are single-column on mobile. Touch targets are at least 44px.
- Charts use responsive containers. Landing sections stack cleanly on mobile.
- Accessible: labelled inputs, visible focus states, sufficient contrast, keyboard operable, semantic landmarks.
- No inline style objects. Use theme tokens and the shared component classes.

## Architecture conventions
- Web: feature-based folders (`features/<name>/{components,hooks,services,schemas,types}`), with `pages/` composing features. Components hold no API or business logic. Features now include `landing`, `auth`, `employees`, `insights`.
- API: domain modules (`modules/<name>/<name>.{routes,controller,service,repository,schema,types}.ts`). Controllers stay thin, business logic lives in services, Prisma access in repositories.
- `apps/web` and `apps/api` never import from each other; share code only through `packages/*`.
- All API responses use the envelope in the spec (`success`, `data`/`message`, `code`, `requestId`).
- Tailwind theme tokens live in `tailwind.config.js`; reusable classes in the global stylesheet.

## Security rules (never break these)
- Never store, log, or return plain-text passwords or password hashes.
- Never log tokens, Authorization headers, cookies, or credentials. The logger redacts them.
- Secrets come only from environment variables, validated at startup. Never commit `.env`.
- Parameterized queries only. No string-built SQL.
- Never expose stack traces or DB errors to clients in production.
- All `/employees` and `/insights` routes require a valid JWT; write routes require `HR_MANAGER`.
- Login failures (unknown email, wrong password) return identical responses.
- Role-restricted data (individual salaries, outliers) is filtered in the API. Never rely on the UI to hide it.

## Domain rules
- Salary is stored in local currency as integer minor units.
- Never mix currencies silently. Insights are per currency by default.
- No `console.log` in the API. Use the central logger.

## Testing: everything lives in one `tests/` folder
All test code lives under the root `tests/` folder (a workspace package). There are **no** `__tests__` folders or `*.test.*` files inside `apps/*` or `packages/*`. Test paths **mirror** the source paths they cover.

```text
tests/
├── api/
│   ├── unit/
│   │   ├── config/
│   │   ├── lib/              # password, jwt, logger redaction
│   │   ├── middleware/
│   │   └── modules/
│   │       ├── auth/
│   │       ├── employees/
│   │       └── insights/
│   ├── integration/
│   │   ├── health/
│   │   ├── auth/
│   │   ├── employees/
│   │   └── insights/
│   └── setup/                # global setup, test app factory, DB reset/truncate
├── web/
│   ├── features/
│   │   ├── landing/
│   │   ├── auth/             # single login page, register, guards
│   │   ├── employees/
│   │   └── insights/
│   ├── components/
│   └── setup/                # jsdom, RTL setup, MSW/handlers if used
├── packages/
│   ├── shared/
│   └── types/
├── e2e/                      # Playwright
│   ├── specs/                # *.spec.ts (desktop and mobile viewport projects)
│   └── pages/                # page objects
├── helpers/                  # signed test tokens, request helpers
├── factories/                # employee and user data builders
├── vitest.config.ts          # projects: api-unit, api-integration, web, packages
├── playwright.config.ts
├── tsconfig.json
└── package.json              # @payscope/tests
```

- Naming: unit and integration files end in `.test.ts` or `.test.tsx`; Playwright files end in `.spec.ts`.
- Scripts keep their names: `pnpm test` (unit: api-unit + web + packages), `pnpm test:integration`, `pnpm test:e2e`. CI and Turborepo tasks must point at the new locations.
- Tests are fast, deterministic and readable. Test behavior, not implementation details. Every bug fix gets a regression test.
- Integration tests use the real PostgreSQL test database (`TEST_DATABASE_URL`), never the dev database.
- Prisma client resolution is a known pnpm pitfall (see `docs/design-notes.md`): make the `tests` package resolve `@prisma/client` correctly and document the solution.
- Frontend tests must cover: the single login page (success, failure, redirect to `/app`), register with the role selector, the landing page CTAs, and role-based UI for both roles (`HR_MANAGER` sees salary and write controls; `VIEWER` sees no salary column, no write controls and no outliers table), plus responsive behavior for the main layout where testable. Playwright runs the critical flow for **both** roles on a desktop and a mobile viewport.
- API tests must prove role-based data: a `VIEWER` response never contains a `salary` key (list, detail, export), salary sort or filter is rejected for `VIEWER`, the outliers endpoint returns 403 for `VIEWER`, and `HR_MANAGER` still gets everything.

## Pending change requests (apply in this order, each as its own commits)
- [ ] **A. Toolchain upgrade**: move to Node 24 and the latest stable React 19.3.0, React Router, Vite and other tooling per the version policy. Update `.nvmrc`, `engines`, CI, remove obsolete pins, record versions in `design-notes.md`. All gates green before and after.
- [ ] **B. Consolidate tests**: move every existing test into `tests/` using the structure above, in one `refactor(tests):` commit series. The test counts before and after must be identical (record them). Update package scripts, Vitest config, tsconfig, Turbo and CI.
- [ ] **C. Role-aware auth and data (Phase 3 and 4 follow-up)**: `role` accepted at registration (enum only, everything else still rejected); login stays email and password and returns the role; field-level filtering so `VIEWER` never receives `salary` from list, detail or CSV export; salary sort and filter rejected for `VIEWER`; tests for all of it, plus tests that invalid or unknown `role` values are rejected.
- [ ] **D. Sync `PROJECT_SPEC.md`**: update sections 2, 3, 4, 7, 11, 12, 13 and 15 to match this file. In section 12, Phase 7 now includes the landing page, the single login page and the register page; Phase 8 includes the role-based dashboards and the responsive pass; Phase 6 includes the HR-only outliers endpoint.

## Commands
- `pnpm dev` run web and api
- `pnpm typecheck` / `pnpm lint` / `pnpm format:check`
- `pnpm test` / `pnpm test:integration` / `pnpm test:e2e`
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset`
- `docker compose up -d` start local PostgreSQL