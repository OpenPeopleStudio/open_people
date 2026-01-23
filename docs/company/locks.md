# Collaboration Locks

Owner: Coder

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
| Codex | 2026-01-23 | docs/TODO.md, docs/company/locks.md | shared | 2026-01-24 | active | Distribute Atelier tasks |
| Codex | 2026-01-23 | docs/company/coordination.md, docs/company/locks.md | shared | 2026-01-24 | active | Coder handoff note |
| Codex | 2026-01-23 | README.md, docs/deployment/overview.md, docs/deployment/email-worker-setup.md, docs/architecture/overview.md, docs/support/troubleshooting.md, docs/development/setup.md | exclusive | 2026-01-24 | released | Align production env var docs |
| Codex | 2026-01-23 | middleware.ts, lib/observability/edge-logger.ts, lib/observability/edge-correlation.ts | exclusive | 2026-01-24 | released | Vercel edge-safe middleware logging |
| Codex | 2026-01-23 | docs/company/coordination.md, docs/company/locks.md | shared | 2026-01-24 | active | Delegation updates |
| Codex | 2026-01-23 | docs/README.md, docs/development/README.md, docs/TODO.md, docs/company/coordination.md | shared | 2026-01-24 | active | OSS prep updates |
| Codex | 2026-01-23 | README.md, CHANGELOG.md | shared | 2026-01-24 | active | OSS release notes + quickstart callout |
| Codex | 2026-01-22 | docs/** | exclusive | 2026-01-23 | released | Doc reorganization across all docs |
| Codex | 2026-01-22 | docs/company/coordination.md | shared | 2026-01-23 | released | Terminal coordination log |
| Codex | 2026-01-22 | docs/company/remote-work.md | exclusive | 2026-01-23 | active | Remote work policy doc |
| Codex | 2026-01-22 | docs/company/workflow.md, docs/RUNBOOK.md, docs/company/README.md | exclusive | 2026-01-23 | active | Shareholder workflow setup |
| Codex | 2026-01-22 | docs/bugs.md, docs/bugs-ui.md, docs/bugs-security.md, docs/bugs-ops.md, docs/bugs-api.md | exclusive | 2026-01-23 | active |  |
| Codex, Claude | 2026-01-22 | lib/email/oauth.ts, templates/commerce/app/api/admin/products/intelligence/route.ts, templates/commerce/app/api/admin/settings/users/route.ts | shared | 2026-01-23 | active | Security logging redaction |
| Codex | 2026-01-22 | types/ai-companies.ts, lib/observability/quality.ts, lib/observability/drift.ts, next.config.ts | exclusive | 2026-01-23 | active |  |
| Codex, Claude, Lisa (Codex) | 2026-01-22 | app/(platform)/admin/company/language/page.tsx, components/super-admin/email-campaigns/CampaignsClient.tsx | shared | 2026-01-23 | active | Email campaigns typecheck fixes |
| Codex | 2026-01-22 | workers/vault-email-worker/src/index.ts, workers/vault-email-worker/src/node-forge.d.ts, scripts/deploy-email-worker.sh, docs/bugs-ops.md | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/ops/service.ts, lib/vault/ai-analysis.ts, lib/vault/automation.ts, lib/vault/thumbnails.ts, lib/workflows/context-assembly.ts, lib/workflows/observability.ts, lib/workflows/search.ts | exclusive | 2026-01-23 | active |  |
| Codex, Claude | 2026-01-22 | __tests__/unit/lib/auth/middleware.test.ts, app/api/ai/drift/baselines/auto/route.ts, app/api/auth/login/route.ts, app/api/chat/actions/fact/route.ts, app/api/compliance/evidence-package/route.ts, app/api/email/backfill/route.ts, app/api/email/domains/managed/route.ts, app/api/email/domains/route.ts, middleware.ts | shared | 2026-01-23 | active | Typecheck cleanup |
| Codex, Claude | 2026-01-22 | app/api/chat/conversations/[conversationId]/route.ts, app/api/chat/conversations/[conversationId]/messages/route.ts, app/api/chat/memories/[memoryId]/route.ts | shared | 2026-01-23 | active | Chat route param typing fixes |
| Codex, Claude | 2026-01-22 | app/(marketing)/login/page.tsx, app/(platform)/admin/email/EmailDashboard.tsx, app/(platform)/admin/experiments/ExperimentsDashboard.tsx, app/(platform)/admin/hitl/items/[itemId]/ReviewWorkbench.tsx, app/(platform)/admin/keys/page.tsx, app/(platform)/admin/knowledge/page.tsx, app/(platform)/admin/notes/[noteId]/page.tsx, app/(platform)/admin/notifications/NotificationsDashboard.tsx, app/(platform)/admin/vault/page.tsx, app/(platform)/admin/workflows/page.tsx, app/api/ai/jobs/drift-probes/route.ts, app/api/ai/settings/route.ts, app/api/chat/conversations/route.ts, app/api/health/route.ts, lib/jobs/queue.ts, lib/notifications/twilio.ts, lib/observability/cost.ts, lib/observability/performance.ts, lib/security/rate-limit.ts, lib/vault/automation.ts, scripts/generate-assets.js, scripts/personal-data/compact-events.js, scripts/seed-mars-tenant.js, scripts/start-worker.js, scripts/supabase-health.js, scripts/vault-cli/vault-upload.js, scripts/vault-extension/background.js, sentry.client.config.js, sentry.server.config.js | shared | 2026-01-23 | active | Lint cleanup pass |
| Codex, Claude | 2026-01-23 | docs/company/api-ownership.md | shared | 2026-01-24 | active | API contract clarity update |
| Codex, Claude | 2026-01-22 | app/api/email/inbound/webhook/route.ts, app/api/email/messages/[id]/route.ts, app/api/email/oauth/gmail/route.ts, app/api/email/oauth/outlook/route.ts, app/api/email/settings/route.ts, app/api/email/sync/route.ts, app/api/email/workspace/policies/route.ts, app/api/email/workspace/slas/route.ts, app/api/email/workspace/stats/route.ts, app/api/email/workspace/suggestions/[threadId]/route.ts, app/api/email/workspace/threads/route.ts, app/api/events/dispatch/route.ts, app/api/experiments/audiences/route.ts, app/api/experiments/config/route.ts, lib/notifications/events.ts, lib/notifications/twilio.ts, lib/observability/cost.ts, lib/observability/logger.ts, lib/observability/performance.ts | shared | 2026-01-23 | active | Email workspace typecheck fixes |
| Codex, Claude | 2026-01-22 | lib/email/workspace.ts, lib/events/bus.ts, lib/events/dispatcher.ts, lib/events/notification-bridge.ts, lib/gateway/router.ts | shared | 2026-01-23 | active | Email workspace typecheck fixes |
| Codex, Claude | 2026-01-22 | app/api/v1/chat/completions/route.ts, app/api/v1/devices/[device_id]/tokens/route.ts, app/api/v1/tenants/[tenant_id]/route.ts, app/api/v1/tenants/route.ts, app/api/v1/users/[user_id]/route.ts, app/api/v1/vault/files/[file_id]/route.ts, app/api/v1/vault/files/[file_id]/download/route.ts, app/api/v1/vault/folders/[folder_id]/route.ts, app/api/super-admin/email/campaigns/[campaignId]/route.ts, lib/email/sync.ts, lib/jobs/handlers.ts | shared | 2026-01-23 | active | Email sync typecheck fixes |
| Codex, Claude | 2026-01-23 | app/api/keys/[keyId]/route.ts, app/api/keys/[keyId]/reveal/route.ts, app/api/keys/[keyId]/test/route.ts, app/api/notes/[noteId]/route.ts, app/api/notes/[noteId]/export/route.ts, app/api/notes/[noteId]/links/route.ts, app/api/notes/[noteId]/versions/route.ts, app/api/notes/[noteId]/collaborators/route.ts | shared | 2026-01-24 | released | Typecheck route param fixes |
| Lisa (Codex) | 2026-01-22 | components/email/EmailWorkspace.tsx, components/email/MessageDetailPanel.tsx, components/email/ComposeModal.tsx, components/email/InboxView.tsx, docs/bugs-ui.md | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/auth/*, lib/tenant.ts | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | lib/schemas/*, lib/http/* | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | app/api/ops/commit/route.ts, app/api/vault/automation/rules/route.ts, app/api/v1/tenants/[tenant_id]/route.ts, app/api/v1/users/route.ts, lib/supabase/middleware.ts, lib/observability/correlation.ts, sentry.client.config.js, __tests__/unit/api/* | exclusive | 2026-01-23 | active |  |
| Codex | 2026-01-22 | docs/TODO.md | shared | 2026-01-23 | active | Prod readiness updates |
| Codex, Claude | 2026-01-22 | app/api/email/inbox/sync/route.ts, app/api/email/sync/route.ts, lib/email/inbox-sync.ts, supabase/migrations/20260122170000_email_messages_unique_indexes.sql | shared | 2026-01-23 | active | Inbox sync consolidation + uniqueness safeguards |
| Codex | 2026-01-22 | app/api/company/lexicon/[entryId]/route.ts, playwright.config.ts | exclusive | 2026-01-23 | active | Typecheck fixes |
| Lisa (Codex) | 2026-01-22 | app/(platform)/admin/page.tsx | exclusive | 2026-01-23 | released | Admin dashboard UI pass |
| Codex | 2026-01-22 | docs/company/hiring.md | exclusive | 2026-01-23 | active | Debugger team role briefs |
| Codex | 2026-01-22 | docs/company/workflow.md | exclusive | 2026-01-23 | active | Open source hiring workflow update |
| Codex | 2026-01-22 | AGENTS.md, docs/company/org.md | exclusive | 2026-01-23 | released | Debug-team documentation |
| Codex | 2026-01-22 | docs/company/README.md | exclusive | 2026-01-23 | active | Debug-team documentation |
| Codex, Claude | 2026-01-22 | lib/ai/* | shared | 2026-01-23 | active | Shared lock granted for AI typecheck fixes |
| Codex | 2026-01-22 | docs/company/partner-roadmap-remote-work.md | exclusive | 2026-01-23 | active | Remote work partner roadmap |
| Codex | 2026-01-22 | docs/company/gtm-remote-work.md | exclusive | 2026-01-23 | active | Remote work GTM brief |
| Codex | 2026-01-22 | docs/company/ai-agent-company-playbook.md | exclusive | 2026-01-23 | active | AI agent company playbook |
| Codex | 2026-01-22 | docs/company/roles.md, docs/company/staff.md, docs/company/workflow.md | shared | 2026-01-23 | active | Clarify AI role personas for org automation |
| Codex | 2026-01-23 | README.md, docs/TODO.md, docs/company/README.md, docs/company/coordination.md, docs/company/workflow.md, docs/company/commands.md, docs/company/org.md, docs/company/ai-agent-feedback.md, docs/company/cadence.md, docs/company/metrics.md, docs/company/okrs.md, docs/company/adr.md, docs/company/release-checklist.md | exclusive | 2026-01-24 | released | Company operating cadence + ADR + execution discipline |
| Codex | 2026-01-23 | docs/suggestions-inbox.md | exclusive | 2026-01-24 | active | Suggestions inbox workflow update |
| Codex | 2026-01-23 | lib/email/imap.ts | shared | 2026-01-24 | active | IMAP connection lifecycle + dedupe fallback fixes |
| Codex | 2026-01-23 | docs/api/openapi.md | shared | 2026-01-24 | active | API docs check: stability + envelope note |
| Codex, Lisa (Codex) | 2026-01-23 | app/(platform)/admin/notes/[noteId]/page.tsx | shared | 2026-01-24 | released | Notes editor UX refresh |
| Codex, Lisa (Codex) | 2026-01-23 | components/workspace/notes/NotesListView.tsx | shared | 2026-01-24 | released | Notes UX refresh |
| Codex (Mr Robot) | 2026-01-22 | app/api/email/inbound/webhook/route.ts, app/api/email/webhooks/route.ts, app/api/email/sync/route.ts, lib/email/workspace.ts, lib/email/sync.ts, lib/observability/logger.ts | shared | 2026-01-23 | active | Email security logging fixes |
| Codex (Mr Robot) | 2026-01-22 | app/api/chat/conversations/[conversationId]/route.ts, app/api/chat/conversations/[conversationId]/messages/route.ts | shared | 2026-01-23 | active | Typecheck fixes for conversation routes |
| Codex (Mr Robot) | 2026-01-22 | lib/observability/cost.ts | shared | 2026-01-23 | active | Typecheck fix for cost query builder |
| Codex (Mr Robot) | 2026-01-23 | lib/auth/*, lib/tenant.ts | shared | 2026-01-23 | waiting | Request shared lock for centralized auth middleware |
| Codex | 2026-01-23 | docs/TODO.md, docs/company/coordination.md | shared | 2026-01-24 | released | Open source agent prep for push |

Example: use shared lock with multiple owners, e.g. `Owner = "Codex, Lisa"` and `Type = "shared"` for a joint edit.
