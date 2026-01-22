# Org Structure and Roles

Owner: CEO

## Executive Leadership

### CEO (Elon)

- Builds the company and sets the top-level direction.
- Uses multiple thinking models (regret minimization, second order, first principles, Occam's razor).
- Relentlessly drives a product for everyone to enjoy.
- Holds 60% ownership in the company.

### CTO (Sam)

- Co-founder with 20% ownership in the company.
- Owns vision, product roadmap, and functionality direction.
- Sets strategic priorities and approves major product shifts.
- Delegates documentation build-out to the "coder" agent.

## Product and Engineering

### Coder (Lead Developer Agent)

- Owns company documentation structure and maintenance.
- Aligns docs with CTO vision, roadmap, and functionality.
- Keeps doc navigation and ownership clear.
- Surfaces doc gaps and follow-up work in `docs/TODO.md`.

### Coding Team (Employees)

- Employees (split among founding group) ownership stake.
- Lisa — design and UX.
- Mr Robot — data privacy and security.
- Linus — operating systems.
- Claude — large slice integration.

## AI Agents

- Zuck — GTM Lead (AI agent).

## Hiring Priorities (2026 H1)

Owner: CEO + CTO

These roles are sequenced to protect multi-tenant reliability, security, and GTM.

1. Founding GTM Lead (Sales/Partnerships)
   - Pipeline ownership, pricing validation, lighthouse customers.
   - Reports to CEO; partners with CTO on roadmap feedback.
2. Platform/Infra Engineer (SRE/DevOps)
   - Deployment hygiene, observability, on-call, incident response.
   - Reports to CTO; coordinates with Linus.
3. Security/Privacy Lead
   - PII controls, audit logging, compliance readiness, threat modeling.
   - Reports to CTO; partners with Mr Robot.
4. Product Engineer (Full-stack)
   - Tenant admin features, add-on activation, API polish.
   - Reports to CTO; coordinates with Coder for docs.
5. Customer Success / Support
   - Onboarding, training, churn prevention, feedback loops.
   - Reports to CEO; partners with GTM.

## Org Expansion Tiers

Tier 0: Founding (current)

- CEO, CTO, Coder, core coding team.

Tier 1: Reliability + GTM (0-12 months)

- Add GTM Lead, Platform/Infra, Security/Privacy.
- Goal: Stable platform, first 10+ paying tenants, clear ICP.

Tier 2: Scale + Enablement (12-24 months)

- Add Product Engineer, Customer Success, QA/Automation.
- Goal: Repeatable onboarding, measurable retention, lower ops load.

Tier 3: Growth + Compliance (24+ months)

- Add Compliance/Legal, Growth Marketing, Partnerships.
- Goal: Enterprise readiness and partner-driven expansion.

## Role Ownership Map

- Vision + company direction: CEO
- Product roadmap + quality bars: CTO
- Documentation structure + upkeep: Coder
- Design + UX system: Lisa
- Privacy + security controls: Mr Robot
- Infra + ops reliability: Linus
- Large-slice integration: Claude

## Ownership Vector (keep updated)

- Elon: 60% ownership, strongest vibes.
- Sam: 20% ownership, strong vibes.
- Employees: 20% ownership, shared vibes.

## Collaboration and Lock Policy

- Before editing, claim the relevant file or area in `docs/company/locks.md`.
- If a file is locked, the agent must either wait or work in a non-overlapping area.

## Documentation Ownership

- Company docs: Coder
- Product direction: CTO

## API Ownership

Owner: CTO

### API Owner (Role)

- Owns a specific API surface end-to-end (quality, reliability, docs, and roadmap).
- Ensures tenant isolation and security checks for every change.
- Runs incidents and postmortems for their API.

### Decision Rights

- Owner can ship independently once at Autonomy Level 3.
- CTO approval required for: breaking changes, new dependencies, or schema changes.
