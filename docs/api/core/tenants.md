# Tenants API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

This repo has a small set of tenant-related endpoints under `/api/tenants`.

## GET `/api/tenants` (super-admin only)

List tenants for the super-admin UI.

- **Auth**: required (Supabase session); caller must have `profile.role === "super_admin"`.
- **Query params**:
  - `search` (optional): matches `name` or `slug` (ILIKE)
  - `limit` (optional, default `50`)

**Response**

```json
{ "tenants": [{ "id": "…", "name": "…", "slug": "…", "created_at": "…" }] }
```

## GET `/api/tenants/domain-status?slug=acme`

Used by onboarding to determine whether the tenant subdomain is reachable.

- **Auth**: not required
- **Query params**:
  - `slug` (required)

**Response**

```json
{ "status": "ready" | "pending" | "not_found" | "inactive", "slug": "acme", "subdomain": "acme.openpeople.ai", "message": "…" }
```

Notes:
- In local development (`ROOT_DOMAIN` is `localhost`), status is always `"ready"`.
- In production, the handler does a `HEAD` request to the subdomain to detect DNS propagation.

---

**Last Updated**: January 20, 2026
