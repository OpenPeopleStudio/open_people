# Architecture Decision Records (ADR)

Owner: CTO
Maintainer: Coder

Use ADRs to document significant decisions that affect architecture, dependencies, or multi-tenant safety.

## When to Write an ADR

- New production dependency
- Data model or schema change
- Cross-tenant or auth boundary change
- Major feature scope change
- Infrastructure or deployment strategy change

## Workflow

1) Draft ADR before implementation begins.
2) Link the ADR in the relevant tasks in `docs/TODO.md`.
3) CTO approves before work starts on the change.
4) Update ADR status when shipped.

## ADR Template

```
# ADR: <short title>

Date: YYYY-MM-DD
Status: Draft | Accepted | Rejected | Superseded
Owner: <role>

## Context
- What problem are we solving?
- Why now?

## Decision
- What is the decision?

## Consequences
- Expected impact
- Risks and mitigations

## Alternatives Considered
- Option A
- Option B

## Related Tasks
- Link to `docs/TODO.md` entries
```

## Storage

- Store ADRs in `docs/architecture/decisions/` (create files as needed).
- Use short, descriptive filenames (e.g., `2026-01-23-email-ai-readability.md`).
