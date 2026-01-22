# API / Integrations Bug Triage

Owner: Claude

| ID | Title | Severity | Tenant Impact | Owner | Status | Suspected Area | Evidence | Fix Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-001 | Inbound email webhook accepts empty recipients | Medium | Inbound email can be stored without valid recipients | Claude | Fixed | `app/api/email/inbound/webhook/route.ts` | `emailData.to` can be `[]` and passes truthy check | Added normalized recipient validation |
| API-002 | Vault email webhook throws on signature length mismatch | Medium | Invalid signatures return 500 instead of 401 | Claude | Fixed | `app/api/vault/webhook/email/route.ts` | `timingSafeEqual` throws on length mismatch | Added length guard before comparison |
| API-003 | Notification dispatcher fails in worker contexts | Medium | AI worker completion/failed notifications may fail | Claude | Fixed | `lib/notifications/events.ts` | `createSupabaseServer()` requires request cookies | Added fallback to non-cookie Supabase client |
| API-004 | AI email triage uses missing OpenAI method | High | AI jobs | Claude | Triage | `lib/ai/jobs/email-triage.ts` | `openai.complete` missing; index typing error | `npm run typecheck` 2026-01-22 |
| API-005 | AI provider optional headers/usage typing | Medium | AI providers | Claude | Triage | `lib/ai/providers.ts` | optional headers/usage mismatch | `npm run typecheck` 2026-01-22 |
