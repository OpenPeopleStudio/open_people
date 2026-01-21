# Safety Guardrails

Use this file to decide when a change needs extra review and how to avoid leaking data.

High-risk changes (require human review)
- Auth/permissions logic, tenant isolation, middleware.
- Database migrations and irreversible data changes.
- Policy engine, AI worker pipelines, risk scoring.
- Payments/billing (if enabled) and webhook consumers.
- Logging/observability configuration.

Secrets & PII
- Never log secrets, tokens, emails, phone numbers, vault contents, payment info.
- Keep secrets only in env vars. `.env.local.example` should contain placeholders only.
- Do not echo env vars in scripts or tests.

Data handling
- Always filter/scope by `tenantId` and user role.
- Prefer soft-delete; if hard delete is required, document rationale and rollback.
- Vault is zero-knowledge: do not bypass encryption layer.

Operational safety
- Run `pnpm lint && pnpm typecheck && pnpm test` before merging.
- Run `supabase db lint` before applying migrations; include rollback notes.
- Use feature flags for risky rollouts; default new flags to off in prod.

Incident basics
- For suspected leakage, rotate affected keys immediately (Supabase service, R2, Resend, Twilio, OpenAI).
- Capture request IDs and timestamps from logs; avoid adding new PII to debug.
