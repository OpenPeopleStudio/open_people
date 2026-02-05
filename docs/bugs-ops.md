# Ops / Infra Bug Triage

Owner: Linus

| ID | Title | Severity | Tenant Impact | Owner | Status | Suspected Area | Evidence | Fix Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OPS-001 | Email worker loads large attachments into memory | High | Potential worker OOM, missed ingests | Linus | Fixed | `workers/vault-email-worker/src/index.ts` | Attachment stream fully buffered without size guard | Added `VAULT_MAX_ATTACHMENT_BYTES` guard + stream limit |
| OPS-002 | Webhook post can hang without timeout | Medium | Worker stalls on outbound webhook | Linus | Fixed | `workers/vault-email-worker/src/index.ts` | `fetch` has no timeout | Added `VAULT_WEBHOOK_TIMEOUT_MS` abort |
| OPS-003 | Deploy script accepts empty secrets in wrangler.toml | Medium | Broken deploys with empty config | Linus | Fixed | `scripts/deploy-email-worker.sh` | `grep "^VAR ="` passes for empty strings | Require non-empty quoted values or env |
| OPS-004 | Lint warnings: explicit any in observability libs | Medium | Observability tooling | Codex | Fixed | `lib/observability/*` | `@typescript-eslint/no-explicit-any` warnings | `npx eslint lib/observability/**/*` 2026-01-22 |
| OPS-005 | Lint warnings: explicit any in op tag utils | Low | Observability tooling | Codex | Fixed | `lib/op/tag.ts` | `@typescript-eslint/no-explicit-any` warnings | `npx eslint lib/op/**/*` 2026-01-22 |
| OPS-006 | Lint warnings: prefer-const in observability | Low | Observability tooling | Codex | Fixed | `lib/observability/*` | `prefer-const` warnings | `npx eslint lib/observability/**/*` 2026-01-22 |
| OPS-007 | Typecheck: job handler logging/context types | Medium | Job execution/logging | Linus | Fixed | `lib/jobs/handlers.ts` | `unknown` spread/params not assignable | `npm run typecheck` green 2026-01-23 |
