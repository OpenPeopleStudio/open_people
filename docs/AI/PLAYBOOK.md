# AI Playbook

General rules
- Never log secrets/PII. Do not print env vars. Scrub sensitive fields before logging.
- Always scope data by `tenantId` and user role. Multi-tenant isolation is mandatory.
- Migrations need review + rollback note.
- Prefer thin route handlers; put logic in `lib/**`.
- Keep tokens small: link to files instead of pasting large blobs.

Add an API route
1) Create `app/api/<feature>/route.ts` (App Router handler).
2) Put domain logic in `lib/<feature>/service.ts`; keep handler orchestration-only.
3) Auth: require Supabase session; assert tenant feature flag when relevant.
4) Validation: use `zod` schemas; return typed errors.
5) Tests: add/extend `__tests__/` or `app/api/<feature>.test.ts`; run `pnpm test --dir __tests__`.
6) Update changelog and docs if the contract changes.

Add a Supabase migration
1) `supabase migration new <name>`
2) Write SQL (idempotent where possible; avoid dropping without backup).
3) `supabase db lint` then `supabase db push` locally.
4) Document rollback in `docs/DECISIONS/<id>-<name>.md` or migration header comment.
5) Include seed adjustments if needed (update `scripts/seed-mars-tenant.js`).

Add a UI screen (tenant admin)
1) Place under `app/(platform)/admin/<area>/page.tsx` or nested route.
2) Reuse components from `components/workspace/**`; avoid duplicating hooks.
3) Fetch data via server components or `lib/<service>` helpers; preserve tenant scoping.
4) Add loading/error states; guard feature flags.
5) Add a short README near complex components explaining props/state shape.

Add a background worker/job
1) Add job in `workers/` or `lib/ai/workers/` with input/output schema.
2) Enqueue path via API or cron; ensure idempotency (dedupe key).
3) Observe with structured logs (no PII) + metrics counter/timer.

Add an integration (R2/Resend/Twilio/etc.)
1) Create client wrapper in `lib/<service>/client.ts`.
2) Add env keys to `.env.local.example` + `docs/deployment/overview.md` if needed.
3) Add health check step to `scripts/doctor.sh`.

Debugging checklist
- Reproduce with seeded data: `node scripts/seed-mars-tenant.js`.
- Use feature flags to bisect UI changes.
- Check Sentry for stack traces; correlate with request IDs.
- For DB oddities: `supabase db diff` to ensure schema parity.

Definition of done (per change)
- Tests updated/added and passing (`pnpm lint && pnpm typecheck && pnpm test`).
- Docs updated if API/behavior changes.
- No secrets/PII in logs or fixtures.
- Migration/feature flag rollout noted when applicable.
