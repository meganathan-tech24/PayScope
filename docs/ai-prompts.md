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
