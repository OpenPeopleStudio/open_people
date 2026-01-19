# Multi-Tenancy Architecture

OpenPeople.ai implements a robust multi-tenant architecture that provides complete data isolation while maintaining operational efficiency. This document details the multi-tenancy patterns, implementation strategies, and best practices used throughout the platform.

## Table of Contents

- [Overview](#overview)
- [Tenant Model](#tenant-model)
- [Data Isolation Strategies](#data-isolation-strategies)
- [Domain Routing](#domain-routing)
- [User Management](#user-management)
- [Configuration Isolation](#configuration-isolation)
- [Usage and Billing](#usage-and-billing)
- [Best Practices](#best-practices)

---

## Overview

### Multi-Tenancy Approach

OpenPeople.ai uses a **shared database with Row-Level Security (RLS)** approach:

| Approach | Description | Used In |
|----------|-------------|---------|
| **Shared Database + RLS** | Single database, data isolated via policies | Primary approach |
| **Logical Isolation** | Tenant-specific settings, keys, domains | Configuration |
| **Physical Isolation** | Separate storage buckets per tenant | R2 Storage |

### Key Principles

1. **Zero Trust Isolation**: Every query is filtered by tenant context
2. **Defense in Depth**: Multiple layers of isolation (app, DB, RLS)
3. **Tenant Transparency**: Tenants operate as if they have dedicated resources
4. **Efficient Resource Sharing**: Shared infrastructure reduces costs

---

## Tenant Model

### Tenant Entity

```typescript
interface Tenant {
  id: string;           // UUID - Primary identifier
  slug: string;         // URL-safe name for subdomain routing
  name: string;         // Display name
  status: 'active' | 'inactive' | 'suspended';
  settings: TenantSettings;
  primary_domain?: string;
  created_at: Date;
  updated_at: Date;
}
```

### Tenant Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Signup    │────►│   Active    │────►│  Suspended  │
│  (created)  │     │             │     │ (non-payment)│
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Inactive   │     │  Deleted    │
                    │ (voluntary) │     │ (after 90d) │
                    └─────────────┘     └─────────────┘
```

**Status Definitions**:

| Status | Access | Billing | Data |
|--------|--------|---------|------|
| `active` | Full access | Active | Retained |
| `inactive` | Read-only | Paused | Retained |
| `suspended` | No access | Past due | Retained 30d |
| (deleted) | N/A | Cancelled | Purged |

### Tenant Hierarchy

```
Platform (OpenPeople.ai)
│
├── Super Admins (tenant_id = NULL)
│   └── Can manage all tenants via app.openpeople.ai
│
├── Mars (slug: 'mars') - Internal Tenant
│   ├── URL: mars.openpeople.ai
│   ├── Purpose: Open People internal workspace
│   ├── Features: All modules enabled
│   └── Owner: mars@tomlane.space
│
├── Tenant A (tenant_id = uuid-a)
│   ├── Owner
│   ├── Admins
│   ├── Members
│   └── Customers
│
└── Tenant B (tenant_id = uuid-b)
    ├── Owner
    ├── Admins
    └── Members
```

### Internal Tenant (Mars)

The `mars` tenant serves as Open People's internal workspace for:
- **Feature Testing**: Test new features before rolling out to customers
- **Business Operations**: Conduct internal Open People operations
- **Dogfooding**: Use the platform as a real tenant would

This tenant has all enterprise features enabled and operates independently from super-admin privileges.

---

## Data Isolation Strategies

### Row-Level Security (RLS)

Every tenant-scoped table has RLS policies that automatically filter data:

```sql
-- Enable RLS on table
ALTER TABLE some_table ENABLE ROW LEVEL SECURITY;

-- Standard isolation policy
CREATE POLICY "tenant_isolation"
  ON some_table
  FOR ALL
  USING (
    tenant_id = current_user_tenant_id()
  );
```

### Isolation Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            REQUEST FLOW                                      │
│                                                                              │
│  1. Request arrives                                                          │
│     └── JWT token with user ID                                              │
│                                                                              │
│  2. auth.uid() extracted by Supabase                                        │
│     └── User's UUID from JWT                                                │
│                                                                              │
│  3. RLS policy evaluates                                                    │
│     └── SELECT tenant_id FROM profiles WHERE id = auth.uid()                │
│                                                                              │
│  4. Query filtered automatically                                            │
│     └── WHERE tenant_id = [resolved_tenant_id]                              │
│                                                                              │
│  5. Results returned (only tenant's data)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Application-Level Isolation

In addition to RLS, the application enforces tenant context:

```typescript
// lib/tenant.ts - Tenant resolution
export async function getTenantFromRequest(
  request?: Request
): Promise<TenantContextValue | null> {
  // 1. Extract host from request
  const host = request.headers.get('host');
  
  // 2. Resolve tenant from host
  const tenant = await resolveTenantByHost(host);
  
  // 3. Return tenant context (or null for marketing/super-admin)
  return tenant;
}

// Usage in API routes
export async function GET(request: Request) {
  const tenant = await getTenantFromRequest(request);
  
  if (!tenant) {
    return Response.json({ error: 'Tenant not found' }, { status: 404 });
  }
  
  // All subsequent operations use tenant.id for filtering
  const data = await fetchDataForTenant(tenant.id);
  return Response.json(data);
}
```

### Cross-Tenant Access (Super Admin Only)

Super admins have special privileges that bypass tenant isolation:

```sql
-- Super admin can access all data
CREATE POLICY "super_admin_access"
  ON some_table
  FOR ALL
  USING (
    is_super_admin()  -- Returns true if user.role = 'super_admin'
  );
```

---

## Domain Routing

### Routing Types

| Pattern | Type | Example |
|---------|------|---------|
| Root domain | Marketing | `openpeople.ai` |
| `www` subdomain | Marketing | `www.openpeople.ai` |
| `app` subdomain | Super Admin | `app.openpeople.ai` |
| `mars` subdomain | Internal Tenant | `mars.openpeople.ai` |
| Tenant subdomain | Tenant | `acme.openpeople.ai` |
| Custom domain | Tenant | `store.acme.com` |

### Development Routing

For local development, use these patterns:

| Pattern | Type | Example |
|---------|------|---------|
| Root localhost | Marketing | `localhost:3000` |
| `app` subdomain | Super Admin | `app.localhost:3000` |
| `mars` subdomain | Internal Tenant | `mars.localhost:3000` |
| Tenant subdomain | Tenant | `demo.localhost:3000` |

### Resolution Priority

```typescript
async function resolveTenantByHost(host: string): Promise<Tenant | null> {
  // 1. Check if marketing domain
  if (isMarketingDomain(host)) return null;
  
  // 2. Check if super admin domain
  if (isSuperAdminDomain(host)) return null;
  
  // 3. Check verified custom domains (highest priority)
  const customDomain = await fetchTenantByDomain(host);
  if (customDomain) return customDomain;
  
  // 4. Check primary_domain field (legacy)
  const primaryDomain = await checkPrimaryDomain(host);
  if (primaryDomain) return primaryDomain;
  
  // 5. Extract and check subdomain
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    const tenant = await fetchTenantBySlug(subdomain);
    if (tenant) return tenant;
  }
  
  // 6. Fallback to default tenant
  return fetchTenantBySlug(DEFAULT_TENANT_SLUG);
}
```

### Custom Domain Setup

```
1. Tenant requests custom domain: store.acme.com
   │
2. System generates verification token
   │
3. Tenant adds DNS TXT record:
   │   _openpeople.store.acme.com → verification_token
   │
4. System verifies DNS record
   │
5. Domain marked as verified
   │
6. Traffic to store.acme.com routes to tenant
```

**Database Records**:

```sql
-- Tenant record
INSERT INTO tenants (id, slug, name) 
VALUES ('uuid-acme', 'acme', 'Acme Corporation');

-- Domain record
INSERT INTO tenant_domains (tenant_id, domain, verified_at)
VALUES ('uuid-acme', 'store.acme.com', now());
```

---

## User Management

### User-Tenant Relationship

```
┌─────────────────┐      ┌─────────────────┐
│   auth.users    │      │     tenants     │
│  (Supabase)     │      │                 │
├─────────────────┤      ├─────────────────┤
│ id (PK)         │      │ id (PK)         │
│ email           │      │ slug            │
│ ...             │      │ ...             │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │ 1:1                    │ 1:N
         ▼                        │
┌─────────────────┐               │
│    profiles     │◄──────────────┘
├─────────────────┤
│ id (FK→users)   │
│ tenant_id (FK)  │
│ role            │
│ email           │
└─────────────────┘
```

### Role Hierarchy

```typescript
type UserRole = 
  | 'super_admin'  // Platform-wide, tenant_id = NULL
  | 'owner'        // Full tenant access, billing
  | 'admin'        // Tenant configuration
  | 'member'       // Standard features
  | 'customer';    // Limited access

const ROLE_PERMISSIONS = {
  super_admin: ['platform:*'],
  owner: ['tenant:*', 'billing:*', 'users:*'],
  admin: ['tenant:read', 'tenant:write', 'users:*'],
  member: ['tenant:read', 'data:*'],
  customer: ['data:read', 'data:write:own'],
};
```

### Module Access by Role

The following modules are accessible to tenant owners and admins (in addition to super admins):

| Module | Owner | Admin | Member | Notes |
|--------|-------|-------|--------|-------|
| Notes | ✅ | ✅ | ❌ | Personal knowledge management |
| API Keys | ✅ | ✅ | ❌ | Integration management |
| Encrypted Vault | ✅ | ✅ | ❌ | Personal secure storage |
| AI Chat | ✅ | ✅ | ❌ | AI assistant conversations |
| Knowledge Base | ✅ | ✅ | ❌ | Facts and documents |
| Workflows | ✅ | ✅ | ❌ | Projects and tasks |
| Cloud Storage | ✅ | ✅ | ✅ | File storage (tenant-scoped) |
| Notifications | ✅ | ✅ | ✅ | Push/email/SMS |
| Email | ✅ | ✅ | ❌ | Transactional email |

### User Onboarding Flow

```
New User Signup
│
├── Via Marketing Site
│   └── Creates new tenant + owner profile
│
├── Via Tenant Invitation
│   └── Creates profile linked to existing tenant
│
└── Via Super Admin
    └── Creates super_admin profile (tenant_id = NULL)
```

---

## Configuration Isolation

### Tenant Settings Structure

Each tenant has a complete settings object stored as JSONB:

```typescript
interface TenantSettings {
  // Branding
  theme?: {
    brand_name: string;
    logo_url: string | null;
    colors: TenantThemeColors;
    typography: TenantTypography;
  };
  
  // Feature toggles
  features?: {
    ai_inventory: boolean;
    ai_chat: boolean;
    ai_analytics: boolean;
    // ... more features
  };
  
  // Third-party integrations
  integrations?: {
    payments: { provider: 'stripe' | 'manual' };
    email: { provider: 'resend' | 'sendgrid' };
    sms: { provider: 'twilio' | 'disabled' };
    ai: { provider: 'openai' | 'anthropic' };
  };
  
  // Business info
  contact?: TenantContact;
  legal?: TenantLegal;
  regional?: TenantRegional;
}
```

### Settings Inheritance

```
Platform Defaults
│
└── Tenant Settings (overrides)
    │
    └── Feature Flags (runtime overrides)
```

### Environment Isolation

Some configurations require environment-level isolation:

```typescript
// API keys are stored per-tenant in notification_subscriptions
const twilioConfig = await supabase
  .from('notification_subscriptions')
  .select('twilio_account_sid, twilio_auth_token, twilio_from_number')
  .eq('tenant_id', tenantId)
  .single();
```

---

## Usage and Billing

### Usage Tracking

Each add-on tracks usage per tenant per billing period:

```sql
-- Example: Storage usage
CREATE TABLE storage_usage (
  tenant_id     UUID REFERENCES tenants(id),
  period_start  DATE,
  storage_bytes BIGINT DEFAULT 0,
  bandwidth_bytes BIGINT DEFAULT 0,
  file_count    INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  PRIMARY KEY (tenant_id, period_start)
);
```

### Plan Limits

```sql
-- Stored in tenant_billing.plan_limits
{
  "ai_calls_per_month": 1000,
  "storage_gb": 5,
  "team_members": 3,
  "email_sends_per_month": 10000
}
```

### Limit Enforcement

```typescript
async function checkUsageLimit(
  tenantId: string, 
  resource: 'ai_calls' | 'storage' | 'email_sends'
): Promise<boolean> {
  const billing = await getTenantBilling(tenantId);
  const usage = await getCurrentPeriodUsage(tenantId);
  
  const limit = billing.plan_limits[`${resource}_per_month`];
  const current = usage[resource];
  
  return current < limit;
}
```

---

## Best Practices

### 1. Always Include tenant_id

Every tenant-scoped table must have a `tenant_id` column:

```sql
CREATE TABLE new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  -- other columns
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Don't forget RLS!
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON new_feature
  FOR ALL USING (
    tenant_id = current_user_tenant_id()
    OR is_super_admin()
  );
```

### 2. Use RLS Helper Functions

Instead of inline subqueries, use the helper functions:

```sql
-- Good: Use helper function
USING (tenant_id = current_user_tenant_id())

-- Avoid: Inline subquery
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
```

### 3. Index tenant_id Columns

Always create an index for tenant_id:

```sql
CREATE INDEX idx_new_feature_tenant ON new_feature(tenant_id);
```

### 4. Validate Tenant Context in API Routes

```typescript
export async function POST(request: Request) {
  // Always verify tenant context
  const tenant = await getTenantFromRequest(request);
  if (!tenant) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Validate user belongs to tenant
  const user = await getUser();
  if (user.tenant_id !== tenant.id && user.role !== 'super_admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with tenant-scoped operation
}
```

### 5. Cascade Deletes Appropriately

Use `ON DELETE CASCADE` for tenant-owned data:

```sql
tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL
```

### 6. Soft Deletes for Auditable Data

For data that needs audit trails:

```sql
deleted_at TIMESTAMPTZ,
-- Add partial index for active records
CREATE INDEX idx_active_records ON table(tenant_id) WHERE deleted_at IS NULL;
```

---

## Testing Multi-Tenancy

### Unit Tests

```typescript
describe('Tenant Isolation', () => {
  it('should not return data from other tenants', async () => {
    // Setup: Create data in tenant A
    const dataA = await createData({ tenantId: 'tenant-a' });
    
    // Act: Query as tenant B user
    const supabase = createClientWithTenant('tenant-b');
    const { data } = await supabase.from('table').select();
    
    // Assert: Tenant B should not see tenant A's data
    expect(data).not.toContainEqual(dataA);
  });
});
```

### Integration Tests

```typescript
describe('RLS Policies', () => {
  it('should enforce tenant isolation at database level', async () => {
    // Direct database query should be filtered by RLS
    const { data, error } = await supabase
      .from('tenant_data')
      .select('*');
    
    // All returned records should belong to current tenant
    expect(data.every(r => r.tenant_id === currentTenantId)).toBe(true);
  });
});
```

---

## Related Documentation

- [Architecture Overview](./overview.md)
- [Database Schema](./database.md)
- [Security Overview](../security/overview.md)
- [API Overview](../api/overview.md)

---

---

## Tenant Admin Interface

Tenants access their workspace at `/admin` with a feature-gated navigation sidebar:

```
Tenant Admin (/admin)
├── Dashboard          # Overview stats and quick actions
├── Encrypted Vault    # Personal secure file storage
├── Cloud Storage      # Tenant file storage
├── API Keys          # Integration key management
├── Notes             # Personal knowledge management
│   ├── Templates     # Note templates
│   └── Graph         # Knowledge graph visualization
├── AI Chat           # AI assistant
│   ├── Profile       # AI interaction preferences
│   └── Settings      # AI provider configuration
├── Knowledge         # Facts and documents
├── Workflows         # Projects and tasks
├── Email             # Transactional email
└── Notifications     # Push/email/SMS settings
```

Navigation items are dynamically shown/hidden based on `tenant.settings.features`.

---

**Last Updated**: January 19, 2026
**Platform Version**: v0.1.0
