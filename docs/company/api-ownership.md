# API Ownership Model

Owner: CTO

## Purpose

Shift from hiring external developers to building internal API owners who run their surfaces autonomously while protecting multi-tenant safety, reliability, and product quality.

## API Owner Charter

Each API owner is accountable for:

- Roadmap and delivery for their API surface.
- SLOs, error budgets, and reliability.
- Tenant isolation, security, and compliance checks.
- Runbooks, docs, and onboarding materials.
- Incident response and post-incident actions.

## Autonomy Ladder

## Autonomy Levels (no‑confusion definitions)

### Level 1 — Guided

Owner can:

- Draft changes, run tests, and open PRs.
- Ship **only** after CTO or Coder approval.

Must get approval for:

- Any production deploy
- Any behavior change in API responses
- Any data access or storage changes

Escalation:

- All incidents routed to CTO during incident response.

### Level 2 — Supervised

Owner can:

- Ship routine changes and bug fixes without pre‑approval.
- Handle incidents with CTO informed within 1 hour.

Must get approval for:

- New endpoints or breaking changes
- Any schema or migration change
- New dependencies
- Anything touching auth, tenant resolution, or PII handling

Escalation:

- CTO joins if incident is Sev‑1 or tenant isolation risk.

### Level 3 — Autonomous

Owner can:

- Ship independently, including new endpoints, as long as standards are met.
- Lead incident response and postmortems.

Must get approval for:

- Breaking changes (versioning required)
- New production dependencies
- Any change to tenant routing/auth
- Any change to data retention or compliance posture

Escalation:

- CTO is informed for Sev‑1 only.

## Non‑Negotiables (all levels)

- Tenant isolation is never optional.
- No PII in logs or metrics.
- Backward compatibility unless versioned.
- Every deploy must have a rollback plan.
- Runbooks are required for critical APIs.

## Release Checklist (all levels)

- Contract tests pass
- Tenant scope checks confirmed
- Error budget impact assessed
- Rollback plan documented
- Monitoring/alerts verified

## Approval Matrix (single source of truth)

- Breaking change: CTO approval required
- New dependency: CTO approval required
- Schema/migration change: CTO + rollback notes required
- Auth/tenant routing changes: CTO approval required
- Security/privacy changes: Mr Robot review required

## Readiness Criteria (to move up a level)

- 3 consecutive releases with zero tenant-scope regressions.
- SLOs met for 30 days.
- Runbook and on-call notes are complete.
- Contract tests exist for all critical endpoints.

## Performance Metrics (per API)

- Uptime / SLO compliance
- Error rate and latency (p95)
- Change failure rate
- Time to detect + time to resolve incidents
- Support ticket volume linked to API

## Cadence

- Weekly: owner review of metrics + risk
- Monthly: roadmap sync with CTO
- Quarterly: performance review + autonomy level review

## First API Pods (initial)

## First API Pods (initial)

- Email API — Owner: Claude — Backup: Lisa
- Vault API — Owner: Mr Robot — Backup: Linus
- Ops API — Owner: Linus — Backup: Mr Robot
- Tenant/Core API (auth + tenant mgmt) — Owner: Sam — Backup: Coder
- Admin/UI API (tenant admin workflows) — Owner: Lisa — Backup: Coder

## Autonomy Placement (initial)

- Guided: Email API, Admin/UI API
- Supervised: Vault API, Ops API
- Supervised → Autonomous candidate: Tenant/Core API (after 3 releases with zero tenant regressions)

## Example Scenarios (no ambiguity)

- Add a new endpoint that reads existing data: Level 2+ can ship; Level 1 needs approval.
- Add a new endpoint that writes new data or new table: CTO approval required.
- Change response shape for an existing endpoint: CTO approval required (breaking change unless versioned).
- Add a new dependency (npm package): CTO approval required.
- Any change to auth or tenant routing: CTO approval required.
- Fix a bug that doesn’t alter response shape or data access: Level 2+ can ship.
- Update logging/metrics: allowed if no PII and no auth changes; Level 1 needs approval.
- Performance-only changes (index, query tweak): Level 2+ can ship if no schema changes.
- Schema change with migration: CTO approval + rollback notes required.
- Update documentation/runbooks: any level can ship without approval.
