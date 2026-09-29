# PayScope: Claude Code instructions

Full requirements live in `PROJECT_SPEC.md`. Read it at the start of every session. This file holds the rules that must always be followed.

## Project
PayScope is a salary management and pay insights app for an HR Manager at ACME (10,000 employees, multiple countries). It is a hiring assessment: reviewers value clear thinking, good engineering judgment, meaningful tests, and intentional AI use. Do not over-engineer.

## Stack
- Monorepo: pnpm workspaces + Turborepo (`apps/web`, `apps/api`, `packages/*`, `prisma/`)
- Web: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query
- API: Node.js, Express, TypeScript, JWT, zod, pino
- DB: PostgreSQL + Prisma (migrations committed)
- Tests: Vitest, React Testing Library, Supertest, Playwright
- Quality: ESLint, Prettier, TypeScript strict

## Workflow rules
1. Work one phase at a time, in the order given in `PROJECT_SPEC.md` section 12. Never start the next phase without my go-ahead.
2. Phase 0 (requirements doc) must be approved by me before any code is written.
3. After each phase run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`. Fix failures before committing.
4. Make small, incremental Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`). Never squash. Never force-push.
5. Append to `docs/ai-prompts.md` after each phase (prompt used + decision made) and to `docs/design-notes.md` when a trade-off is made.
6. Tick the matching boxes in `README.md` ("What is implemented") only when the feature is actually done and tested.
7. If a requirement is heavy for its value, build the smallest correct and secure version and note the trade-off. Ask before changing scope.

## Architecture conventions
- Web: feature-based folders (`features/<name>/{components,hooks,services,schemas,types,__tests__}`). Components hold no API or business logic.
- API: domain modules (`modules/<name>/<name>.{routes,controller,service,repository,schema,types}.ts`). Controllers stay thin, business logic lives in services, Prisma access in repositories.
- `apps/web` and `apps/api` never import from each other; share code only through `packages/*`.
- All API responses use the envelope in the spec (`success`, `data`/`message`, `code`, `requestId`).
- Tailwind theme tokens live in `tailwind.config.js`; reusable classes in the global stylesheet. No inline style objects.

## Security rules (never break these)
- Never store, log, or return plain-text passwords or password hashes.
- Never log tokens, Authorization headers, cookies, or credentials. The logger redacts them.
- Secrets come only from environment variables, validated at startup. Never commit `.env`.
- Parameterized queries only. No string-built SQL.
- Never expose stack traces or DB errors to clients in production.
- All `/employees` and `/insights` routes require a valid JWT; write routes require `HR_MANAGER`.

## Domain rules
- Salary is stored in local currency as integer minor units.
- Never mix currencies silently. Insights are per currency by default.
- No `console.log` in the API. Use the central logger.

## Testing rules
- Tests are fast, deterministic, and readable. Test behavior, not implementation details.
- Integration tests use the real PostgreSQL test database (`TEST_DATABASE_URL`), never the dev database.
- Every bug fix gets a regression test.

## Commands
- `pnpm dev` run web and api
- `pnpm typecheck` / `pnpm lint` / `pnpm format:check`
- `pnpm test` / `pnpm test:integration` / `pnpm test:e2e`
- `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:reset`
- `docker compose up -d` start local PostgreSQL
