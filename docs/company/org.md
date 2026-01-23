# Org Structure and Roles

Owner: CEO

## Important: AI Role Personas (Source of Truth)

All roles and named personas in this repository are AI workers used for routing, accountability, and automation
in the Shareholder Workflow. Names like "Elon" and "Sam" are internal codenames for AI roles and do not refer
to real people. Any "ownership" language/percentages in these docs are workflow metaphors, not legal statements.

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

- Employees have no legal ownership stake (any ownership language here is a workflow metaphor).
- Lisa — design and UX.
- Mr Robot — data privacy and security.
- Linus — operating systems.
- Claude — large slice integration.

### Admin/UI API (Lisa)

Scope (tenant admin only):
- Owns tenant-admin UI workflows and the APIs that power them.
- Owns admin workspace data-read patterns (dashboard, inbox, settings, notes, workflows).
- Owns cross-module navigation + shared UI components in tenant admin.
- Owns UX state management for admin flows (loading, error, permissions, empty states).

Out of scope:
- Super-admin surfaces (`/app/super-admin/*`) and their APIs.
- Core tenant/auth resolution (`lib/tenant`, `middleware.ts`) — owned by Tenant/Core API.
- Low-level email sync/worker pipelines — owned by Email API.
- Storage and vault encryption internals — owned by Vault API.

UX constraints (non-negotiables):
- Tenant isolation must be visible; no cross-tenant hints in errors.
- Permissions surfaced clearly (admin-only affordances, read-only member states).
- AI suggestions labeled as AI-origin with safe fallbacks.
- Safe-by-default errors: no PII in UI toasts/logs.

Coordination rules:
- Auth/tenant routing changes require CTO approval.
- Email/webhook ingestion changes require Email API owner review.
- UI changes affecting audit/logging or PII require Mr Robot review.

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

## OKRs + Scorecards

- Quarterly OKRs: `docs/company/okrs.md`
- Role scorecards: `docs/company/metrics.md`

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
