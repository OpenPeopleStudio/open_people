# AI Context

Purpose: give agents and new contributors the minimum shared reality to act safely.

Product goals
- Multi-tenant AI workspace with governance (costs, drift, QA, HITL, policy engine).
- Ship modular add-ons: storage (R2), email (Resend), notifications (Twilio), experiments/flags, vault, notes, chat, knowledge, workflows.

Non-goals / red lines
- One-off single-tenant hacks.
- Unreviewed migrations or prod-only changes.
- Logging secrets/PII.

Key entities
- Tenant: slug + custom domains + feature flags.
- User: Supabase auth user + profile row.
- Membership: user ↔ tenant with role.
- Platform admin (super-admin app).
- Workspace surfaces: vault, notes, chat, knowledge, workflows, keys, notifications, experiments, storage, email.

Truth sources
- Database schema: `supabase/migrations` (primary source of truth).
- Business logic: `lib/**` services, helpers per domain.
- API surface: `app/api/**/route.ts` (App Router handlers).
- UI shells: `app/(marketing)`, `app/(platform)/admin`, `app/super-admin`.
- Seeds: `scripts/seed-mars-tenant.js`.
- Env/config: `.env.local`, Vercel project envs.

High-level request flow
request → `middleware.ts` (domain + tenant resolution) → Supabase auth/session → feature flag guard → handler → service in `lib/*` → Supabase / R2 / Resend / Twilio → response → logging/metrics.

Environments
- local: `.env.local`, Supabase CLI db.
- preview: Vercel preview (document which Supabase instance is used before touching data).
- prod: Vercel + prod Supabase; treat as immutable except planned migrations.

Config/map
- Routing/tenants: `middleware.ts`, `lib/tenant.ts`.
- Auth: Supabase SSR helpers in `lib/supabase/**`.
- Storage: `lib/storage/`.
- Email: `lib/email/`.
- Experiments/flags: `lib/experiments/`.
- Notifications: `lib/notifications/`.
- AI workers/gateway: `lib/ai/`, `lib/gateway/`, `workers/`.
- Policy/risk: `lib/policy/`, `lib/risk/`.
- Events: `lib/events/`.
- Types: `types/`.

Observability
- Sentry configs: `sentry.*.config.js`.
- Logging: Pino JSON (see `lib` helpers) with correlation IDs.
- Metrics/tracing: request timing + DB query timing hooks (extend, don’t replace).
