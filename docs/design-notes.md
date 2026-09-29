# Design notes

Trade-offs, alternatives considered, and performance measurements. Update as decisions are made.

## Decisions
| Decision | Options considered | Choice | Reason |
| -------- | ------------------ | ------ | ------ |
| `packages/ui` | Shared UI primitives package vs. web-only `components/ui` | Omitted (web-only `components/ui`) | Only one consumer (`apps/web`) exists in this project; a shared package would add a build/publish step for zero reuse benefit. Spec §3 explicitly allows skipping it. |
| `db:*` root scripts | Add `db:migrate`/`db:seed`/`db:reset` in Phase 1 vs. defer | Deferred to Phase 2 | Prisma doesn't exist until Phase 2 (spec §12); a script that always fails until then is worse than no script. |
| `apps/api` Phase 1 scope | Build health check / config / error handling now vs. bare scaffold | Bare `createApp()` factory (Express + JSON body parsing only) | Spec §12 assigns config validation, Prisma, error handling, logging, and the health check to Phase 2. Building them now would violate "work one phase at a time" and get redone once real config validation lands. |
| Pre-commit linting | `eslint --fix` + `prettier --write` in lint-staged vs. `prettier --write` only | Prettier only | Each workspace package owns its own flat `eslint.config.js`; `eslint --fix` invoked from the repo root (where lint-staged runs) can't resolve per-package configs. `pnpm lint` (via Turborepo, per-package) remains the enforced gate before every commit per `CLAUDE.md` rule 3. |
| `eslint-plugin-import`'s `import/named` rule | Keep vs. disable | Disabled | It flags false positives on named imports from ESM-only packages (`@tanstack/react-query`, `@testing-library/react`) because its resolver isn't configured for workspace/path resolution. TypeScript's own type checking already catches genuinely missing exports, so the rule was redundant as well as noisy. |
| Root `tsconfig.json` | Full compiler options vs. references-only solution file | References-only (`"files": []` + `references`) | Actual strict compiler options live in `packages/typescript-config` and are consumed per-package; the root file exists only for spec §3 structure compliance and editor cross-package navigation — no script invokes `tsc -b` at the root. |

## Performance (10,000 employees)
| Operation | Measured time | Notes |
| --------- | ------------- | ----- |
