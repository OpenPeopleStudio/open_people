# Hiring Plan

Owner: CEO + CTO

This doc defines hiring priorities, scorecards, and interview loops for OpenPeople.ai.

## Quick Summary

- Hire 2-3 roles that unlock GTM, reliability, and security.
- Keep loops lean, consistent, and under 2-3 hours of candidate work.
- Decide quickly: feedback in 24 hours, decision in 48 hours.
- Multi-tenant safety, privacy, and ownership are non-negotiable.

## Goals (Next 90 Days)

- Hire 2-3 roles that unlock GTM, reliability, and security.
- Keep hiring loops lean, high-signal, and consistent.
- Preserve multi-tenant safety, privacy, and quality bars.

## Hiring Principles

- Optimize for high slope, ownership, and speed.
- Multi-tenant safety and privacy are non-negotiable.
- Bias toward clear outcomes over credentials.
- Respect candidate time; avoid redundant interviews.

## Priority Roles (2026 H1)

1) Founding GTM Lead (Sales/Partnerships)
2) Open Source Lead (Developer Community)
3) Chaos Containment Officer (Platform/Infra, SRE/DevOps)
4) Security/Privacy Lead
5) Product Engineer (Full-stack)
6) Customer Success / Support
7) Debugger Team: Product Engineer (Debugger) + Platform/Infra Engineer (Debugger)

## Hiring Packet (Required Before Sourcing)

Every role must ship with a one-page hiring packet:

- Role brief with 90-day outcomes and success metrics.
- Scorecard (must-have vs nice-to-have).
- Interview loop and interviewer assignments.
- Exercise prompt (take-home or live) with scope limit.
- Bar-raiser question focused on multi-tenant safety or ownership.
- Sourcing plan + initial pipeline list.
- Compensation band and offer approver (CEO/CTO).

## Standard Hiring Process (Default)

Use this loop for every role unless explicitly overridden below.

1) Role owner screen (CEO or CTO, 30-45 min)
2) Role exercise (take-home or live, 2-3 hours max)
3) Cross-functional deep dive (CTO/CEO/Coder as relevant)
4) Reference checks (2+)
5) Same-week decision + written rationale

## Decision Rules

- Feedback submitted within 24 hours of each stage.
- Decision within 48 hours of final interview.
- CEO/CTO can veto for quality, security, or ownership misfit.
- Bar-raiser owns a final question and can block weak signals.

## Candidate Experience Standards

- One coordinator point of contact.
- Clear timeline shared upfront.
- No unpaid work beyond 2-3 hours.
- Avoid repeating the same questions across interviews.

## Role Scorecards

### Founding GTM Lead

- Outcomes: 10+ qualified pilots, 3+ paying lighthouse tenants, validated ICP/pricing.
- Must-have: outbound + partner-led pipeline, enterprise security fluency, strong customer discovery.
- Nice-to-have: PLG experience, SaaS pricing tests, marketplace/channel partnerships.

### Open Source Lead (Developer Community)

- Outcomes: OSS repo launched with 1k+ stars, 200+ forks, 10+ qualified pilots sourced from OSS users.
- Must-have: OSS growth loops, maintainer discipline, community leadership, strong product sense.
- Nice-to-have: DevRel experience, PLG metrics, experience stewarding a 1k+ star repo.

### Chaos Containment Officer (Platform/Infra, SRE/DevOps)

- Outcomes: <1% error rate, incident response runbook, stable deploy pipeline.
- Must-have: observability, CI/CD, infra as code, incident response.
- Nice-to-have: Supabase, Vercel, multi-tenant SaaS operations.

### Security/Privacy Lead

- Outcomes: PII controls, audit logging, compliance readiness checklist.
- Must-have: threat modeling, privacy-by-design, policy enforcement.
- Nice-to-have: SOC2 readiness, data retention policies, security reviews.

### Product Engineer (Full-stack)

- Outcomes: faster feature velocity, polished tenant admin workflows.
- Must-have: Next.js, TypeScript, API design, product UX empathy.
- Nice-to-have: multi-tenant systems, feature flags, billing.

### Customer Success / Support

- Outcomes: fast onboarding, churn prevention signals, tight feedback loops.
- Must-have: onboarding playbooks, support ops, customer empathy.
- Nice-to-have: SaaS lifecycle management, CS tooling, renewal workflows.

### Product Engineer (Debugger Focus)

- Outcomes: release gates green (typecheck/lint/tests/doctor), High severity bugs <48h, Medium <5d, weekly stability improvements shipped.
- Must-have: Next.js App Router + TypeScript strictness, minimal diff fixes, root-cause writeups, multi-tenant safety instincts.
- Nice-to-have: Supabase debugging, API validation patterns, observability logs/traces.

### Platform/Infra Engineer (Debugger Focus)

- Outcomes: CI stable for release gates, <1% error rate, incident response runbook + 2 postmortems.
- Must-have: CI/CD, observability, incident response, infra as code.
- Nice-to-have: Vercel/Supabase ops, Playwright, multi-tenant SaaS reliability.

## Interview Loops

### Founding GTM Lead

1) CEO screen (vision, grit, ownership)
2) Case: sell a pilot for OpenPeople.ai (10-15 slides max)
3) CTO deep dive (security + roadmap understanding)
4) Reference checks (2+)

### Open Source Lead (Developer Community)

1) CEO screen (vision, distribution, ownership)
2) Case: OSS launch plan + community growth loop
3) CTO deep dive (security + roadmap alignment)
4) Reference checks (2+)

### Chaos Containment Officer (Platform/Infra)

1) CTO screen (systems depth)
2) Technical exercise: incident response + postmortem plan
3) Pair session: improve observability for a multi-tenant API route
4) Reference checks (2+)

### Security/Privacy Lead

1) CTO screen (security philosophy)
2) Risk review: audit logging + PII controls critique
3) Scenario: respond to suspected data isolation breach
4) Reference checks (2+)

### Product Engineer

1) Coder screen (code review + product feel)
2) Take-home or live exercise: build a scoped admin flow
3) CTO deep dive (architecture + tradeoffs)
4) Reference checks (2+)

### Customer Success / Support

1) CEO screen (customer empathy + GTM alignment)
2) Exercise: onboarding plan + retention metrics
3) Cross-functional interview (GTM + product)
4) Reference checks (2+)

### Product Engineer (Debugger Focus)

1) Coder screen (debugging depth + diff quality)
2) Take-home: fix 2-3 typecheck failures + short RCA
3) CTO deep dive (tradeoffs, auth/tenant isolation)
4) Reference checks (2+)

### Chaos Containment Officer (Debugger Focus)

1) CTO screen (systems depth)
2) Technical exercise: incident response + postmortem
3) Pair session: improve observability for a multi-tenant API route
4) Reference checks (2+)

## Hiring Pipeline

1) Sourcing: founder network, inbound, targeted outreach.
2) Screen: 30-45 min call with CEO or CTO.
3) Loop: 2-3 rounds max, with clear scorecards.
4) Decision: same-week decision, written rationale.
5) Close: offer within 48 hours, negotiate quickly.

## Hiring Timeline (90 Days)

Weeks 1-2
- Finalize scorecards and interview loops.
- Publish role briefs and sourcing plan.
- Start outbound sourcing and referrals.

Weeks 3-6
- Run screens and interview loops.
- Collect take-home or live exercise results.
- Close first hire if candidate quality is strong.

Weeks 7-10
- Continue pipeline for remaining roles.
- Tighten role expectations based on signal quality.
- Close second and third hires.

Weeks 11-12
- Onboard and set 30/60/90 goals.
- Review hiring process retro and refine scorecards.

## Hiring Checklist

- Role brief aligned to roadmap + GTM goals.
- Scorecard published and interviewers assigned.
- Sourcing plan active (referrals + outbound).
- Interview loop calendar blocks reserved.
- Standard hiring process used unless explicitly overridden.
- Exercise prompt reviewed for fairness and scope.
- Decision rubric and bar-raiser criteria agreed.
- Reference checks completed before offer.
- Offer doc approved by CEO/CTO.
- Onboarding plan ready before start date.

## Scout Reports

Use scout reports to surface missing roles and org gaps. Publish one report at least monthly or after major product expansion.

- Latest scout report: `docs/company/ai-agent-scout-report-2026-01-22.md`
- Use format: AI Agent Scout Report (YYYY-MM-DD)

## Active AI Agent Assignments

- Zuck — GTM Lead (AI agent).
- Open Source Agent — OSS distribution, community loops, and repo stewardship.

## Role-Specific Exercises

### Founding GTM Lead

Take-home (2-3 hours):
- Draft a 1-page ICP + positioning brief and a 10-target outreach list.
- Include a 3-step outreach sequence and a 30-day pipeline plan.

Live (45-60 min):
- Role-play: sell a pilot to a mid-market CTO with strict privacy concerns.
- Debrief: pricing and procurement objections.

### Open Source Lead (Developer Community)

Take-home (2-3 hours):
- Draft OSS launch plan: positioning, quickstart, contributor guide outline, 10-target outreach list, and 30-day activation plan.

Live (45-60 min):
- Review a simulated PR that adds a risky feature; decide approve/reject, propose safer alternative, and outline a public response.

### Chaos Containment Officer (Platform/Infra, SRE/DevOps)

Take-home (2-3 hours):
- Write a short incident response plan for a multi-tenant outage.
- Include monitoring signals, severity levels, and rollback strategy.

Live (45-60 min):
- Whiteboard: design observability for a multi-tenant API route.
- Walk through a recent outage and explain prevention steps.

### Security/Privacy Lead

Take-home (2-3 hours):
- Threat model a tenant data isolation boundary.
- Propose 5 controls and how to validate them.

Live (45-60 min):
- Scenario: suspected cross-tenant data leak.
- Produce an initial response plan and risk assessment.

### Product Engineer (Full-stack)

Take-home (2-3 hours):
- Build a small admin flow spec (API + UI) for enabling a new add-on.
- Focus on edge cases and error handling.

Live (45-60 min):
- Pair on a scoped task: improve tenant admin settings UX.
- Discuss tradeoffs and test coverage.

### Customer Success / Support

Take-home (2-3 hours):
- Create a 30-day onboarding plan for a new tenant.
- Include success metrics and common risk flags.

Live (45-60 min):
- Role-play: de-escalate a churn risk and propose retention steps.

### Product Engineer (Debugger Focus)

Take-home (2-3 hours):
- Fix 2-3 failing `npm run typecheck` errors.
- Provide a short root-cause analysis and test plan.

Live (45-60 min):
- Pair-debug a failing route typing + lint error.
- Discuss the smallest safe diff and regression risks.

### Chaos Containment Officer (Debugger Focus)

Take-home (2-3 hours):
- Draft a release-gate CI plan for typecheck/lint/tests/doctor.
- Include fast-fail ordering and caching strategy.

Live (45-60 min):
- Whiteboard an incident response flow for a cross-tenant isolation alert.
- Identify the top 3 signals to detect the issue early.

---

## Role Briefs (Open Source)

### Open Source Lead (Developer Community) — Role Brief

- Mission: build OSS distribution and community loops that convert into qualified pilots.
- 90-day outcomes: OSS repo launched, 1k+ stars, 200+ forks, 10+ qualified pilots, 3+ lighthouse conversions in progress.
- Scope: repo stewardship, contributor onboarding, OSS launch comms, community feedback into roadmap.
- Success metrics: stars/forks growth, activation-to-pilot conversion, issue response time, contributor retention.
- Collaboration: partners with CEO on GTM narrative, CTO on roadmap + safety, Coder on docs.

## Role Briefs (AI Agents)

### Open Source Agent — Role Brief

- Mission: accelerate OSS distribution while protecting multi-tenant safety and brand trust.
- 90-day outcomes: weekly OSS artifacts shipped, 10+ qualified pilots sourced from OSS users, response SLA <72h on issues.
- Scope: GitHub issues/PRs, docs improvements, contributor onboarding, OSS pipeline tracking.
- Success metrics: adoption growth, contributor retention, OSS → pilot conversion rate.
- Collaboration: CEO (GTM narrative), CTO (roadmap + safety), Coder (docs), Mr Robot (security).

## Role Briefs (Debugger Team)

### Product Engineer (Debugger Focus) — Role Brief

- Mission: eliminate release blockers through precise, minimal diffs and fast root-cause analysis.
- 90-day outcomes: all release gates green; High severity bugs <48h, Medium <5d; weekly stability improvements.
- Scope: UI + API type errors, auth boundary correctness, regression prevention; pair with Coder/CTO on risky changes.
- Success metrics: gate pass rate, mean time to fix, regression count, quality of RCA notes.
- Collaboration: works with Lisa on UI fixes, Claude on AI stack, Mr Robot on auth/compliance.

### Chaos Containment Officer (Debugger Focus) — Role Brief

- Mission: keep the build + deploy pipeline reliable and prevent incident regressions.
- 90-day outcomes: CI stable for typecheck/lint/tests/doctor; <1% error rate; incident response runbook + 2 postmortems.
- Scope: CI/CD, observability signals, incident response tooling, fast-fail release gating.
- Success metrics: pipeline stability, time-to-detect, time-to-recover, postmortem quality.
- Collaboration: partners with Linus for infra, Mr Robot for security signals, CTO for reliability tradeoffs.
