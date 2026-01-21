# Centralized Authentication & Authorization (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

OpenPeople.ai uses a **centralized authentication and authorization system** built on top of Supabase Auth. The system provides unified auth patterns, role-based access control (RBAC), and multi-tenant isolation.

## Who should use it
- Teams building or securing route handlers that require consistent authz/authn.
- Platform engineers defining RBAC/tenant policies across features.
- External services acting as trusted first-party clients (with bearer tokens).

## Why it exists
- Enforce one source of truth for authentication, tenant isolation, and permission checks.
- Reduce duplicated auth code and eliminate per-route security drift.
- Provide composable middleware (`withAuthentication`, `withRole`, `withPermission`) that encode policy.

## Risks & responsibilities
- Skipping the middleware can leak data across tenants or bypass RBAC—always wrap handlers.
- Token handling: bearer tokens can be replayed if logged; avoid printing them and prefer short TTLs.
- Role/permission changes propagate immediately; cache user context carefully to avoid stale grants.

## Quick start
1) Choose the middleware shape: `withAuthentication` (auth only), `withRole`, or `withPermission`.
2) Wrap your route handler export; accept the injected `auth` context.
3) Return `{ data, error, traceId }` envelopes and bubble `traceId` into logs.
4) For external callers, obtain a Supabase access token and send `Authorization: Bearer <token>`.

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Routes    │───▶│   Middleware     │───▶│  Handlers       │
│                 │    │ • Authentication │    │ • Business      │
│ • withAuth()    │    │ • Authorization  │    │ • Logic         │
│ • withRole()    │    │ • Tenant Check   │    │                 │
│ • withPermission│    │ • RBAC           │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Authentication Flow

1. **Request arrives** with Supabase session cookies
2. **Middleware authenticates** user via `supabase.auth.getUser()`
3. **Profile lookup** retrieves role and tenant information
4. **Authorization checks** validate permissions and access
5. **Request processing** continues with authenticated context

## 🎯 Using Auth Middleware

### Basic Authentication

```typescript
// app/api/user/profile/route.ts
import { withAuthentication } from '@/lib/auth/middleware';

export const GET = withAuthentication(async (auth) => {
  // User is guaranteed to be authenticated
  const profile = await getUserProfile(auth.user.id);
  return NextResponse.json({ profile });
});
```

### Role-Based Access

```typescript
// app/api/admin/users/route.ts
import { withRole, UserRole } from '@/lib/auth/middleware';

export const GET = withRole(UserRole.ADMIN)(async (auth) => {
  // Only admins can access this
  const users = await getAllUsers();
  return NextResponse.json({ users });
});
```

### Permission-Based Access

```typescript
// app/api/vault/files/route.ts
import { withPermission, Permission } from '@/lib/auth/middleware';

export const POST = withPermission(Permission.VAULT_WRITE)(async (auth) => {
  // Must have vault write permission
  const file = await uploadFile(auth.user.id);
  return NextResponse.json({ file });
});
```

### Complex Requirements

```typescript
// app/api/notes/[noteId]/route.ts
import { withAuthAndAuthZ } from '@/lib/auth/middleware';

export const DELETE = withAuthAndAuthZ({
  role: UserRole.OWNER,
  permission: Permission.NOTES_DELETE,
  tenantId: 'tenant-123'
})(async (auth, request) => {
  // Complex multi-level authorization
  const noteId = request.params.noteId;
  await deleteNote(noteId);
  return NextResponse.json({ success: true });
});
```

## 👥 User Roles & Permissions

### Role Hierarchy

```
SUPER_ADMIN (highest)
├── ADMIN
├── OWNER
├── MEMBER
└── GUEST (lowest)
```

Higher roles inherit permissions from lower roles.

### Available Permissions

| Category | Permissions |
|----------|-------------|
| **Vault** | `VAULT_READ`, `VAULT_WRITE`, `VAULT_DELETE`, `VAULT_ADMIN` |
| **Notes** | `NOTES_READ`, `NOTES_WRITE`, `NOTES_DELETE` |
| **Chat** | `CHAT_READ`, `CHAT_WRITE` |
| **Admin** | `ADMIN_READ`, `ADMIN_WRITE`, `ADMIN_DELETE` |
| **Tenant** | `TENANT_READ`, `TENANT_WRITE`, `TENANT_ADMIN` |

### Role Permissions

| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | All permissions across all tenants |
| **ADMIN** | Administrative access within tenant |
| **OWNER** | Full resource access within tenant |
| **MEMBER** | Standard access within tenant |
| **GUEST** | Read-only access within tenant |

## 🌐 Multi-Tenant Access Control

### Tenant Isolation

- **Automatic tenant scoping** based on user profile
- **Cross-tenant access** requires SUPER_ADMIN role
- **Resource ownership** validation for user-owned objects

### Tenant Context

```typescript
// Access tenant information
const { user, tenantId } = auth;
const userRole = user.profile?.role;
const userTenantId = user.profile?.tenant_id;
```

## 🔧 Calling Authenticated Endpoints

### From the Web App

```typescript
// Automatic authentication via session cookies
const response = await fetch('/api/user/profile');
const data = await response.json();
```

### From External Clients

```http
# Include Supabase access token
Authorization: Bearer <supabase_access_token>

# Or use session cookies
Cookie: sb-<project-ref>-auth-token=<token>
```

### Error Responses

```typescript
// 401 Unauthorized
{ "error": "Authentication required" }

// 403 Forbidden
{ "error": "Insufficient permissions" }

// 403 Forbidden (wrong tenant)
{ "error": "Access denied: wrong tenant" }
```

## 📊 Monitoring & Security

### Authentication Metrics

- **Successful logins**: `auth_success_total{role="admin"}`
- **Failed attempts**: `auth_failed_total{reason="invalid_credentials"}`
- **Permission grants**: `authz_granted_total{permission="vault:write"}`
- **Permission denials**: `authz_denied_total{reason="insufficient_role"}`

### Security Alerts

- **Brute force attempts** on authentication
- **Unauthorized permission** requests
- **Suspicious activity** patterns
- **Role escalation** attempts

### Audit Logging

All authentication and authorization events are logged with:

- User ID and role
- IP address and user agent
- Requested permission/resource
- Success/failure status
- Correlation IDs for request tracing

## 🔄 Migration Status

### ✅ Migrated Routes

| Route | Status | Auth Pattern |
|-------|--------|--------------|
| `/api/profile` | ✅ Migrated | `withAuthAndAuthZ({ role: OWNER })` |
| `/api/vault/status` | ✅ Migrated | `withRole(OWNER)` |
| `/api/notes` | ✅ Migrated | `withRole(OWNER)` |

### 🔄 Migration Pattern

```typescript
// Before (scattered auth)
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Business logic...
}

// After (centralized auth)
import { withAuthentication } from '@/lib/auth/middleware';

export const GET = withAuthentication(async (auth) => {
  // User is authenticated, business logic only...
});
```

## 🧪 Testing Auth Middleware

```typescript
// Unit tests
describe('Auth Middleware', () => {
  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/protected-route')
      .expect(401);
  });

  it('should allow authenticated users', async () => {
    const response = await request(app)
      .get('/api/protected-route')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });
});
```

## 📚 Related Documentation

- [Auth System Architecture](../../architecture/auth-system.md)
- [Monitoring & Observability](../../deployment/monitoring.md)
- [Security Overview](../../../security/overview.md)
