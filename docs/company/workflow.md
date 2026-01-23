# Shareholder Workflow

Owner: CEO + CTO

## Purpose
Provide a clear chain of command for shareholder directives so prompts flow through each level of the org, with refinement and delegation at each step.

Note: The CEO/CTO/Coder/Employee "roles" referenced here are AI worker personas used for routing and automation in
this repository. Names are codenames and do not refer to real people.

## Chain of Command
1) Shareholder submits a directive.
2) CEO translates it into vision and non-negotiables.
3) CTO converts vision into product and commercialization requirements.
4) Coder decomposes into tasks and assigns owners.
5) Employees execute and report back in `docs/TODO.md`.

## Workflow Rules
- Each level adds clarity and constraints without removing prior constraints.
- Decisions about scope, dependencies, or tenant risk must be explicit.
- If blocked, log the blocker in `docs/TODO.md` and move to the next Ready task.
- Tasks are the source of truth for execution; discussions are not.
- Cross-terminal handoffs and updates go in `docs/company/coordination.md`.
- All coordination entries must include a role tag in the form `To: <Role>` (e.g., `To: Claude`).
- For role-specific triggers, run `bash scripts/org-run-remote-work.sh "<Role>"` (e.g., `"Claude"`).

## Decision Gate (Major Changes)

For any major scope change, new dependency, or data/auth boundary change:
- Write an ADR before implementation (see `docs/company/adr.md`).
- CTO approval required before work begins.
- Link ADR in `docs/TODO.md` tasks.

## Hiring Workflow (Standard)

- Any hiring directive must use the standard hiring process in `docs/company/hiring.md` unless CEO/CTO explicitly override.
- CEO owns role brief + sourcing plan; CTO owns role scope + safety bar.
- Coder ensures scorecard, interview loop, and exercise prompt are published before sourcing starts.

## Open Source Agent Workflow

- Source of truth: `docs/company/open-source-agent-workflow.md`.
- Use for OSS distribution, community loops, and repo stewardship.
- Escalate safety or tenant isolation risks to CTO and Mr Robot.

## Templates (copy/paste)

### Shareholder Directive
```
DIRECTIVE
Title: [short name]
Outcome: [what success looks like]
User impact: [who wins and why]
Constraints: [budget/time/tenant/safety]
Risks: [known risks or tradeoffs]
```

### CEO Vision Brief
```
CEO VISION BRIEF
Mission framing:
- Why now:
- User promise:
- Principles to preserve:
- Non-negotiables:
Success metrics:
- Primary:
- Secondary:
```

### CTO Product Brief
```
CTO PRODUCT BRIEF
Scope:
- In:
- Out:
Requirements:
- Functional:
- Non-functional (security, tenant isolation, perf):
Commercialization:
- Pricing impact:
- Packaging:
Delivery plan:
- Milestones:
- Risks:
```

### Coder Task Plan
```
CODER TASK PLAN
Tasks:
- Owner:
  Scope:
  Files:
  Definition of Done:
  Risks:
Dependencies:
- [task/owner]
Notes:
- [assumptions or blockers]
```
