# OpenPeople — Agent Instructions (Codex)

These are the default working agreements for coding agents in this repository.
Follow them unless the user explicitly overrides them.

## Project orientation (read first)

- OpenPeople.ai is a multi-tenant SaaS platform.
- Stack: Next.js (App Router), Supabase (Postgres), Tailwind, deployed on Vercel. (See README.)
- Tenant admin workspace lives under: `app/(platform)/admin/*`
- APIs live under: `app/api/*`
- Core services live under: `lib/*` (notably `lib/ai`, `lib/ops`, `lib/policy`, `lib/risk`, `lib/hitl`, `lib/gateway`)
- DB migrations live under: `supabase/migrations/*`

Repo map references (preferred reading before changes):

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

2. Produce an ExecPlan (NO CODE YET)
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

3. Implement

- Prefer the smallest coherent diff.
- Prefer multiple small PRs over one large PR.

## Guardrails (non-negotiable unless user overrides)

- Multi-tenancy: every read/write must be tenant-scoped; do not introduce cross-tenant data access.
- Treat tenant routing + auth as sensitive: be extra cautious around `middleware.ts` and tenant resolution.
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
