# Demo script (3 minutes)

Live app: `https://pay-scope-alpha.vercel.app/login`. Demo logins are in the [README](../README.md). Say the role, not the password.

## Before recording

- [ ] Wake the API: open its `/api/v1/health` URL and wait for `"database":"up"`. The first request after a pause can be slow.
- [ ] Sign in once as each demo account (HR Manager and Viewer) to check both work. Then log out.
- [ ] Use the live URL, not localhost.
- [ ] Close unrelated tabs and notifications. Zoom the browser so text is readable.
- [ ] Open the repo in the editor with `docs/` and `tests/` folders collapsed.
- [ ] Know what is not built (see the end) so you do not claim it.

## Walkthrough

| Time | Do | Say |
| ---- | -- | --- |
| 0:00 | Landing page `/`. Scroll once. Click **Sign in**. | "PayScope helps the HR Manager of ACME, 10,000 employees in several countries, manage pay and spot gaps. One sign-in page serves two roles." |
| 0:20 | Log in as the HR Manager. You land on `/app`. | "Login takes only email and password. The API returns the role and the app shows the matching view." |
| 0:30 | **Employees**. Type a name in search. Filter by country. Sort by salary. | "Search, filters and sort run on the server. Salary sort works for HR only." |
| 0:55 | Open **Edit** on one row, change the job title, save. Click **Export CSV**. | "Editing is HR only. The export follows the current filters and includes salary." |
| 1:15 | **Insights** (`/app`). Change the currency selector. Point at the salary bands. Scroll to **Outliers**. | "Insights are per currency, so nothing is mixed silently. Outliers are compared with the same country, job title and employment type: 176 flagged, not 483." |
| 1:45 | Log out. Log in as the Viewer. | "Same page, different role." |
| 1:55 | Employees: no salary column, no Add or Edit. Insights: no outliers section. Point at the "groups hidden: fewer than 5 employees" note and at the bands note. | "The API never sends a Viewer a salary, so hiding it is not just the screen. Small groups are hidden and counted. Bands use rounded steps." |
| 2:15 | Narrow the window to phone width (about 360 px) or use device mode. Open the menu button, show the employee cards. | "No sideways page scroll. Tables become cards. Touch targets are 44 px." |
| 2:30 | In the editor: show `apps/api/src/modules`, `apps/web/src/features`, `packages/`. | "API layers: routes, controller, service, repository. The service applies role rules." |
| 2:42 | Open `tests/`. Show `api/unit`, `api/integration`, `web`. | "All tests live in one folder that mirrors the source. A lint check fails if a test file is elsewhere. 532 unit and 182 integration tests." |
| 2:52 | Open `docs/`. | "Requirements, design notes with the trade-offs, architecture diagrams, and the AI prompts log." |

## Say this, not more

- Anyone can pick a role when registering. That is a demo shortcut; production would use invitations.
- Playwright end-to-end tests and OpenAPI docs are not built yet.
- The USD view uses a fixed rate table and says it is approximate.
