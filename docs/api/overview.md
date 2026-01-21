# OpenPeople.ai API Documentation

This repo exposes its API via **Next.js App Router route handlers** under `app/api/**/route.ts`. These endpoints are primarily used by the web app itself (browser + server components), but can also be called by external clients.

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

There is **no single global response envelope** today. Common patterns you’ll see:

- `{ error: "..." }` with status `4xx/5xx`
- `{ success: true, ... }` on successful actions (not universal)

When documenting/consuming an endpoint, rely on the endpoint’s doc (below) or the route handler in `app/api/.../route.ts`.

## 🧭 API map

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