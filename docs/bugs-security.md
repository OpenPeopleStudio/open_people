# Security / Privacy Bug Triage

Owner: Mr Robot

| ID | Title | Severity | Tenant Impact | Owner | Status | Suspected Area | Evidence | Fix Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | Inbound email webhook logs raw payloads/headers | High | PII may be written to logs | Mr Robot | Blocked | app/api/email/inbound/webhook/route.ts | console logs include headers, raw email, parsed addresses | Pending (locked by Claude) |
| SEC-002 | Email debug endpoint not role-gated | Medium | Non-admins can view tenant email metadata | Mr Robot | Fixed | app/api/email/debug/route.ts | endpoint returned message/account/domain/thread data for any authed user | Role check added (admin/owner/super_admin) |
| SEC-003 | Inbound debug endpoint not role-gated | Medium | Non-admins can view inbound diagnostics incl. DNS records and recent emails | Mr Robot | Fixed | app/api/email/inbound/debug/route.ts | endpoint returned managed domains, DNS records, recent inbound data | Role check added (admin/owner/super_admin) |
| SEC-004 | Email send route logs account/provider details | Medium | PII/metadata exposure in logs | Mr Robot | Fixed | app/api/email/send/route.ts | console logs included account/provider info and subjects | Logs removed/sanitized |
| SEC-005 | Email account create/delete logs include identifiers | Medium | PII/metadata exposure in logs | Mr Robot | Fixed | app/api/email/accounts/route.ts | console logs on create/delete include email addresses/ids | Logs removed |
| SEC-006 | Ops proposal parse failure logs model output slice | Medium | Potential sensitive content in logs | Mr Robot | Fixed | app/api/ops/propose/route.ts | console error logged assistantContent slice | Log now only content length |
| SEC-007 | Auth logging context types mismatch | High | Auth logging & audits | Mr Robot | Triage | lib/auth/auth.ts | error/ip/userAgent types mismatch | `npm run typecheck` 2026-01-22 |
| SEC-008 | Auth middleware generic typing errors | Medium | AuthZ enforcement | Mr Robot | Triage | lib/auth/middleware.ts | generic arg mismatch | `npm run typecheck` 2026-01-22 |
| SEC-009 | Compliance audit query optional date_range | Medium | Compliance evidence | Mr Robot | Triage | lib/compliance/evidence-collector.ts | optional date_range mismatch | `npm run typecheck` 2026-01-22 |
| SEC-010 | New tables missing RLS policies (email campaigns, AI companies, personal data capture, drift baselines) | High | Potential cross-tenant data exposure | Mr Robot | Fixed | supabase/migrations | `ai_companies`, `ai_company_groups`, `ai_company_group_members`, `email_campaigns`, `email_campaign_recipients`, `drift_baselines`, `personal_events`, `personal_blobs` created without RLS; time-series partitions also lack explicit RLS (verify if parent RLS covers partitions) | `20260122180000_rls_backfill.sql` |
