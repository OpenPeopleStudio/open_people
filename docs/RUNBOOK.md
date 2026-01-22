# Runbook

Quick reference for operating and debugging the platform.

Company directive intake
- Use `docs/company/workflow.md` for shareholder → CEO → CTO → Coder flow.
- Record execution tasks in `docs/TODO.md` with owner, scope, files, and definition of done.
- Log cross-terminal handoffs and blockers in `docs/company/coordination.md`.

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

Bug list protocol
1) Create or update `docs/bugs.md` before any fixes.
2) Log each bug with: ID, title, severity, tenant impact, owner, status, repro steps, expected vs actual, suspected area.
3) Group by area (tenant routing, auth, data, UI, workers, integrations).
4) Link to evidence (logs, Sentry issue, test failure) when available.
5) Only start fixes after the list is complete and reviewed.

Playbooks to add later
- Webhook replay steps (Resend/Twilio).
- Data export/deletion requests.
- Incident comms template.
