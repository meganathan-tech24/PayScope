# AI prompts log

Key prompts and instructions given to the AI coding tool, and the decisions that resulted. Append an entry after each phase.

## Entry template

### Phase N: <name>
- **Prompt / instruction:** <what I asked>
- **What the AI proposed:** <summary>
- **What I changed or rejected, and why:** <my judgment>
- **Outcome:** <commits, tests, result>

---

## Phase 0: Requirements
- **Prompt / instruction:** Read `PROJECT_SPEC.md` and produce the one-page requirements doc.
- **What the AI proposed:** `docs/requirements.md` covering goal, persona, in/out-of-scope features with reasoning per excluded item, assumptions (registration defaults to `HR_MANAGER`, 8-10 seeded countries, single fixed salary figure per employee, USD view is display-only, no fixed performance SLA pre-measurement, single deployment tier, token storage deferred to Phase 7), and success criteria.
- **What I changed or rejected, and why:** Approved as proposed, including all 5 stated assumptions, with no changes.
- **Outcome:** `docs/requirements.md` committed. Proceeded to Phase 1.

---

## Phase 1: Monorepo, tooling, design system
- **Prompt / instruction:** Use project name PayScope and the `@payscope/*` package scope. Run Phase 1 only. Use plan mode first: show the plan and the list of commits, then wait for approval before writing code.
- **What the AI proposed:** A plan (entered via plan mode, approved before any code was written) scoping Phase 1 to: pnpm workspace + Turborepo config, shared `@payscope/typescript-config` and `@payscope/eslint-config` packages, `@payscope/types` (API envelope types) and `@payscope/shared` (pagination constants) with unit tests, a Vite/React/TS/Tailwind web app shell (providers, router, AppShell, Button/Card, design tokens, global stylesheet) with a smoke test, an intentionally bare Express/TS api scaffold (`createApp()` factory only, no routes/config/logging — those are Phase 2) with a smoke test, `.env.example` plus per-environment templates, and a GitHub Actions CI skeleton. 11 commits were planned; two were merged during implementation (web app shell + Tailwind design system, since the app imports the stylesheet the moment it's scaffolded, so splitting them would leave an intermediate commit that doesn't build).
- **What I changed or rejected, and why:** Approved the plan as proposed. During implementation, fixed two issues the plan didn't anticipate: (1) `import/named` false-positives from `eslint-plugin-import` on ESM-only packages — disabled the rule since TypeScript already checks import resolution; (2) `eslint --fix` in the root `lint-staged` config couldn't resolve each package's flat `eslint.config.js` when run from the repo root — removed it from the pre-commit hook, keeping `pnpm lint` (Turborepo, per-package) as the real gate. Both are recorded in `docs/design-notes.md`.
- **Outcome:** `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` all pass across every workspace package; `pnpm build` produces `apps/web/dist` and `apps/api/dist`; `pnpm test:integration`/`pnpm test:e2e` no-op cleanly (no suites exist yet). 9 commits landed (`chore: set up pnpm workspace...` through `ci: add github actions pipeline skeleton...`).

---

## Phase 2: Backend foundation and cross-cutting concerns
- **Prompt / instruction:** Run Phase 2 only, plan mode first, plan + commit list before approval. Specific requirements: zod config validated at startup (fail fast on missing secrets), Prisma with the initial migration (User/Employee/ApplicationLog) including `CHECK (salary >= 0)`, request-id middleware (`X-Request-Id`, in logs/DB rows/error bodies), pino logger with redaction (authorization, cookie, password, token, passwordHash), `AppError` classes + global error handler with the standard envelope, `ApplicationLog` persistence (async writes, console fallback, a test proving a DB logging failure never changes the original API response), validation middleware (zod for body/query/params), rate limiting, helmet, restricted CORS, health check, at least one real integration test against the test database, and no `console.log` in the API (ESLint-enforced).
- **What the AI proposed:** A plan (approved before code) covering all of the above as 10 commits: env config, Prisma schema/migration/client, request-id middleware, central logger (console + DB transports, centralized redaction applied once before any transport rather than relying on pino's own `redact` option), `AppError` taxonomy + `classifyError` + global error handler, zod validation middleware, rate limiting/helmet/CORS, health check + full app-factory wiring, an integration test suite (two real tests against live Postgres), and a docs commit.
- **What I changed or rejected, and why:** Approved the plan as proposed. Two real implementation problems surfaced that the plan (reasonably) hadn't anticipated, both resolved and documented in `docs/design-notes.md`: (1) Prisma's generator infers its "project root" from the schema file's own directory, not from CWD/`--schema`/`prisma.config.ts`, so with `prisma/` at the repo root (as the spec's tree suggested) every `prisma generate` tried and failed to self-heal at the workspace root; moved `prisma/` into `apps/api/` instead, which fully resolved it. (2) The Express `Request` type augmentation pattern from the plan (`declare module 'express-serve-static-core'`) didn't merge correctly with this TS/Express version combination; switched to augmenting the global `Express.Request` namespace, which did. Also made one interrupted-session recovery mid-phase: re-ran the full check pipeline after a killed `tsc` process (exit 137, not a real failure) and continued from the exact uncommitted state.
- **Outcome:** All 10 planned commits landed. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` pass across all packages (48 API tests + existing web/package tests). `pnpm test:integration` passes against a real Postgres test database — no longer a CI no-op — verified locally (migrations applied automatically, tables truncated between tests, the error+logging integration test confirms a real `ApplicationLog` row is persisted end-to-end with a matching `requestId`). Manually curl-verified the running server: health check (200, real DB check), unmatched route (404 envelope, security/CORS/rate-limit headers, `X-Request-Id`), and confirmed the logged error actually landed in the dev database.
