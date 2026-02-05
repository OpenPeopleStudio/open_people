# ADR: Email AI Readability v1 (Admin-only)

Date: 2026-01-23
Status: Draft
Owner: CTO

## Context
- Email Workspace v1 needs AI readability and suggested actions.
- AI output quality and safety need a controlled rollout.

## Decision
- Implement AI readability for email threads using the existing job queue.
- Gate AI summary/suggestions to admin roles only for v1.

## Consequences
- Admin-only visibility reduces risk while quality is validated.
- Requires job worker to be running for AI results to appear.

## Alternatives Considered
- Enable AI for all users (rejected: higher risk).
- Inline AI calls in request path (rejected: latency/instability).

## Related Tasks
- `docs/TODO.md` → Active Program: Functional Email Workspace (v1)
