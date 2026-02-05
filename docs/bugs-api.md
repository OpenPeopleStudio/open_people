# API / Integrations Bug Triage

Owner: Claude

| ID | Title | Severity | Tenant Impact | Owner | Status | Suspected Area | Evidence | Fix Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| API-001 | Inbound email webhook accepts empty recipients | Medium | Inbound email can be stored without valid recipients | Claude | Fixed | `app/api/email/inbound/webhook/route.ts` | `emailData.to` can be `[]` and passes truthy check | Added normalized recipient validation |
| API-002 | Vault email webhook throws on signature length mismatch | Medium | Invalid signatures return 500 instead of 401 | Claude | Fixed | `app/api/vault/webhook/email/route.ts` | `timingSafeEqual` throws on length mismatch | Added length guard before comparison |
| API-003 | Notification dispatcher fails in worker contexts | Medium | AI worker completion/failed notifications may fail | Claude | Fixed | `lib/notifications/events.ts` | `createSupabaseServer()` requires request cookies | Added fallback to non-cookie Supabase client |
| API-004 | AI email triage uses missing OpenAI method | High | AI jobs | Claude | Triage | `lib/ai/jobs/email-triage.ts` | `openai.complete` missing; index typing error | `npm run typecheck` 2026-01-22 |
| API-005 | AI provider optional headers/usage typing | Medium | AI providers | Claude | Triage | `lib/ai/providers.ts` | optional headers/usage mismatch | `npm run typecheck` 2026-01-22 |
| API-006 | Lint warnings: explicit any in email API routes | Medium | Email API | Codex | Fixed | `app/api/email/*` | `@typescript-eslint/no-explicit-any` warnings | `npm run lint` 0 errors + `npx eslint app/api/email/**/*` 2026-01-22 |
| API-007 | Lint warnings: explicit any in email library | Medium | Email | Codex | Fixed | `lib/email/*` | `@typescript-eslint/no-explicit-any` warnings | `npm run lint` 0 errors + `npx eslint lib/email/**/*` 2026-01-22 |
| API-008 | Lint warnings: explicit any in chat API routes | Medium | Chat API | Codex | Fixed | `app/api/chat/*` | `@typescript-eslint/no-explicit-any` warnings | `npx eslint app/api/chat/**/*` 2026-01-22 |
| API-009 | Lint warning: explicit any in health API | Low | Health API | Codex | Fixed | `app/api/health/route.ts` | `@typescript-eslint/no-explicit-any` warning | `npx eslint app/api/health/route.ts` 2026-01-22 |
| API-010 | Lint warnings: explicit any in notes API | Medium | Notes API | Codex | Fixed | `app/api/notes/*` | `@typescript-eslint/no-explicit-any` warnings | `npx eslint app/api/notes/**/*` 2026-01-22 |
| API-011 | Lint warnings: explicit any in keys API | Medium | Keys API | Codex | Fixed | `app/api/keys/*` | `@typescript-eslint/no-explicit-any` warnings | `npx eslint app/api/keys/**/*` 2026-01-22 |
| API-012 | Typecheck: Next route handlers param typing mismatch (keys + notes) | High | Keys + Notes API | Claude | Fixed | `app/api/keys/[keyId]/*`, `app/api/notes/[noteId]/*` | RouteContext params mismatch vs Next handler types | `npm run typecheck` green 2026-01-23 |
| API-013 | Typecheck: notes collaborators route arg count mismatch | Medium | Notes API | Claude | Fixed | `app/api/notes/[noteId]/collaborators/route.ts` | function called with 3 args | `npm run typecheck` green 2026-01-23 |
