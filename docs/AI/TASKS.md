# AI-Friendly Task Queue

Use these as ready-made, low-risk tasks for agents or new contributors. Each task includes success criteria and file pointers.

## Backend/API
- Add health endpoint coverage: ensure `app/api/events` handlers have tests for 200 + error paths. Success: tests added, run `pnpm test --dir __tests__`.
- Harden tenant lookup: add unit tests for `lib/tenant.ts` covering custom domain + subdomain fallback. Success: tests green; no change to runtime behavior.
- Add metrics to policy evaluator: emit timing + result counters in `lib/policy/*`. Success: logs/metrics added without PII.

## Database
- Write migration to index audit log lookups by `tenant_id, created_at`. Success: migration + rollback note; `supabase db lint` clean.
- Add seed data for sample feature flags in `scripts/seed-mars-tenant.js`. Success: seeding succeeds; demo flag visible in `demo` tenant.

## Frontend
- Create README for `components/workspace/chat` describing props/state and an example. Success: README added; no runtime changes.
- Add loading/error UI for `app/(platform)/admin/storage` page. Success: UX covers pending/failure; lint passes.

## Operations
- Extend `scripts/doctor.sh` with R2 and Resend connectivity checks. Success: script exits non-zero when creds missing; wired to `pnpm doctor`.
- Add Sentry link references to `docs/RUNBOOK.md` for quick access. Success: links added; doc lint not required.

## Documentation
- Convert a recent design choice into an ADR (e.g., AI gateway routing). Success: new file in `docs/DECISIONS/` with context/decision/consequences.
- Add feature flag rollout steps to `docs/development/testing.md`. Success: section added with checklists.
