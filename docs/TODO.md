# Project Todo

> Last updated: 2026-01-23

Master todo list for the Open People platform.

---

## Task Queue

Use this file as the single source of truth for work.
Each task must have: owner, scope, files, definition of done, success metrics, and validation steps.
Any task touching auth, API routes, or data handling must include Mr Robot sign-off in the DoD.

---

## Week Plan (lock for the week)

Owner: Coder + CTO

- Top 3 priorities:
  1) Ship Email Workspace v1 reliability + AI readability (admin-only)
  2) Profiles migration/backfill + tenant auth standardization validation
  3) Job queue worker running in local + prod environments
- Do not add new priorities unless CEO/CTO approve.

---

## Task Template (required fields)

```
Owner:
Scope:
Files:
Success metrics:
Validation steps:
Done:
```

---

## Active Program: Functional Email Workspace (v1)

1. Owner: Coder
   Scope: Own v1 task plan + acceptance criteria + tenant safety checklist
   Files: docs/TODO.md, docs/company/coordination.md
   Done: Plan approved with owners/files/DoD; acceptance criteria + tenant safety checklist attached
   Status: Approved (2026-01-22)

   Subtasks (CEO delegation):
   - Owner: Claude
     Scope: Super-admin path fixes + API wiring plan for AI panel exposure
     Files: app/api/email/*, app/(platform)/admin/*, app/super-admin/*
     Done: Checklist + file targets + risks; sequencing for super-admin path fixes first.
     Status: Completed (2026-01-23)
   - Owner: Lisa
     Scope: UI states for AI panel exposure + drafts/attachments UX
     Files: components/email/*, app/(platform)/admin/*, app/super-admin/*
     Done: UX states documented; safe error/empty states defined for AI + drafts.
     Status: Completed (2026-01-23)
   - Owner: Mr Robot
     Scope: Tenant isolation + PII/logging validation for super-admin path fixes + AI panel exposure
     Files: app/api/email/*, lib/observability/*, docs/security/overview.md
     Done: Sign-off recorded; risks + mitigations captured.
     Status: Completed (2026-01-23)
     Status: Completed (2026-01-23)
   - Owner: Linus
     Scope: Draft/attachment fetch pipeline perf + worker impact
     Files: app/api/email/*, lib/email/*, lib/observability/performance.ts
     Done: Metrics + alert thresholds added; performance risks documented.
     Status: Completed (2026-01-23)

2. Owner: Claude
   Scope: Integration plan for inbox/compose + AI readability/actions
   Files: app/(platform)/admin/email/inbox/EmailInboxClient.tsx, components/email/EmailWorkspace.tsx, components/email/InboxView.tsx, components/email/ComposeModal.tsx, app/api/email/messages/*, app/api/email/send/*, app/api/email/workspace/*, lib/email/*
   Done: Implementation tasks listed with risks and file targets
   Success metrics: AI summary + suggestions visible to admins on 90% of test threads
   Validation steps: Seed Mars tenant, open inbox, view AI panel, verify suggestions populated

3. Owner: Lisa
   Scope: UX plan for compose + navigation + AI panels
   Files: components/email/ComposeModal.tsx, components/email/EmailWorkspace.tsx, components/email/MessageDetailPanel.tsx, app/(platform)/admin/email/inbox/page.tsx
   Done: UX notes and component targets
   Success metrics: Compose flow completes without UI regressions (no broken states)
   Validation steps: Send email from compose, verify status + error states, review AI panel layout

4. Owner: Mr Robot
   Scope: Security/privacy audit for email + AI data handling
   Files: app/api/email/*, lib/email/*, lib/observability/logger.ts
   Done: Tenant isolation verified; no PII in logs; mitigations listed
   Status: Completed (2026-01-23)
   Success metrics: Zero PII in logs during email + AI flows; tenant isolation checks pass
   Validation steps: Review logs for email events; confirm AI endpoints enforce tenant scope
   DoD addendum: Mr Robot sign-off required for any auth/API/data handling changes

5. Owner: Linus
   Scope: Reliability/perf assessment for inbox latency and workers
   Files: app/api/email/sync/*, app/api/email/workspace/*, lib/email/sync.ts, lib/observability/performance.ts
   Done: Metrics/checklist + potential bottlenecks
   Success metrics: Queue latency p95 target defined; inbox sync p95 target defined
   Validation steps: Document thresholds in runbook/monitoring; verify logs/metrics available

6. Owner: Linus
   Scope: Job queue worker running in local + prod (reliable AI processing)
   Files: scripts/jobs-worker.ts, package.json, scripts/jobs-worker.systemd.service, scripts/jobs-worker.launchd.plist
   Done: Worker documented, running, and monitored in both environments
   Success metrics: Worker uptime > 99% during test window; AI jobs processed within 5 minutes
   Validation steps: Start worker locally, queue AI job, verify completion; confirm prod service enabled

Acceptance Criteria:
- Users can view inbox, open a message, and send new email end-to-end (tenant-scoped)
- Compose UX covers draft, send, and error states with clear status
- AI readability + suggested actions are visible and safe (no PII leakage)
- Audit logs or structured logs capture key email events without PII

Tenant Safety Checklist:
- All email reads/writes enforce tenant_id scoping
- OAuth tokens and message bodies never logged
- Access controls verified for admin vs super-admin routes
- Rate limits on sync + send endpoints validated

---

## Active Program: Fix Onboarding + High-Impact Demo (GTM ASAP)

1. Owner: Coder
   Scope: Create v1 onboarding + demo task list and sequence
   Files: app/(platform)/*, app/super-admin/*, lib/tenant.ts, middleware.ts, components/*
   Done: Task list with owners/files/DoD; blockers logged
   Success metrics: All owners aligned on sequence; tasks unblocked
   Validation steps: Review tasks with CEO/CTO; confirm file scopes
   Risks: scope creep

2. Owner: Linus
   Scope: Routing reliability + domain activation checks
   Files: middleware.ts, lib/tenant.ts
   Done: No redirects to inactive domains; safe fallbacks defined
   Success metrics: 0 redirect-to-inactive-domain incidents in demo
   Validation steps: Create tenant with inactive domain; verify fallback path
   Risks: edge-case routing loops

3. Owner: Claude
   Scope: Demo flow integration (happy path) + instrumentation hooks
   Files: app/(platform)/*, components/*, lib/*
   Done: Demo path works end-to-end; return-later CTA present
   Success metrics: Demo completion rate > 80% in internal test
   Validation steps: Run demo flow start→finish; verify CTA + tracking
   Risks: dependency on unfinished features

4. Owner: Lisa
   Scope: Free-trial demo UX (first-run, tour, CTA)
   Files: components/*, app/(platform)/*
   Done: Clear onboarding steps, demo state, and follow-up prompts
   Success metrics: UX review score ≥ 4/5 (internal)
   Validation steps: Internal walkthrough; verify no broken UI states
   Risks: UX clutter

5. Owner: Mr Robot
   Scope: Demo/tenant isolation review
   Files: middleware.ts, lib/tenant.ts, app/api/*
   Done: No data crossover; demo sandbox rules documented
   Success metrics: Isolation tests pass; no cross-tenant data access
   Validation steps: Attempt cross-tenant reads; verify blocked
   Risks: accidental exposure

Acceptance Criteria:
- Onboarding does not redirect to inactive domains
- Demo flow feels production-quality and completes without dead ends
- Demo data isolated from real tenant data
- Clear “return later” hook present after demo

Tenant Safety Checklist:
- Demo tenant_id is isolated and read-only
- No PII logged in demo flows
- Routing guard prevents inactive domain redirects

---

## Active Program: Atelier AI Workforce Dashboard (Super‑Super‑Admin)

Owner: Coder

Objective: Refresh the existing AI team dashboard with an “atelier” theme for super‑super‑admin oversight (cost + quality). Deadline: 2026-01-23.

1. Owner: Coder
   Scope: Identify existing AI team dashboard route + file map. Add atelier tokens as both CSS variables and Tailwind config. Build base DashboardLayout shell with 12‑col grid + 24px gutter.
   Files: app/globals.css, tailwind.config.ts (new if missing), app/super-admin/* (existing dashboard route), components/layout/* (new)
   Done: Route identified; tokens available via CSS vars + Tailwind; layout shell renders with placeholders and correct spacing.
   Success metrics: Tokens are referenced by layout styles; no broken links/route changes.
   Validation steps: Load existing dashboard route and confirm layout renders; verify CSS var + Tailwind token access.

2. Owner: Lisa
   Scope: Build primary layout sections (Command Header, Workforce Pulse KPIs, Atelier Feed rail, Health & Cost Studio panel frame) with responsive stacking.
   Files: app/super-admin/* (dashboard route), components/atelier/* (new), components/dashboard/* (if present)
   Done: All sections visible at 1280px; mobile stacks correctly; KPI cards show title/value/delta; feed rail scrolls independently.
   Success metrics: Layout review score ≥ 4/5 (internal).
   Validation steps: Manual responsive check at 1280px + mobile; verify feed scroll isolation.

3. Owner: Claude
   Scope: Core components (Agent card, Run card, Pipeline lane, Alert chip) with running/review states and reuse hooks.
   Files: components/atelier/* (new), components/cards/* (if present)
   Done: Components reusable + documented in components/; support running + review states.
   Success metrics: Components used in dashboard with no duplicate styling blocks.
   Validation steps: Render components in dashboard; verify states.

4. Owner: Claude
   Scope: Interactions & panels (slide‑in Agent Detail, Run Detail modal, hover “peel” previews, keyboard shortcuts).
   Files: app/super-admin/*, components/atelier/*, components/modals/* (if present)
   Done: Panel + modal use focus trapping; shortcuts documented in UI.
   Success metrics: Shortcut coverage for Cmd/Ctrl+S, Cmd/Ctrl+Shift+F, Cmd/Ctrl+Shift+P.
   Validation steps: Keyboard walkthrough; verify focus trap + dismiss behavior.

5. Owner: Mr Robot
   Scope: Super‑super‑admin gating + telemetry review for the refreshed dashboard.
   Files: app/super-admin/*, middleware.ts, lib/observability/*
   Done: Access restricted to super‑super‑admin; no PII in UI telemetry/logs.
   Success metrics: Security sign‑off recorded.
   Validation steps: Attempt access as non‑privileged user; verify denied.

6. Owner: Lisa
   Scope: Polish & QA (micro‑motion, empty states, loading skeletons, responsive + a11y checks).
   Files: app/super-admin/*, components/atelier/*
   Done: Animations subtle; mobile shows KPI carousel + pipeline accordion; WCAG AA contrast for primary text.
   Success metrics: No a11y regressions; motion does not block interaction.
   Validation steps: Contrast spot‑check; focus order check; mobile layout review.

Acceptance Criteria:
- All sections match atelier design direction with consistent typography scale.
- Existing dashboard functionality preserved per comparison checklist in docs/company/coordination.md.
- Panel + modal interactions are accessible and keyboard‑navigable.
- Mobile layout retains all critical data.

---

## Active Tasks

1. Owner: Coder
   Scope: Docs structure + navigation polish
   Files: docs/company/README.md, docs/company/org.md, docs/company/api-ownership.md
   Done: Index updated, headings consistent, ownership noted, no broken links.

2. Owner: Mr Robot
   Scope: Security + privacy review of API ownership rules
   Files: docs/company/api-ownership.md
   Done: Approval matrix confirms security review points; PII/logging rules clear.

3. Owner: Linus
   Scope: Ops reliability + runbook checklist
   Files: docs/company/api-ownership.md
   Done: Runbook and rollback checklist confirmed; incident escalation explicit.

4. Owner: Claude
   Scope: Email queue topology changes (remove double-queueing, make EMAIL_TRIAGE per-message, move heavy work off inbound webhook path)
   Files: docs/company/coordination.md, TBD (owner to identify implementation files)
   Done: Proposed topology plan with files + risks; impact on webhook latency and queue fan-out documented.

5. Owner: Linus
   Scope: Throughput/latency metrics + alert thresholds for email queues + AI processing
   Files: docs/company/coordination.md, lib/observability/performance.ts (targets TBD)
   Done: Metrics/SLOs proposed with alert thresholds and owners; files to update listed.

6. Owner: Linus
   Scope: Vault Phase 5 — Email Automation (worker, webhook, rules engine, rules UI, auto-approval)
   Files: workers/vault-email-worker/src/index.ts, workers/vault-email-worker/wrangler.toml, workers/vault-email-worker/README.md, app/api/vault/webhook/email/route.ts, app/api/vault/automation/rules/route.ts, lib/vault/automation.ts, app/super-admin/vault/automation/page.tsx, app/super-admin/vault/inbox/page.tsx, app/api/vault/inbox/route.ts, docs/vault-todo.md
   Done: Worker live; webhook receiver and rules engine shipped; rules UI complete; auto-approval flow documented.

7. Owner: Claude
   Scope: Testing infrastructure (unit/integration/isolation/E2E + CI + seeding)
   Files: TBD
   Done: Test suites and CI in place; isolation tests cover tenant data; seed scripts complete.

8. Owner: Open Source Agent (Codex)
   Scope: OSS prep for push (repo health + community plan + OSS → pilot conversion)
   Files: docs/TODO.md, docs/company/coordination.md, docs/company/open-source-agent-workflow.md, docs/company/locks.md, docs/README.md, docs/development/README.md, CHANGELOG.md
   Success metrics: OSS plan shipped with owners/dates; CI failure root cause documented; community SLAs set; initial pilot lead list defined.
   Validation steps: Confirm GH issues/PRs triaged (or none); capture CI status + failure reason; note security/PII scan summary.
   Done: OSS plan and coordination note posted; CI failure called out with fix owner; conversion list drafted.
   Plan:
   - 2026-01-24: OSS quickstart refresh (docs/README.md, docs/development/README.md)
   - 2026-01-28: Release notes + upgrade guide for Email Workspace v1 reliability changes (CHANGELOG.md, docs/README.md)
   Status: In progress (2026-01-23)

---

## Completed Tasks (recent)

- Owner: Claude
  Scope: Integration/API contract clarity
  Files: docs/company/api-ownership.md
  Done: Example scenarios validated; contract testing expectations explicit.
  Status: Completed (2026-01-23)

- Owner: Mr Robot
  Scope: AI cost control guardrails + retention policies (no PII leakage)
  Files: docs/company/coordination.md, docs/security/overview.md
  Done: Guardrails proposed with gating + suppression rules; retention guidance and risks documented.
  Status: Completed (2026-01-23)

- Owner: Lisa
  Scope: UX states for AI suggestion gating + admin controls (plan-based)
  Files: docs/company/coordination.md, components/email/*
  Done: UX states + component targets documented; plan-based gating surfaced in UI.
  Status: Completed (2026-01-22)

- Owner: Coder
  Scope: Email Workspace v1 task plan approvals
  Files: docs/TODO.md, docs/company/coordination.md
  Done: Plan approved; acceptance criteria + tenant safety checklist attached.
  Status: Completed (2026-01-22)

- Owner: Lisa
  Scope: Admin/UI API ownership clarity
  Files: docs/company/org.md, docs/company/api-ownership.md
  Done: Admin/UI API scope clearly defined; UX implications noted.
  Status: Completed (2026-01-23)

---

## Backlog (structured)

### Docs + Operations Hygiene

1. Owner: Coder
   Scope: Add “API Ownership” link to docs/company/README.md index
   Files: docs/company/README.md
   Done: Link added; index order updated; no broken links.

2. Owner: Coder
   Scope: Add “How to claim/release locks” note
   Files: docs/company/locks.md
   Done: Short note added with claim/release steps; formatting consistent.

3. Owner: Coder
   Scope: One‑pager — “API readiness checklist”
   Files: docs/company/api-readiness.md, docs/company/README.md
   Done: Checklist published and linked in company index.

### Infrastructure

4. Owner: Mr Robot
   Scope: Centralized auth middleware (root middleware + helpers + tenant context)
   Files: middleware.ts, lib/auth/*, lib/tenant.ts
   Done: Middleware enforces tenant auth across protected routes; helpers in place; context injected.

5. Owner: Mr Robot
   Scope: Audit all API routes for auth/authz gaps
   Files: app/api/*
   Done: Audit report with fixes/risks; gaps resolved or ticketed.

6. Owner: Mr Robot
   Scope: Review RLS policies completeness
   Files: supabase/migrations/*, supabase/policies/* (if present)
   Done: RLS coverage report; missing policies added with rollback notes.

7. Owner: Linus
   Scope: Add rate limiting to APIs
   Files: app/api/*, lib/http/*
   Done: Rate limits enforced on critical routes; limits documented.

8. Owner: Mr Robot
   Scope: Add CSRF protection
   Files: middleware.ts, lib/http/*
   Done: CSRF protection enforced on state-changing requests; tests updated.

9. Owner: Mr Robot
   Scope: Security headers (CSP, HSTS, etc.)
   Files: middleware.ts, next.config.ts
   Done: Headers configured and verified in dev/prod.

10. Owner: Claude
    Scope: API request validation (Zod + shared schemas + consistent 400s)
    Files: lib/schemas/*, app/api/*
    Done: Zod schemas defined and used at route entry; 400 errors standardized.

11. Owner: Claude
    Scope: Standardize API error responses
    Files: lib/http/*, app/api/*
    Done: Shared error format adopted across APIs.

12. Owner: Claude
    Scope: Add OpenAPI/Swagger documentation
    Files: docs/api/openapi.yaml (or equivalent), docs/README.md
    Done: OpenAPI spec generated and linked in docs.

13. Owner: Claude
    Scope: API versioning strategy
    Files: docs/architecture/overview.md, docs/development/*
    Done: Versioning policy documented with migration rules.

14. Owner: Linus
    Scope: Structured logging (JSON + context + levels)
    Files: lib/observability/*
    Done: Structured logger in place with tenant_id/user_id/request_id; JSON logs verified.

15. Owner: Linus
    Scope: Error tracking (Sentry)
    Files: sentry.client.config.js, sentry.server.config.js, docs/deployment/overview.md
    Done: Sentry wired in with tenant-safe context and alerting.

16. Owner: Linus
    Scope: Performance monitoring + correlation IDs
    Files: lib/observability/*, middleware.ts
    Done: Correlation IDs propagated; perf metrics captured.

17. Owner: Linus
    Scope: Audit log viewer UI
    Files: app/(platform)/*, lib/observability/*
    Done: UI and API for audit log viewing available to admins.

18. Owner: Linus
    Scope: Alerting for security events
    Files: lib/observability/*, docs/RUNBOOK.md
    Done: Alerts configured with runbook steps.

### Product Domains

19. Owner: Lisa
    Scope: Marketing site improvements (SEO, analytics, contact, blog, pricing)
    Files: app/(marketing)/*
    Done: SEO + analytics + contact form + blog + pricing shipped.

20. Owner: Lisa
    Scope: Tenant platform improvements (onboarding, dashboard, previews, mobile, settings)
    Files: app/(platform)/*
    Done: Onboarding flow complete; dashboard updates; previews implemented; mobile responsive; settings page shipped.

21. Owner: Lisa
    Scope: Super admin platform improvements (tenant wizard, billing, analytics, user mgmt, health)
    Files: app/super-admin/*
    Done: Core admin improvements shipped with QA notes.

22. Owner: Lisa
    Scope: Super admin notes collaboration + sharing (share, public links, realtime, comments, export)
    Files: app/super-admin/*, lib/notes/* (if present)
    Done: Collaboration features shipped with roles/permissions defined.

### Vault Enhancements

23. Owner: Lisa
    Scope: File preview in vault (images, PDFs, text/code)
    Files: app/(platform)/*, lib/vault/*
    Done: Client-side decrypt + preview support for images/PDFs/text with UX states.

24. Owner: Claude
    Scope: Thumbnail generation
    Files: lib/vault/*, app/api/vault/*
    Done: Thumbnails generated and stored tenant-scoped.

25. Owner: Claude
    Scope: Smart folders with saved searches
    Files: app/(platform)/*, lib/search/*, app/api/*
    Done: Smart folder UI + saved criteria with auto-updates.

26. Owner: Claude
    Scope: Full content AI analysis (OCR)
    Files: lib/ai/*, app/api/*
    Done: OCR pipeline integrated; outputs stored tenant-scoped.

27. Owner: Linus
    Scope: Streaming encryption for large files (AES-CTR + HMAC, chunked upload, web workers)
    Files: lib/vault/*, app/api/vault/*, workers/*
    Done: Streaming encryption implemented with progress and integrity checks.

### Documentation

28. Owner: Coder
    Scope: API documentation (OpenAPI)
    Files: docs/api/*, docs/README.md
    Done: API docs published and linked in docs index.

29. Owner: Coder
    Scope: Deployment guide
    Files: docs/deployment/overview.md
    Done: Deployment guide published with env/setup steps.

30. Owner: Coder
    Scope: Contributing guide
    Files: docs/CONTRIBUTING.md
    Done: Contributor guide published with setup + PR flow.

31. Owner: Coder
    Scope: Architecture overview
    Files: docs/architecture/overview.md
    Done: Architecture overview updated and reviewed.

---

## Feature Status

| Feature                | Status        | Notes                                                     |
| ---------------------- | ------------- | --------------------------------------------------------- |
| Marketing Site         | ✅ Complete   | Landing, login, signup                                    |
| Tenant Platform        | ✅ Core done  | Shop, admin dashboards                                    |
| Super Admin            | ✅ Core done  | Tenants, storage, vault                                   |
| Cloud Storage (R2)     | ✅ Complete   | Tenant-scoped file storage                                |
| Email (Resend)         | ✅ Complete   | Tenant-scoped email                                       |
| Notifications (Twilio) | ✅ Complete   | SMS notifications                                         |
| Feature Flags          | ✅ Complete   | A/B experiments                                           |
| Encrypted Vault        | ✅ Phases 1-4 | Core encryption + AI analysis                             |
| Vault Automation       | 🔲 Scaffolded | Phase 5: Email worker + rules UI/API aligned to schema    |
| API Key Manager        | ✅ Complete   | AES-256 encrypted storage                                 |
| Project Notes          | ✅ Complete   | MD editor + templates + external API                      |
| Quick Share            | ✅ Complete   | CLI, extension, token management                          |
| AI Chat                | ✅ Complete   | Memory, context, conversation history                     |
| MLF Foundation         | ✅ Complete   | Tenant/roles, activity ledger, knowledge store, AI traces |
| AI Personalization     | ✅ Complete   | Profile, communication style, goals                       |
| Context Assembly       | ✅ Complete   | Rules, deterministic builder, assemblies                  |
| Workflows/Tasks        | ✅ Complete   | Projects, tasks, rhythms, reminders                       |
| Automation             | ✅ Complete   | Integrations, webhooks, job runner                        |
| Observability          | ✅ Complete   | Traces, feedback, cost tracking                           |
| Global Search          | ✅ Complete   | Unified search, semantic + text, relevance                |
| Knowledge Graph        | ✅ Complete   | Neural web visualization, Obsidian-style                  |

---

## Completed Priorities (recent)

- Quick Share System — COMPLETE (core features shipped; future: PWA share target, macOS menu bar app)
- MLF Foundation — COMPLETE

---

## Future Considerations

See docs/suggestions-inbox.md for detailed architectural suggestions.

Key ideas for future:
- Event-driven async processing (BullMQ/Inngest)
- Streaming encryption for large files
- API route generator for consistency
- Audit log retention & export
- Mobile apps for Quick Share

---

## Quick Reference

### Test Commands

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run test:unit      # Unit tests only
npm run test:isolation # Isolation tests only
npm run test:vault     # Vault-related tests
```

### Development

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # Run linter
npm run typecheck     # Type checking
```

### Domains (Local)

```
http://localhost:3000           # Marketing
http://super.localhost:3000     # Super admin
http://demo.localhost:3000      # Tenant (add to /etc/hosts)
```

### Environment Variables (New Features)

```bash
# API Key encryption (generate: openssl rand -base64 32)
API_KEYS_ENCRYPTION_KEY=

# Vault encryption (generate: openssl rand -base64 32)
VAULT_ENCRYPTION_KEY=
```
