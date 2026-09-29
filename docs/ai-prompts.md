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
