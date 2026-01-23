# Collaboration Locks

Source of truth for active edit locks. See `docs/company/lock-policy.md` for rules.

## Rules (short)

- Claim a lock before editing.
- Use the smallest reasonable scope.
- Use a lock type: `exclusive`, `shared`, or `intent`.
- Set an expiry date (YYYY-MM-DD) and refresh daily if still active.
- Release immediately after merge or abandonment.

## Active Locks

| Owner | Date | Scope | Type | Expires | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Codex | 2026-01-22 | docs/company/coordination.md | shared | 2026-01-23 | active | Terminal coordination log |
| Codex | 2026-01-22 | docs/company/remote-work.md | exclusive | 2026-01-23 | active | Remote work policy doc |
| Codex | 2026-01-22 | docs/company/workflow.md, docs/RUNBOOK.md, docs/company/README.md | exclusive | 2026-01-23 | active | Shareholder workflow setup |
| Codex | 2026-01-22 | docs/bugs.md, docs/bugs-ui.md, docs/bugs-security.md, docs/bugs-ops.md, docs/bugs-api.md | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/email/oauth.ts, templates/commerce/app/api/admin/products/intelligence/route.ts, templates/commerce/app/api/admin/settings/users/route.ts | exclusive | 2026-01-23 | active | Security logging redaction |
| Codex | 2026-01-22 | types/ai-companies.ts, lib/observability/quality.ts, lib/observability/drift.ts, next.config.ts | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | app/(platform)/admin/company/language/page.tsx, components/super-admin/email-campaigns/CampaignsClient.tsx | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | workers/vault-email-worker/src/index.ts, workers/vault-email-worker/src/node-forge.d.ts, scripts/deploy-email-worker.sh, docs/bugs-ops.md | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/ops/service.ts, lib/vault/ai-analysis.ts, lib/vault/automation.ts, lib/vault/thumbnails.ts, lib/workflows/context-assembly.ts, lib/workflows/observability.ts, lib/workflows/search.ts | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | __tests__/unit/lib/auth/middleware.test.ts, app/api/ai/drift/baselines/auto/route.ts, app/api/auth/login/route.ts, app/api/chat/actions/fact/route.ts, app/api/compliance/evidence-package/route.ts, app/api/email/backfill/route.ts, app/api/email/domains/managed/route.ts, app/api/email/domains/route.ts, middleware.ts | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | app/api/email/inbound/webhook/route.ts, app/api/email/messages/[id]/route.ts, app/api/email/oauth/gmail/route.ts, app/api/email/oauth/outlook/route.ts, app/api/email/settings/route.ts, app/api/email/sync/route.ts, app/api/email/workspace/policies/route.ts, app/api/email/workspace/slas/route.ts, app/api/email/workspace/stats/route.ts, app/api/email/workspace/suggestions/[threadId]/route.ts, app/api/email/workspace/threads/route.ts, app/api/events/dispatch/route.ts, app/api/experiments/audiences/route.ts, app/api/experiments/config/route.ts, lib/notifications/events.ts, lib/notifications/twilio.ts, lib/observability/cost.ts, lib/observability/logger.ts, lib/observability/performance.ts | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/email/workspace.ts, lib/events/bus.ts, lib/events/dispatcher.ts, lib/events/notification-bridge.ts, lib/gateway/router.ts | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | app/api/v1/chat/completions/route.ts, app/api/v1/devices/[device_id]/tokens/route.ts, app/api/v1/tenants/[tenant_id]/route.ts, app/api/v1/tenants/route.ts, app/api/v1/users/[user_id]/route.ts, app/api/v1/vault/files/[file_id]/route.ts, app/api/v1/vault/files/[file_id]/download/route.ts, app/api/v1/vault/folders/[folder_id]/route.ts, app/api/super-admin/email/campaigns/[campaignId]/route.ts, lib/email/sync.ts, lib/jobs/handlers.ts | exclusive | 2026-01-23 | active |  |
| Lisa (Codex) | 2026-01-22 | components/email/EmailWorkspace.tsx, components/email/MessageDetailPanel.tsx, components/email/ComposeModal.tsx, components/email/InboxView.tsx, docs/bugs-ui.md | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/auth/*, lib/tenant.ts | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/schemas/*, lib/http/* | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | app/api/ops/commit/route.ts, app/api/vault/automation/rules/route.ts, app/api/v1/tenants/[tenant_id]/route.ts, app/api/v1/users/route.ts, lib/supabase/middleware.ts, lib/observability/correlation.ts, sentry.client.config.js, __tests__/unit/api/* | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | docs/TODO.md | shared | 2026-01-23 | active | Prod readiness updates |
| Codex | 2026-01-22 | app/api/company/lexicon/[entryId]/route.ts, playwright.config.ts | exclusive | 2026-01-23 | active | Typecheck fixes |
| Codex | 2026-01-22 | docs/company/hiring.md | exclusive | 2026-01-23 | active | Debugger team role briefs |
| Codex | 2026-01-22 | docs/company/workflow.md | exclusive | 2026-01-23 | active | Open source hiring workflow update |
| Codex | 2026-01-22 | AGENTS.md, docs/company/org.md | exclusive | 2026-01-23 | active | Debug-team documentation |
| Codex | 2026-01-22 | docs/company/README.md | exclusive | 2026-01-23 | active | Debug-team documentation |
| Codex | 2026-01-22 | lib/ai/* | intent | 2026-01-23 | waiting | Request shared lock with Codex-AI for typecheck fixes |
| Codex | 2026-01-22 | docs/company/partner-roadmap-remote-work.md | exclusive | 2026-01-23 | active | Remote work partner roadmap |
| Codex | 2026-01-22 | docs/company/gtm-remote-work.md | exclusive | 2026-01-23 | active | Remote work GTM brief |

Example: use shared lock with multiple owners, e.g. `Owner = "Codex, Lisa"` and `Type = "shared"` for a joint edit.
