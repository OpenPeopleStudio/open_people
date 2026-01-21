# AI Guardrails

High-risk areas (require human review)
- Auth/permissions and tenant isolation logic.
- Database migrations and any destructive data change.
- Payments/billing (if enabled), policy engine, risk scoring.
- Logging/observability configuration.
- Secrets handling (Supabase, R2, Resend, Twilio, OpenAI keys).

Never log
- Access/secret keys, tokens, session data, emails/phone numbers, vault contents, payment data.
- PII should be redacted before logging; prefer event IDs over raw payloads.

Secrets
- Keep only in env vars; never commit. Use `.env.local.example` for placeholders.
- Do not echo env vars in tests or scripts. Avoid sending secrets to third-party logs.

Data handling
- Always scope queries by `tenantId` and check role/feature flags.
- Prefer soft delete unless policy says otherwise; document irreversible operations.
- Encryption: vault files are zero-knowledge; do not bypass encryption layer.

Changes that need extra safety
- Schema changes: include rollback note; validate with `supabase db lint`.
- Policy/AI worker changes: ensure evaluation metrics and fail-safes remain intact.
- Background jobs: must be idempotent; include correlation IDs in logs.

Operational safeguards
- CI should run `lint`, `typecheck`, `test`, and migration checks.
- Use feature flags for risky UI/feature rollouts.
- For external webhooks, verify signatures before processing.
