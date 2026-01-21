# API Standards

Purpose: keep APIs consistent, predictable, and safe in a multi-tenant environment.

Principles
- Stable contracts first; prefer additive changes. Breaking changes require versioning or feature flags and an ADR entry.
- Least privilege: never expose service-role keys to clients; validate tenant + role on every request.
- Explicitness over magic: document inputs/outputs; avoid hidden defaults.
- Observability with privacy: include `traceId`; log without PII/secrets.

Stability tags
- `stable`: subject to semantic versioning; breaking changes require versioning/flag + deprecation path.
- `beta`: usable with caution; breaking changes possible but must be announced.
- `experimental`: volatile; no stability guarantees.

Response envelope (recommended)
- Success: `{ "data": <payload>, "error": null, "traceId": "<id>" }`
- Error: `{ "data": null, "error": { "code": "string", "message": "string", "details"?: any }, "traceId": "<id>" }`
- Always include `traceId` (correlates with structured logs).

HTTP semantics
- 200/201 success; 400 validation; 401/403 authz; 404 scoped not found; 409 conflict; 422 semantic; 429 throttled (with `Retry-After`); 500 unexpected.
- Pagination: cursor-based (`cursor`, `limit`), return `nextCursor`.
- Idempotency: for mutating POST/PUT, accept `Idempotency-Key` header when supported.

Rate limiting & safety
- Enforce per-tenant and per-user limits; return `429` without body logs.
- Never return secrets, tokens, or vault contents. Scrub PII from logs.
- Mutations should emit audit events with actor, tenantId, action, target.

Change process
- Update `docs/api/overview.md` changelog for any contract change; add ADR for breaking/risky changes.
- Update OpenAPI artifact if the external contract changes.
- Tests: happy + failure paths, auth/tenant isolation, and serialization of envelope.

Versioning
- Prefer additive evolution; if breaking, create a new path (e.g., `/api/v2/...`) or gate behind a feature flag with a documented sunset date.
