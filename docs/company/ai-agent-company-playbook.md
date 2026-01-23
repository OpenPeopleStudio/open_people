# AI Agent Company Playbook

Owner: Coder  
Date: 2026-01-22  
Audience: CEO, CTO, Coder, Team Leads

## Purpose
Define how OpenPeople scales the AI agent company without sacrificing quality, safety, or margin.

## Operating Principles
- Every agent has a clear contract (input → output → success metric).
- Every workflow is versioned, measurable, and rollbackable.
- Cost is a first-class constraint at design time.

## 1) Productize the Agent Platform
### Agent Contract
- Inputs: schema + required context sources.
- Outputs: structured JSON with confidence.
- Success metric: latency + correctness target.

### Registry
- Central registry for agent capabilities, owners, costs, SLAs.
- Deprecation lifecycle: beta → stable → deprecated.

### Workflow Composition
- Chain agents through explicit steps with guards.
- Support A/B and safe canary rollouts.

## 2) Cost-Aware Execution
- Route low-risk tasks to small/cheap models.
- Enforce per-tenant and per-workflow budget caps.
- Cache common results and reuse context where safe.

## 3) Reliability + Safety
- Pre-flight validation: schema + policy checks.
- Post-flight evaluation: confidence scoring + fallback.
- HITL for high-risk outputs only.

## 4) Operational Scale
- Queue-first execution; no heavy work in request path.
- Full traceability: cost, latency, inputs, outputs, errors.
- SLOs per agent tier (utility vs. mission-critical).

## 5) Company Structure
- Each agent has a single accountable owner.
- Release cadence: weekly batches + rollback plan.
- Documentation: single source of truth per agent.

## 6) Distribution + Enterprise Readiness
- Integrations: Slack/Teams, email, browser, API.
- Enterprise: SSO/SCIM, audit trails, governance.

## Default Metrics
- Cost per run (by agent + workflow).
- Success rate (tasks completed without human intervention).
- Latency p50/p95.
- Rework rate (human edits per output).

## Review Cadence
- Monthly: cost + reliability review per agent.
- Quarterly: deprecate or merge low-usage agents.
