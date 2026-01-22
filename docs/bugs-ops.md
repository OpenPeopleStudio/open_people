# Ops / Infra Bug Triage

Owner: Linus

| ID | Title | Severity | Tenant Impact | Owner | Status | Suspected Area | Evidence | Fix Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OPS-001 | Email worker loads large attachments into memory | High | Potential worker OOM, missed ingests | Linus | Fixed | `workers/vault-email-worker/src/index.ts` | Attachment stream fully buffered without size guard | Added `VAULT_MAX_ATTACHMENT_BYTES` guard + stream limit |
| OPS-002 | Webhook post can hang without timeout | Medium | Worker stalls on outbound webhook | Linus | Fixed | `workers/vault-email-worker/src/index.ts` | `fetch` has no timeout | Added `VAULT_WEBHOOK_TIMEOUT_MS` abort |
| OPS-003 | Deploy script accepts empty secrets in wrangler.toml | Medium | Broken deploys with empty config | Linus | Fixed | `scripts/deploy-email-worker.sh` | `grep "^VAR ="` passes for empty strings | Require non-empty quoted values or env |
