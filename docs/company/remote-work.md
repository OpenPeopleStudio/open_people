# Remote Work Policy

Owner: CEO + CTO
Maintainer: Coder

## Purpose
Define how OpenPeople operates as a remote-first company, with clear expectations for communication, availability, and documentation.

## Scope
Applies to all employees, contractors, and long-term collaborators unless a role-specific exception is documented.

## Remote-First Principles
- Default to async communication; meetings are a tool of last resort.
- Keep work visible through docs, tasks, and written updates.
- Protect deep work time and minimize calendar load.
- Make handoffs explicit and time-zone friendly.

## Working Hours + Availability
- Each team publishes its core overlap window and preferred time zone in a shared doc or coordination note.
- Individual working hours should be discoverable (profile, team notes, or coordination log).
- If availability changes for more than one day, notify the team with a brief handoff note.
- Default overlap window (if a team has not set one): 9:00am–12:00pm PT, Mon–Thu.
- Urgent issues (incidents or tenant risk): acknowledge within 30 minutes during overlap hours.
- Default check-in times (NST): 8:00am, 5:00pm, 12:00am daily.

## Communication Norms
- Use `docs/company/coordination.md` for cross-role handoffs and blockers.
- Use `docs/TODO.md` as the source of truth for planned work and status.
- Capture decisions in docs (ADRs or feature docs), not in transient chat.
- Aim to acknowledge non-urgent messages within one business day.
- For urgent issues, prefer a short written summary + immediate next action.

## Meeting Hygiene
- Every meeting needs an agenda and a written outcome.
- Keep recurring meetings scoped and reviewed quarterly.
- Prefer async updates for status; reserve meetings for decisions, conflict resolution, or pairing.
- Schedule meetings inside overlap hours when possible.

## Documentation Expectations
- Update docs when decisions change scope, risks, or ownership.
- Keep ownership headers current at the top of each doc.
- Log handoffs and blockers in `docs/company/coordination.md`.

## Security + Privacy
- Follow `docs/security/overview.md` and `docs/SAFETY.md` for handling sensitive data.
- Do not store PII or secrets in local notes or unapproved tools.
- Lock screens when away and avoid public networks without approved protection.
- Use approved password managers and 2FA on all work accounts.

## On-Call Roster and Escalation

Source of truth: `docs/company/coordination.md`

### Roster (fill in weekly)

| Week (Mon–Sun) | Primary | Secondary | Timezone | Notes |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD | NST | Rotation owner: CTO |

### Check-in Cadence

- Check-ins at 8:00am NST, 5:00pm NST, 12:00am NST (daily).

### Escalation Ladder

1) Primary on-call (acknowledge within 30 minutes during overlap hours).
2) Secondary on-call (if no response in 30 minutes).
3) CTO + Linus (if incident impacts tenant isolation, auth, or uptime).
4) CEO (if public impact, customer comms, or revenue risk).

## Handoffs and Incident Coverage

- Use a short handoff note when work crosses time zones.
- For incidents: log a summary, current status, and next owner in `docs/company/coordination.md`.
- If you are primary on-call, keep contact status current and respond quickly during overlap.

## Release-Gate Handoff Protocol

- If a release gate is failing, post a handoff note in `docs/company/coordination.md`.
- Handoff timing: no later than 30 minutes before the end of the overlap window.
- Include: failing gate, suspected area, last known good state, and next action owner.

## Current Status (2026-01-23)
We are in a stabilization window while debugging completes. Expect async-first collaboration and minimal meetings until the push window begins. Any changes to schedules or process should be logged in `docs/company/coordination.md`.

## Travel or Time-Zone Changes
- Notify the team if time zone shifts for more than one week.
- Update the team’s overlap window if it changes.

## Open Decisions
- Equipment stipend and home office reimbursement policy.
- On-call compensation and coverage rotation.
