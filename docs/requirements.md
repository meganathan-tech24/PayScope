# PayScope: requirements

## Goal

Give an HR Manager one fast, secure place to manage employee salaries and see pay insights, instead of scattered spreadsheets.

## Persona

The HR Manager of ACME. ACME has 10,000 employees in several countries and pays in several currencies. They need to find people, correct records, compare pay, and spot unfair gaps.

## Roles

- **HR Manager:** sees and edits everything, including individual salaries and the outliers list.
- **Viewer:** a read-only colleague. A Viewer **never sees an individual salary**. The API removes it, so the screen cannot leak it. A Viewer gets the employee directory and aggregated statistics only.

## Scope (built)

- Register, and one sign-in page for both roles. Signed-in visitors go to `/app`.
- Employees: create, view, edit, delete (HR Manager). Search, filter by country, department and job title, sort, paginate. CSV export of the filtered set.
- Pay insights: min, quartiles, median, average and max by country, job title and department. Headcount, salary bands, pay by tenure, and outliers (HR Manager only).
- A seed of 10,000 synthetic employees and two labelled demo accounts.
- Works on a phone, tablet and desktop.

## Deliberately left out, and why

- **Payroll and tax:** a different product with legal weight.
- **Bonuses and equity:** one salary figure per employee keeps comparisons clear.
- **Salary history:** needs an audit design; not needed to answer today's questions.
- **Approval workflows:** heavy for the value here.
- **Live exchange rates:** insights are per currency. The optional USD view uses a fixed table and says it is approximate.
- **Password reset and email verification:** needs email delivery.
- **Multi-tenancy:** ACME is the only customer.

## Assumptions

- Salary is one annual figure, stored in the local currency's smallest unit.
- Currencies are never mixed silently.
- Anyone can choose a role when registering. This is a demo shortcut; production would use invitations or admin approval.
- The data is synthetic.

## Success criteria

- A Viewer's responses never contain a `salary` key, and salary sort or filter is refused for them. Tests prove it.
- Lists and insights answer in tens of milliseconds on 10,000 rows.
- Typecheck, lint, format and tests pass.
- Every page has no sideways page scroll at 360, 768 and 1280 px.

## Not done yet

Playwright end-to-end tests and OpenAPI documentation are planned, not built. See `design-notes.md`.
