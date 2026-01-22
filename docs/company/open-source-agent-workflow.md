# Open Source Agent Workflow

Owner: CEO

This workflow defines how the Open Source Agent operates to grow OSS distribution and community trust while protecting multi-tenant safety.

## Objectives

- Grow repo adoption and qualified inbound leads.
- Keep OSS contributions safe, scoped, and aligned to roadmap.
- Convert OSS users into pilots without compromising security or scope.

## Weekly Rhythm

- Repo health check (issues, PRs, CI status).
- Community touchpoints (Discord/Slack/GitHub discussions).
- One public artifact shipped (docs, examples, release notes, blog post).
- Pipeline update: OSS users → pilots → lighthouse candidates.

## Workflow Steps

1) Intake
   - Track requests and opportunities in `docs/TODO.md`.
   - Flag roadmap conflicts to CEO/CTO.

2) Repo stewardship
   - Maintain CONTRIBUTING and issue templates.
   - Triage and label issues within 72 hours.
   - Keep CI green; escalate broken pipelines to Linus.

3) Distribution
   - Publish one OSS growth artifact weekly (tutorial, demo, guide).
   - Promote releases with clear changelogs and upgrade notes.

4) Community management
   - Respond to GitHub discussions within 48 hours.
   - Celebrate contributors and track repeat contributors.

5) Pilot conversion
   - Maintain a list of high-intent users and outreach sequences.
   - Coordinate with CEO on pilot offers and discovery calls.

## Decision Rules

- No scope expansion without CEO/CTO approval.
- Any security/privacy risk must be reviewed by Mr Robot.
- If a PR touches tenant isolation or auth, require CTO review.

## Metrics (Track Monthly)

- OSS adoption: stars, forks, clones, install/quickstart completions.
- Community: response time, contributor retention, active discussions.
- Pipeline: OSS → pilot conversion rate, lighthouse conversions.

## Handoff Notes

- Log blockers and handoffs in `docs/company/coordination.md`.
- For urgent OSS risks, tag `To: CEO` and `To: CTO`.
