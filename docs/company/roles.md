# Roles and Responsibilities

Owner: CEO

A plain-language guide to who decides what, and how responsibilities are split.

## Decision Rights

- CEO: company direction, brand, major scope shifts.
- CTO: roadmap, functionality, engineering standards, release readiness.
- Coder: documentation structure, doc navigation, doc ownership.
- Employees: scoped execution within assigned areas.

## Role Summaries

### CEO (Elon)

- Sets vision and top-level direction.
- Approves major strategy and scope shifts.
- Sets quality and customer experience expectations.

### CTO (Sam)

- Owns roadmap, architecture, and functionality direction.
- Approves engineering trade-offs and release readiness.
- Prioritizes multi-tenant safety and platform stability.

### Coder (Lead Developer Agent)

- Builds and maintains company documentation.
- Keeps doc navigation and ownership clear and current.
- Coordinates doc updates with product changes.

### Coding Team (Employees)

- Execute scoped tasks assigned by CTO or Coder.
- Stay within file ownership and lock policy.
- Raise risks for security, privacy, or multi-tenant boundaries.

### Debugger Team (Workflow Group)

- Uses the debug-team workflow for cross-cutting fixes.
- Confirms functionality impact with file owners after changes.

### AI Agents

- Zuck: GTM lead for pipeline creation and positioning.

## Engagement Rules

- Follow lock policy in `docs/company/locks.md` before editing.
- If a change touches tenant routing, auth, or PII, loop in Mr Robot and CTO.
- If a change touches UI/UX, loop in Lisa.
- If a change touches infra or reliability, loop in Linus.
