# Bug List

Keep this list current before starting any repair work.

## Triage + Repair Protocol

1) Run the failing command and capture evidence (error text + date).
2) Add a bug entry **before** coding: ID, severity, tenant impact, owner, repro, expected vs actual, suspected area, evidence.
3) Mark status as `Triage` once a root-cause hypothesis is recorded.
4) Claim locks for the affected files in `docs/company/locks.md` before edits.
5) Repair in small diffs; update the bug entry with fix notes and evidence.
6) Retest the originating command; move to `Fixed (pending retest)` or `Fixed` once verified.

## Status Definitions

- New: reported but not triaged.
- Triage: root cause suspected, scope identified.
- In Progress: active fix underway with locks claimed.
- Fixed (pending retest): fix landed, command not re-run yet.
- Fixed: verified by command output.
- Blocked: cannot proceed due to lock or missing info.

## Ready for Prod Checklist

- `npm run typecheck` green
- `npm run lint` green
- `npm test` green
- `npm run doctor` green
- All High/Critical bugs in Fixed

## Active

| ID | Title | Severity | Tenant Impact | Owner | Status | Repro Steps | Expected vs Actual | Suspected Area | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | ESLint error: setState inside effect | High | Admin UI | Codex | Fixed (pending retest) | `npm run lint` | Expected: lint clean; Actual: `react-hooks/set-state-in-effect` error | `app/(platform)/admin/company/language/page.tsx` | Moved error handling into loader 2026-01-22 |
| BUG-002 | ESLint error: hook uses function before declaration | High | Super Admin UI | Lisa | Fixed | `npm run lint` | Expected: lint clean; Actual: `react-hooks/immutability` error | `components/super-admin/email-campaigns/CampaignsClient.tsx` | Lint errors resolved 2026-01-22; `npm run lint` has 0 errors |
| BUG-003 | Typecheck: auth logging context ip optional mismatch | High | Auth APIs | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: `exactOptionalPropertyTypes` mismatch | `app/api/auth/login/route.ts` | Typecheck green 2026-01-22 |
| BUG-004 | Typecheck: inbound email types require optional fields | High | Email inbound | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: `InboundEmailData` optional field errors | `app/api/email/inbound/webhook/route.ts` | Typecheck green 2026-01-22 |
| BUG-005 | Typecheck: email domain DNSRecord priority optional | Medium | Email domains | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: `DNSRecord` optional mismatch | `app/api/email/domains/managed/route.ts` | Typecheck green 2026-01-22 |
| BUG-006 | Typecheck: middleware host fields nullable vs undefined | High | Tenant routing | Mr Robot | Fixed | `npm run typecheck` | Expected: TS clean; Actual: `string \| null` not assignable | `middleware.ts` | Typecheck green 2026-01-22 |
| BUG-007 | Typecheck: duplicate identifiers in AI company types | Medium | Types | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: duplicate type identifiers | `types/ai-companies.ts` | Fixed duplicate type block 2026-01-22 |
| BUG-015 | Typecheck: Sentry options optional fields in next config | Medium | Build | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: optional `org/project` passed as `undefined` | `next.config.ts` | Guarded optional Sentry fields 2026-01-22 |
| BUG-008 | Typecheck: vault email worker missing module/types | High | Workers | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: missing `node-forge` types + EmailMessage fields | `workers/vault-email-worker/src/index.ts`, `workers/vault-email-worker/src/node-forge.d.ts` | Added typings + message shape assertions 2026-01-22 |
| BUG-009 | Tests: observability averages floating precision | Medium | Observability | Codex | Fixed (pending retest) | `npm test` | Expected: stable averages; Actual: float precision mismatch | `lib/observability/quality.ts`, `lib/observability/drift.ts` | Rounded averages to avoid float drift 2026-01-22 |
| BUG-010 | Tests: auth unit tests failing due to mock mismatch | High | Auth | Mr Robot | Triage | `npm test` | Expected: auth tests pass; Actual: `logPerformance` mock missing + auth returns null | `__tests__/unit/lib/auth/auth.test.ts` | Vitest output 2026-01-22 |
| BUG-011 | Tests: tenant route type for empty/null host | Medium | Tenant routing | Mr Robot | Triage | `npm test` | Expected: marketing for empty host; Actual: tenant | `__tests__/unit/lib/tenant.test.ts` | Vitest output 2026-01-22 |
| BUG-012 | Tests: authorization edge cases + inherited roles | High | AuthZ | Mr Robot | Triage | `npm test` | Expected: role inheritance + null handling; Actual: failures | `__tests__/unit/lib/auth/authorization.test.ts` | Vitest output 2026-01-22 |
| BUG-013 | Tests: vault recovery code format too short | Medium | Vault | Linus | Triage | `npm test` | Expected: `XXXX-XXXX-XXXX`; Actual: `XXXX-XXXX` | `__tests__/unit/lib/vault/encryption.test.ts` | Vitest output 2026-01-22 |
| BUG-014 | Doctor: missing required env vars | High | Env/Deploy | Linus | Triage | `npm run doctor` | Expected: env complete; Actual: missing Supabase/R2/Resend vars | `scripts/doctor.sh` | Doctor output 2026-01-22 |
| BUG-016 | Typecheck: gate evaluation optional fields | Medium | Observability | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: optional fields passed as `undefined` | `lib/observability/quality.ts` | Omitted undefined optional fields 2026-01-22 |
| BUG-017 | Typecheck: ops context optional profile | Medium | Ops Worker | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: `profile` set to `undefined` | `lib/ops/service.ts` | Omitted profile when absent 2026-01-22 |
| BUG-018 | Typecheck: vault thumbnails buffer type mismatch | Medium | Vault | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: Buffer not assignable to BlobPart | `lib/vault/thumbnails.ts` | Converted to Uint8Array for File blob 2026-01-22 |
| BUG-019 | Typecheck: vault automation unused vaultId | Low | Vault | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: unused parameter | `lib/vault/automation.ts` | Logged vaultId to use parameter 2026-01-22 |
| BUG-020 | Typecheck: workflow placeholders unused vars | Low | Workflows | Codex | Fixed (pending retest) | `npm run typecheck` | Expected: TS clean; Actual: unused placeholder vars | `lib/workflows/context-assembly.ts`, `lib/workflows/search.ts`, `lib/workflows/observability.ts` | Removed unused vars/imports 2026-01-22 |
| BUG-021 | Typecheck: super-admin vault browse errors | High | Super Admin UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: missing state refs + unused vars + missing type | `app/super-admin/vault/browse/*`, `app/super-admin/vault/components/VaultDashboard.tsx` | Typecheck green 2026-01-22 |
| BUG-022 | Typecheck: email UI components unused/missing setters | Medium | Admin UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: missing setters + unused props | `components/email/*` | Typecheck green 2026-01-22 |
| BUG-023 | Typecheck: navigation + notifications return paths | Medium | Admin UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: not all code paths return value + optional handler typing | `components/navigation/SidebarNav.tsx`, `components/notifications/NotificationTray.tsx` | Typecheck green 2026-01-22 |
| BUG-024 | Typecheck: notes sharing + filters optional fields | Medium | Admin UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: unused props + invalid status values + filter state updates | `components/notes/NoteSharing.tsx`, `components/workspace/notes/NotesListView.tsx` | Typecheck green 2026-01-22 |
| BUG-025 | Typecheck: ErrorBoundary exact optional types | Medium | App UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: override modifiers + optional error mismatch | `components/ErrorBoundary.tsx` | Typecheck green 2026-01-22 |
| BUG-026 | Typecheck: AI email triage OpenAI client mismatch | High | AI Jobs | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: `openai.complete` missing + index typing | `lib/ai/jobs/email-triage.ts` | Typecheck green 2026-01-22 |
| BUG-027 | Typecheck: AI providers optional headers/usage | Medium | AI Providers | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: optional headers/usage mismatch | `lib/ai/providers.ts` | Typecheck green 2026-01-22 |
| BUG-028 | Typecheck: Auth logging context types | High | Auth | Mr Robot | Fixed | `npm run typecheck` | Expected: TS clean; Actual: error/ip/userAgent types mismatch | `lib/auth/auth.ts` | Conditional log context fields 2026-01-22; typecheck green 2026-01-22 |
| BUG-029 | Typecheck: Auth middleware generic args | Medium | Auth | Mr Robot | Fixed | `npm run typecheck` | Expected: TS clean; Actual: generic `any[]` mismatch | `lib/auth/middleware.ts` | Typed rest args in wrappers 2026-01-22; typecheck green 2026-01-22 |
| BUG-030 | Typecheck: Compliance audit query optional date_range | Medium | Compliance | Mr Robot | Fixed | `npm run typecheck` | Expected: TS clean; Actual: optional date_range mismatch | `lib/compliance/evidence-collector.ts` | Typecheck green 2026-01-22 |
| BUG-031 | Typecheck: Drift baseline status unused type | Low | Admin UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: unused `AutoBaselineJob` | `components/ai/drift/BaselineStatus.tsx` | Typecheck green 2026-01-22 |
| BUG-032 | Typecheck: Vault context unused computeHash | Low | Admin UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: unused `computeHash` | `context/VaultContext.tsx` | Typecheck green 2026-01-22 |
| BUG-033 | Typecheck: Ops propose budget warning optional | Medium | AI Jobs | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: optional `warning` mismatch | `lib/ai/jobs/workers/opsPropose.ts` | Typecheck green 2026-01-22 |
| BUG-034 | Typecheck: Ops worker prompt unused ChecklistItem | Low | AI Jobs | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: unused `ChecklistItem` | `lib/ai/prompts/opsWorker.ts` | Typecheck green 2026-01-22 |
| BUG-035 | Lint warnings: explicit any in email API routes | Medium | Email API | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warnings | `app/api/email/*` | `npm run lint` shows 0 errors + `npx eslint app/api/email/**/*` shows 0 `no-explicit-any` warnings 2026-01-22 |
| BUG-036 | Lint warnings: explicit any in email library | Medium | Email | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warnings | `lib/email/*` | `npm run lint` shows 0 errors + `npx eslint lib/email/**/*` shows 0 `no-explicit-any` warnings 2026-01-22 |
| BUG-037 | Typecheck: Next route handlers param typing mismatch (keys + notes) | High | Keys + Notes API | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: RouteContext params mismatch vs Next handler types | `app/api/keys/[keyId]/*`, `app/api/notes/[noteId]/*` | `npm run typecheck` green 2026-01-23 |
| BUG-038 | Typecheck: unused vars in admin dashboard | Low | Admin UI | Lisa | Fixed | `npm run typecheck` | Expected: TS clean; Actual: unused `formatBytes`, `recentNotifications` | `app/(platform)/admin/page.tsx` | `npm run typecheck` green 2026-01-23 |
| BUG-039 | Typecheck: notes collaborators route arg count mismatch | Medium | Notes API | Claude | Fixed | `npm run typecheck` | Expected: TS clean; Actual: function called with 3 args | `app/api/notes/[noteId]/collaborators/route.ts` | `npm run typecheck` green 2026-01-23 |
| BUG-040 | Typecheck: job handler logging/context types | Medium | Ops/Jobs | Linus | Fixed | `npm run typecheck` | Expected: TS clean; Actual: `unknown` spread/params not assignable | `lib/jobs/handlers.ts` | `npm run typecheck` green 2026-01-23 |
| BUG-037 | Lint warnings: explicit any in chat API routes | Medium | Chat API | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warnings | `app/api/chat/*` | `npx eslint app/api/chat/**/*` shows 0 `no-explicit-any` warnings 2026-01-22 |
| BUG-038 | Lint warnings: explicit any in observability libs | Medium | Observability | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warnings | `lib/observability/*` | `npx eslint lib/observability/**/*` shows 0 `no-explicit-any` warnings 2026-01-22 |
| BUG-039 | Lint warning: explicit any in health API | Low | Health API | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warning | `app/api/health/route.ts` | `npx eslint app/api/health/route.ts` shows 0 `no-explicit-any` warnings 2026-01-22 |
| BUG-040 | Lint warnings: explicit any in op tag utils | Low | Observability | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warnings | `lib/op/tag.ts` | `npx eslint lib/op/**/*` shows 0 `no-explicit-any` warnings 2026-01-22 |
| BUG-041 | Lint warnings: prefer-const in observability | Low | Observability | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `prefer-const` warnings | `lib/observability/*` | `npx eslint lib/observability/**/*` shows 0 warnings 2026-01-22 |
| BUG-042 | Lint warnings: missing hook deps in admin pages | Medium | Admin UI | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `react-hooks/exhaustive-deps` warnings | `app/(platform)/admin/*` | `npx eslint app/(platform)/admin/**/*` shows 0 `exhaustive-deps` warnings 2026-01-22 |
| BUG-043 | Lint warnings: explicit any in notes API | Medium | Notes API | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warnings | `app/api/notes/*` | `npx eslint app/api/notes/**/*` shows 0 `no-explicit-any` warnings 2026-01-22 |
| BUG-044 | Lint warnings: explicit any in keys API | Medium | Keys API | Codex | Fixed | `npm run lint` | Expected: lint clean; Actual: `@typescript-eslint/no-explicit-any` warnings | `app/api/keys/*` | `npx eslint app/api/keys/**/*` shows 0 `no-explicit-any` warnings 2026-01-22 |

## Backlog

| ID | Title | Severity | Tenant Impact | Owner | Status | Repro Steps | Expected vs Actual | Suspected Area | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-100 |  |  |  |  |  |  |  |  |  |

## Fixed

| ID | Title | Severity | Tenant Impact | Owner | Status | Repro Steps | Expected vs Actual | Suspected Area | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-900 |  |  |  |  |  |  |  |  |  |
