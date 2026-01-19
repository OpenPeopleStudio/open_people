# Build Isolation & Testing Strategy

> Last updated: 2026-01-18

## Overview

This document outlines how to isolate portions of the build (tenants, admin, marketing) and ensure changes don't break other people's data or functionality.

---

## 1. Route Domains

The app uses **domain-based routing** (not path-based):

| Domain | Route Type | Description |
|--------|------------|-------------|
| `openpeople.ai`, `www.*`, `localhost:3000` | Marketing | Public site |
| `app.openpeople.ai`, `super.localhost:3000` | Super Admin | Platform admin |
| `*.openpeople.ai`, custom domains | Tenant | Individual tenant apps |

### Testing Different Routes Locally

```bash
# Marketing site
open http://localhost:3000

# Super admin
open http://super.localhost:3000

# Tenant (add to /etc/hosts: 127.0.0.1 demo.localhost)
open http://demo.localhost:3000
```

---

## 2. Isolation Layers

### Layer 1: Route Groups (Next.js)

```
app/
├── (marketing)/    # Public pages - no auth required
├── (platform)/     # Tenant-scoped - requires tenant resolution
├── super-admin/    # Platform admin - requires super_admin role
└── api/
    ├── storage/    # Tenant-scoped APIs
    ├── super-admin/# Super admin APIs
    └── vault/      # Vault APIs (super admin only)
```

### Layer 2: Middleware (Auth & Routing)

**Current**: Minimal middleware, no root protection.

**Recommended**: Add `middleware.ts` at project root:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const routeType = getRouteType(request.headers.get('host'));
  
  // Super admin routes require super_admin role
  if (routeType === 'super-admin') {
    // Verify user has super_admin role
  }
  
  // Tenant routes require valid tenant
  if (routeType === 'tenant') {
    // Verify tenant exists and is active
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Layer 3: API Route Guards

Every API route should:

1. **Authenticate** - Verify user is logged in
2. **Authorize** - Verify user has permission for this action
3. **Scope** - Filter all data by tenant_id or verify super_admin

```typescript
// Standard pattern for tenant-scoped APIs
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  
  // 2. Get tenant scope
  const tenantId = await getUserTenantId(supabase, user.id);
  if (!tenantId) return forbidden();
  
  // 3. Query with tenant filter
  const { data } = await supabase
    .from('some_table')
    .select('*')
    .eq('tenant_id', tenantId);  // ALWAYS filter by tenant
}
```

### Layer 4: Database RLS (Row Level Security)

Supabase RLS policies are the **last line of defense**:

```sql
-- Example: Tenant can only see their own data
CREATE POLICY "tenant_isolation" ON storage_files
  FOR ALL
  USING (tenant_id = current_user_tenant_id());
```

---

## 3. Testing Strategy

### Test Categories

| Category | What it tests | When to run |
|----------|--------------|-------------|
| **Unit** | Individual functions, utilities | On save (watch mode) |
| **Integration** | API routes, database queries | Pre-commit |
| **E2E** | Full user flows | Pre-merge, CI |
| **Isolation** | Cross-tenant data leakage | Pre-merge, CI |

### Test Structure

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── tenant.test.ts
│   │   └── vault/
│   │       ├── encryption.test.ts
│   │       └── automation.test.ts
│   └── utils/
├── integration/
│   ├── api/
│   │   ├── storage.test.ts
│   │   └── vault.test.ts
│   └── db/
│       └── rls-policies.test.ts
├── e2e/
│   ├── marketing/
│   │   └── signup.spec.ts
│   ├── tenant/
│   │   └── admin-dashboard.spec.ts
│   └── super-admin/
│       └── vault.spec.ts
└── isolation/
    ├── tenant-data-isolation.test.ts
    └── super-admin-access.test.ts
```

### Isolation Tests (Critical)

These tests specifically verify that:

1. **Tenant A cannot access Tenant B's data**
2. **Non-super-admin cannot access super-admin routes**
3. **Unauthenticated users cannot access protected routes**
4. **RLS policies are working correctly**

```typescript
// Example: Tenant isolation test
describe('Tenant Data Isolation', () => {
  it('tenant A cannot see tenant B files', async () => {
    // Create file as tenant A
    const fileA = await createFileAsTenant('tenant-a');
    
    // Try to access as tenant B
    const response = await fetchAsTenant('tenant-b', `/api/storage/files/${fileA.id}`);
    
    expect(response.status).toBe(404); // Not 403, to avoid leaking existence
  });
  
  it('tenant cannot modify another tenant data', async () => {
    const fileA = await createFileAsTenant('tenant-a');
    
    const response = await fetchAsTenant('tenant-b', `/api/storage/files/${fileA.id}`, {
      method: 'DELETE',
    });
    
    expect(response.status).toBe(404);
    
    // Verify file still exists
    const file = await getFileById(fileA.id);
    expect(file).not.toBeNull();
  });
});
```

---

## 4. CI/CD Pipeline

### Pre-commit Hooks

```bash
# .husky/pre-commit
npm run lint
npm run typecheck
npm run test:unit
```

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  isolation:
    runs-on: ubuntu-latest
    needs: [unit, integration]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:isolation

  e2e:
    runs-on: ubuntu-latest
    needs: [isolation]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## 5. Development Workflow

### Safe Change Process

1. **Identify scope** - Is this marketing, tenant, or super-admin?
2. **Check dependencies** - What shared code does this touch?
3. **Write tests first** - Especially isolation tests for data changes
4. **Make changes** - In the isolated area
5. **Run relevant tests** - `npm run test:tenant` or `npm run test:admin`
6. **Run full suite before merge** - `npm run test`

### Scoped Test Commands

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run --dir __tests__/unit",
    "test:integration": "vitest run --dir __tests__/integration",
    "test:isolation": "vitest run --dir __tests__/isolation",
    "test:e2e": "playwright test",
    "test:marketing": "vitest run --testPathPattern=marketing",
    "test:tenant": "vitest run --testPathPattern=tenant",
    "test:admin": "vitest run --testPathPattern=super-admin",
    "test:vault": "vitest run --testPathPattern=vault"
  }
}
```

---

## 6. Database Safety

### Migration Safety

1. **Always test migrations** on a copy first
2. **Use transactions** for multi-step changes
3. **Add RLS policies** for any new table
4. **Never remove tenant_id** from existing tables

### RLS Policy Checklist

For every table with user data:

- [ ] Has `tenant_id` column (or is tenant-independent)
- [ ] Has SELECT policy filtering by tenant
- [ ] Has INSERT policy requiring tenant_id
- [ ] Has UPDATE policy filtering by tenant
- [ ] Has DELETE policy filtering by tenant
- [ ] Tested with isolation tests

---

## 7. Monitoring & Alerts

### What to Monitor

1. **Cross-tenant access attempts** - Log when RLS blocks access
2. **Failed auth attempts** - Track suspicious patterns
3. **API errors by tenant** - Catch tenant-specific issues
4. **Super admin actions** - Audit all privileged operations

### Example: Audit Log Query

```sql
-- Find potential cross-tenant access attempts
SELECT * FROM audit_log
WHERE action LIKE '%denied%'
  AND metadata->>'reason' = 'tenant_mismatch'
ORDER BY created_at DESC
LIMIT 100;
```

---

## 8. Quick Reference

### Before Making Changes

| Change Type | Tests to Run | Extra Checks |
|-------------|--------------|--------------|
| Marketing page | `test:marketing` | None |
| Tenant feature | `test:tenant`, `test:isolation` | RLS policies |
| Super admin feature | `test:admin`, `test:isolation` | Role checks |
| Shared lib code | `test:unit`, full suite | All consumers |
| Database schema | `test:integration`, `test:isolation` | Migration safety |
| API route | `test:integration`, `test:isolation` | Auth + scope |

### Emergency Rollback

If a change causes cross-tenant data issues:

1. **Revert the commit immediately**
2. **Check audit logs** for affected operations
3. **Notify affected tenants** if data was exposed
4. **Post-mortem** to prevent recurrence
