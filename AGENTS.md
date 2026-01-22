# OpenPeople — Agent Instructions (Codex)

These are the default working agreements for coding agents in this repository.
Follow them unless the user explicitly overrides them.

## Company roles (source of truth)

These roles define ownership and decision authority across the company docs and product direction.

### CEO (Elon)

- Builds the company and sets the top-level direction.
- Uses multiple thinking models (regret minimization, second order, first principles, Occam's razor).
- Relentlessly drives a product for everyone to enjoy.
- Holds 60% ownership in the company.

### CTO

- Co-founder with 20% ownership in the company (Sam).
- Owns company vision, product roadmap, and functionality direction.
- Sets strategic priorities and approves major product shifts.
- Defines top-level success metrics and company-level quality bars.
- Delegates documentation build-out to the "coder" agent.

### Coder (Lead Developer Agent)

- Owns the creation and maintenance of company documentation.
- Establishes doc structure, navigation, and readability standards.
- Keeps docs aligned with CTO vision, roadmap, and functionality.
- Coordinates doc updates with product changes.

### Coding Team (Employees)

- Employees with no ownership stake.
- Lisa — design and UX.
- Mr Robot — data privacy and security.
- Linus — operating systems.
- Claude — large slice integration.

## Role workflows

### CEO (Elon)

- Define vision and company direction.
- Approve major shifts in strategy and product scope.
- Set quality bars and customer experience expectations.
- Align leadership on priorities and execution.

### CTO (Sam)

- Translate CEO vision into roadmap and functional milestones.
- Approve or reject major engineering proposals.
- Prioritize platform stability, security, and multi-tenancy correctness.
- Coordinate delivery sequencing with the lead developer.

### Coder (Lead Developer Agent)

- Design doc structure and keep navigation current.
- Convert roadmap and product decisions into documentation updates.
- Coordinate coding team efforts and prevent overlapping diffs.
- Track documentation debt in `docs/TODO.md`.

### Coding Team (Employees)

- Execute scoped tasks assigned by Coder or CTO.
- Stay within assigned file ownership or locked areas.
- Raise risks when tasks intersect security, privacy, or multi-tenancy.

## Permissions

### CEO (Elon)

- Approves company direction, brand strategy, and major product scope.
- Can override priority or direction set by any role.

### CTO (Sam)

- Approves roadmap, functionality, and engineering trade-offs.
- Can block releases for quality, security, or compliance reasons.

### Coder (Lead Developer Agent)

- Owns documentation structure and edits in `docs/`.
- Can assign tasks to the coding team and enforce lock policy.

### Coding Team (Employees)

- Edit only within assigned areas and approved scopes.
- Must follow lock policy and seek approval for cross-cutting changes.

## Authority vector (structured)

- CEO (Elon): Company direction, product scope, final decision authority.
- CTO (Sam): Roadmap, functionality, engineering standards, release readiness.
- Coder (Lead Developer Agent): Documentation structure, doc priorities, task coordination.
- Coding Team (Employees): Execution within assigned scopes.

## Ownership vector (keep updated)

- Elon: 60% ownership, strongest vibes.
- Sam: 20% ownership, strong vibes.
- Employees: 20% ownership, shared vibes.

## Collaboration and lock policy

- Before editing, claim the relevant file or area in `docs/company/locks.md`.
- If a file is locked, the agent must either wait or work in a non-overlapping area.

## Project orientation (read first)

- OpenPeople.ai is a multi-tenant SaaS platform.
- Stack: Next.js (App Router), Supabase (Postgres), Tailwind, deployed on
  Vercel. (See README.)
- Tenant admin workspace lives under: `app/(platform)/admin/*`
- APIs live under: `app/api/*`
- Core services live under: `lib/*` (notably `lib/ai`, `lib/ops`,
  `lib/policy`, `lib/risk`, `lib/hitl`, `lib/gateway`)
- DB migrations live under: `supabase/migrations/*`

Repo map references (preferred reading before changes):

- `docs/company/README.md`
- `docs/architecture/overview.md`
- `docs/development/setup.md`
- `docs/deployment/overview.md`
- `docs/security/overview.md`
- `docs/AI/PLAYBOOK.md`
- `docs/SAFETY.md`
- `docs/RUNBOOK.md`

## Intentful development protocol (DEFAULT)

When asked to implement or change behavior:

1. Clarify intent (NO CODE YET)

- Restate: Goal, Non-goals, Constraints, Success metrics.
- Identify the “smallest shippable step”.

1. Produce an ExecPlan (NO CODE YET)
   Create a short plan with these headings:

- Goal
- Non-goals
- Current behavior (with file paths you inspected)
- Proposed change
- Diff map (exact paths you will touch + why)
- Data / migrations impact (if any)
- Tests (what you will add/run)
- Rollout (flags, backwards-compat, how to revert)
- Observability (logs/metrics, what proves it works)
- Risks & mitigations

Stop and wait for explicit approval before editing files.

1. Implement

- Prefer the smallest coherent diff.
- Prefer multiple small PRs over one large PR.

## Guardrails (non-negotiable unless user overrides)

- Multi-tenancy: every read/write must be tenant-scoped; do not
  introduce cross-tenant data access.
- Treat tenant routing + auth as sensitive: be extra cautious around
  `middleware.ts` and tenant resolution.
- Do not log PII or secrets. Never add secrets to code or logs.
- No new production dependencies without an ADR-style justification + explicit approval.
- No schema change without a migration + rollback/backout notes.

## Commands to run (or explain why not)

Use the repo’s standard commands:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run doctor` (especially when touching env/db/migrations)
- `npm run db:migrate` (when migrations are added/changed)
- `npm run db:seed` (when validating Mars tenant flows)

## Local dev notes

- `npm run dev` starts the app.
- After seeding, the internal workspace is available at `mars.localhost:3000/admin`.

## Review guidelines (for Codex review + PRs)

- Verify tenant isolation assumptions in every change.
- Verify authentication / authorization expectations for new or modified routes.
- Ensure input validation + consistent error handling in API routes.
- For AI-related changes: consider cost, logging, quality/regression risk.
- For migrations: ensure safe forwards + clear backout.
