# OpenPeople.ai API Documentation

See `docs/api/STANDARDS.md` for stability tags, response envelope, auth, rate limits, and change policy.

This repo exposes its API via **Next.js App Router route handlers** under `app/api/**/route.ts`. These endpoints are primarily used by the web app itself (browser + server components), but can also be called by external clients.

## Who should use it
- Product engineers extending the web app or building admin tools.
- Backend services that need to act as trusted first‑party clients.
- Power users integrating personal automations against their own tenant.

## Why it exists
- Provide a single, documented contract for the product surface instead of duplicating logic in clients.
- Keep authentication, authorization, and tenant isolation consistent across all features.
- Enable safe third‑party automation while preserving server ownership of business logic.

## Risks & responsibilities
- Calls run against live tenant data; misuse can leak cross‑tenant info if auth is bypassed. Always use the provided middleware.
- Rate limits and audit logging apply; noisy scripts can be throttled or flagged.
- Backward compatibility is maintained per STANDARDS, but preview/unstable endpoints can change without notice—pin to stability tags when consuming.

## Quick start
1) Pick the route doc below and check its stability tag.
2) Authenticate using Supabase session cookies (in-app) or a bearer access token (external).
3) Call the endpoint from the same origin (`/api/...`) in dev/prod; keep the response envelope `{ data, error, traceId }` in mind.
4) Log `traceId` on errors so support can correlate requests.

## 🌐 Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: the same origin as the app (for example `https://{tenant}.openpeople.ai/api`)

## 🔐 Authentication (Centralized Auth System)

This codebase uses a **centralized authentication and authorization system** built on Supabase Auth. Most endpoints use **declarative auth middleware** instead of scattered authentication code.

### Browser / same-origin calls (recommended)

If you’re calling endpoints from the app, authentication is typically carried via **Supabase session cookies** automatically.

### External clients

If you’re calling from outside the app (curl, backend service), send a Supabase **access token**:

```http
Authorization: Bearer <supabase_access_token>
```

The token can be obtained using the Supabase JS client or Supabase Auth API (depending on your integration).

## 📋 Response shapes

Recommended envelope (see STANDARDS):

- Success: `{ "data": <payload>, "error": null, "traceId": "<id>" }`
- Error: `{ "data": null, "error": { "code": "string", "message": "string", "details"?: any }, "traceId": "<id>" }`

Some older endpoints may still return legacy shapes; when updating them, migrate toward the envelope above.

## 🧭 API map

### Stability (summary)
- Core (auth, tenants, onboarding, profile): **stable**
- Features (chat, notes, storage, notifications, email, experiments/flags, workflows, vault, API keys, AI governance/ops workers): **stable** unless marked otherwise in their doc

## 🗒️ API changelog (contract changes)
| Date (UTC) | Change | Stability | Notes/links |
|-----------|--------|-----------|-------------|
| _add rows here_ | – | – | – |


### Core
- **[Authentication](./core/auth.md)** - Centralized auth system, RBAC, and middleware patterns
- **[Tenants](./core/tenants.md)** - Tenant listing (super-admin) and domain status checks
- **[Onboarding](./core/onboarding.md)** - Tenant onboarding record read/update
- **[Profile](./core/profile.md)** - Current user profile + tenant-scoped settings

### Features / add-ons
- **[AI Governance](./features/ai-governance.md)** - AI governance endpoints implemented in this repo
- **[AI Workers](./features/ai-workers.md)** - Chief of Staff weekly planning, budgets, and worker architecture
- **[Chat](./features/chat.md)** - Conversations, messages, memories, and action routes
- **[Email](./features/email.md)** - Email accounts, inbox, messages, templates, domains, sending
- **[Notes](./features/notes.md)** - Notes, versions, templates, graph, and API export
- **[Notifications](./features/notifications.md)** - Events, templates, delivery logs, in-app inbox
- **[Ops Worker](./features/ops-worker.md)** - Decision → propose tasks → commit (human approval)
- **[Storage](./features/storage.md)** - Buckets, files, presigned upload/download
- **[Workflows](./features/workflows.md)** - Projects + tasks (your operating system)
- **[API Keys](./features/api-keys.md)** - Encrypted API keys (create/list/test/reveal)
- **[Vault](./features/vault.md)** - Encrypted vault (folders/files/unlock/AI analysis)

## 🆘 Support

- **Docs issues**: [GitHub Issues](../../issues) with `documentation`
- **API issues**: [GitHub Issues](../../issues) with `api`

---

**Last Updated**: January 20, 2026
