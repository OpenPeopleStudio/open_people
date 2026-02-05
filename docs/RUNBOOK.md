# Runbook

Quick reference for operating and debugging the platform.

Company directive intake
- Use `docs/company/workflow.md` for shareholder → CEO → CTO → Coder flow.
- Record execution tasks in `docs/TODO.md` with owner, scope, files, and definition of done.
- Log cross-terminal handoffs and blockers in `docs/company/coordination.md`.
- Remote-work expectations, on-call roster, and handoffs: `docs/company/remote-work.md`.

Common failures & fixes
- Supabase auth failing: verify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; run `pnpm doctor`.
- Wrong tenant routed: check `middleware.ts` domain logic and domain records in DB.
- R2 upload errors: confirm bucket exists and env keys are present; check CORS config.
- Email not sending: ensure Resend key + domain verification.
- Twilio SMS blocked: verify sandbox/geo settings and from-number capability.

How to reproduce bugs locally
1) `npm install` (or `pnpm install`)
2) `cp .env.local.example .env.local` and fill secrets
3) `npm run dev`
4) Seed data: `node scripts/seed-mars-tenant.js`
5) Visit target route (see README dev URLs)

Rollbacks
- DB: revert latest migration; if prod, restore backup first.
- Feature/UI: disable via feature flag at tenant/platform level.
- Deployment: redeploy previous Vercel build.

Logs & metrics
- Application errors: Sentry (client, edge, server configs in `sentry.*.config.js`).
- Structured logs: Pino JSON with correlation IDs (see `lib` logging helpers).
- Add direct links here once centralized dashboards are finalized.
- Email inbox performance (API)
  - `email_inbox_list_duration` p95 > 800ms (warn), p95 > 1500ms (page)
  - `email_threads_fetch_duration` p95 > 700ms (warn), p95 > 1200ms (page)
  - `email_message_detail_fetch_duration` p95 > 1200ms (warn), p95 > 2000ms (page)
  - Watch `email_message_detail_attachments_count` spikes (sudden > 20) and sustained > 10.
- Primary dashboard (latency/queue/inbox): [TBD]
- Alert routing (PagerDuty/Slack/email): [TBD]
- Incident playbook: [TBD] (add link here or section below once defined)

Bug list protocol
1) Create or update `docs/bugs.md` before any fixes.
2) Log each bug with: ID, title, severity, tenant impact, owner, status, repro steps, expected vs actual, suspected area.
3) Group by area (tenant routing, auth, data, UI, workers, integrations).
4) Link to evidence (logs, Sentry issue, test failure) when available.
5) Only start fixes after the list is complete and reviewed.

Incident tracking (until in-app system ships)
1) Create `docs/incidents/INC-YYYY-NNNN.md` from the template.
2) If Sev-1/Sev-2 or tenant isolation risk, require a postmortem: `docs/incidents/POSTMORTEMS/PM-YYYY-NNNN.md`.
3) Log a short incident summary + current status + next owner in `docs/company/coordination.md`.
4) Update incident status as work progresses and link the postmortem when closed.

Incident comms template (copy/paste)
Internal update
- Incident: INC-YYYY-NNNN
- Severity:
- Status:
- Start time (UTC):
- Current impact:
- Suspected cause:
- Mitigation in progress:
- Next update by:

External status update
- Title:
- Status: investigating/identified/monitoring/resolved
- Impact summary:
- Next update by:

Playbooks to add later
- Webhook replay steps (Resend/Twilio).
- Data export/deletion requests.
- Incident comms template.
