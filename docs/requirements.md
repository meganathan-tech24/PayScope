# Requirements — PayScope (Phase 0)

## Goal
Give ACME's HR Manager a fast, secure web app to manage salary data for 10,000 employees across multiple countries, replacing spreadsheets, and to answer pay questions (by country, department, job title, tenure) that Excel makes tedious.

## Persona
**HR Manager, ACME.** Not a developer. Needs to find/edit employee records quickly, trust the data is consistent, and get pay insights without writing formulas. Works across multiple countries/currencies.

## Scope and features
**In scope**
- Registration/login (JWT-protected app). Registration defaults to `HR_MANAGER` (demo simplification, documented).
- Employee CRUD: full name, email, job title, department, country, currency, salary (integer minor units), employment type, hire date.
- Server-side search, filter (country, department, job title), sort, pagination — responsive at 10k rows.
- CSV export respecting active filters, streamed (not buffered in memory).
- Insights dashboard: min/median/avg/max/p25/p75 by country/job title/department (per currency), headcount distribution & salary bands, pay-vs-tenure summary, outliers vs job-title median within a country, optional USD-normalized org view (static, labeled-approximate rate table).
- Seed script: deterministic, 10,000 realistic employees, 8-10 countries with matching currencies, plus one demo `HR_MANAGER` user.
- Two roles: `HR_MANAGER` (full access), `VIEWER` (read-only) — write routes require `HR_MANAGER`.

**Deliberately out of scope** (documented rationale, revisit later if needed)
- **Payroll/tax calculation** — a distinct regulated domain per country; not what this assessment tests.
- **Bonuses, equity, benefits, salary history/audit trail** — adds real modeling complexity (temporal data, versioning) beyond the core CRUD + insights ask; would be the natural next feature.
- **Approval workflows** — needs a workflow/state-machine layer and multi-user roles beyond HR_MANAGER/VIEWER.
- **Live FX rates** — an external dependency and failure mode for a value that's clearly labeled approximate anyway; a static documented table is sufficient and deterministic for tests.
- **Password reset, email verification, refresh-token rotation, SSO** — auth hardening that doesn't change the core product story; short-lived JWT + documented revocation strategy is enough for a demo.
- **Multi-tenancy** — single organization (ACME) is the stated scope; multi-tenant data isolation is a separate architectural concern.

## Assumptions
1. Registration is open and defaults every new user to `HR_MANAGER` — acceptable only because this is a demo/assessment; a real system would invite-only or admin-provision accounts.
2. "Multiple countries" = 8-10 seeded countries with their real ISO currencies, not full global coverage.
3. Salary is a single fixed annual (or otherwise consistent) figure per employee in local currency minor units — no pay components, no recurring changes over time.
4. USD normalization is for org-wide *viewing* only, never used to alter stored data or per-currency insights.
5. "Fast at 10k rows" means server-side pagination/filtering keeps list and insights queries in the low hundreds of ms locally; no specific SLA was given, so this will be measured and recorded in `design-notes.md` rather than targeted to a number in advance.
6. One environment/deployment target is enough for this assessment (no staging tier).
7. Token storage mechanism (localStorage vs httpOnly cookie) is an implementation decision to be justified in `design-notes.md` in Phase 7, not a Phase 0 decision.

## Success criteria
- HR Manager can register/login, and CRUD an employee, in under a few clicks each.
- Employee list search/filter/sort/pagination stays responsive against the full 10,000-row seed.
- Insights answer the stated HR questions correctly, verified against a small hand-checked dataset.
- CSV export respects active filters and streams rather than loading all rows into memory.
- No plaintext passwords/tokens ever stored or logged; all employee/insights routes require a valid JWT; writes require `HR_MANAGER`.
- `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` all pass in CI on every PR.
- Each phase lands as its own reviewable, Conventional-Commit history — no squashing.

## Open questions
- None blocking — proceeding with the assumptions above. Will flag inline if anything in later phases changes scope.

---
Next: Phase 1 (monorepo, tooling, design system) — will not start until this doc is approved.
