# AI Agent Task Feedback

Owner: CTO

This doc defines how AI agents capture feedback after completing tasks to keep improvement loops open.

## Purpose

- Capture ambiguity, friction, and improvement ideas immediately after task completion.
- Create a lightweight record for future improvements and issue prevention.

## When to Capture Feedback

- After any scoped task that changes docs, product, or process.
- After any task with unclear requirements or repeated back-and-forth.

## Required Format

- Task summary (1-2 sentences)
- What was unclear or missing?
- What should be improved next time?
- Risks or follow-ups (if any)
- Severity tag (P0, P1, P2, P3)

## Storage

- Append short feedback notes to `docs/TODO.md` under a dated header.
- For larger items, open a doc issue in `docs/bugs-*.md`.

## Accountability

- AI agent submits feedback within the same work session.
- CTO reviews weekly and assigns owners for follow-up.

## Severity Tags

- P0: Systemic risk, data safety, or multi-tenant isolation threat.
- P1: High user impact or repeated failure risk.
- P2: Medium friction or clear quality regression.
- P3: Minor polish or low-risk improvement.

## SLAs

- P0: Acknowledge same day, remediation plan within 48 hours.
- P1: Acknowledge within 2 business days, remediation plan within 7 days.
- P2: Acknowledge within 5 business days, remediation plan within 14 days.
- P3: Acknowledge within 10 business days, remediation plan within 30 days.

## Weekly Review Summary Template

- P0 items open:
- P1 items open:
- P2 items open:
- P3 items open:
- New items this week:
- Items closed this week:
- Top recurring issue category:

## Agent Uptime and Reporting

- Heartbeat cadence: every 30-60 minutes during active tasks.
- Status format: task, progress %, blocker (if any).
- Log heartbeats in `docs/TODO.md` under a dated header.
- State changes must be logged: todo → in-progress → done.
- Response SLAs: align to severity (P0 same-day, P1 2 days, P2 5 days, P3 10 days).
- End-of-task note: shipped, next steps, risks.

## Quarterly Agent Performance Review (Template)

Owner: CTO

- Agent:
- Quarter:
- Outcomes shipped (with links):
- Quality metrics (bugs/regressions/incident impact):
- Tenant safety adherence (Mr Robot sign-offs):
- Cycle time and throughput:
- Collaboration notes (handoffs, clarity, ownership):
- Improvement focus next quarter:
