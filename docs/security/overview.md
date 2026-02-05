# Security Overview

This document provides a comprehensive overview of security practices, architecture, and controls implemented in the OpenPeople.ai platform.

## Table of Contents

- [Security Principles](#security-principles)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Data Security](#data-security)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Security Monitoring](#security-monitoring)
- [Incident Response](#incident-response)

---

## Security Principles

### Core Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum necessary access rights
3. **Zero Trust**: Verify every request, trust nothing by default
4. **Secure by Default**: Security enabled out of the box
5. **Transparency**: Clear security practices and controls

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  PERIMETER                                                           │    │
│  │  • Vercel Edge Network (DDoS protection)                            │    │
│  │  • SSL/TLS termination                                              │    │
│  │  • WAF rules                                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  APPLICATION                                                         │    │
│  │  • Authentication (Supabase Auth)                                   │    │
│  │  • Authorization (RBAC)                                             │    │
│  │  • Input validation                                                 │    │
│  │  • Rate limiting                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DATA                                                                │    │
│  │  • Row-Level Security (RLS)                                         │    │
│  │  • Encryption at rest                                               │    │
│  │  • Encryption in transit                                            │    │
│  │  • Tenant isolation                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication

### Authentication Architecture

OpenPeople.ai uses Supabase Auth for all authentication:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                   │
│                                                                              │
│  User                   Application              Supabase Auth              │
│   │                         │                         │                     │
│   │  1. Login Request       │                         │                     │
│   │ ────────────────────────►                         │                     │
│   │                         │  2. Forward to Auth     │                     │
│   │                         │ ────────────────────────►                     │
│   │                         │                         │                     │
│   │                         │  3. Validate Credentials│                     │
│   │                         │  4. Generate JWT        │                     │
│   │                         │ ◄────────────────────────                     │
│   │  5. Set Secure Cookie   │                         │                     │
│   │ ◄────────────────────────                         │                     │
│   │                         │                         │                     │
│   │  6. Subsequent Requests │                         │                     │
│   │ ────────────────────────►                         │                     │
│   │                         │  7. Verify JWT          │                     │
│   │                         │ ────────────────────────►                     │
│   │                         │  8. Return User Info    │                     │
│   │                         │ ◄────────────────────────                     │
│   │                         │                         │                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Methods

| Method | Use Case | Security Level |
|--------|----------|---------------|
| Email/Password | Standard login | Medium |
| Magic Link | Passwordless | High |
| OAuth (Google, GitHub) | Social login | High |
| API Key | Programmatic access | High |

### Session Management

```typescript
// lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Secure cookie settings
          request.cookies.set({
            name,
            value,
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name);
        },
      },
    }
  );

  // Refresh session if needed
  await supabase.auth.getSession();
  return supabase;
}
```

### Password Requirements

| Requirement | Value |
|-------------|-------|
| Minimum length | 8 characters |
| Complexity | Mixed case + number |
| Breach check | Enabled (via Supabase) |
| Reset expiry | 1 hour |

### Multi-Factor Authentication (Roadmap)

Future MFA support:
- TOTP (Authenticator apps)
- SMS verification
- WebAuthn/Passkeys

---

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// User roles and their permissions
const ROLES = {
  super_admin: {
    scope: 'platform',
    permissions: ['*'],
    description: 'Full platform access',
  },
  owner: {
    scope: 'tenant',
    permissions: [
      'tenant:*',
      'billing:*',
      'users:*',
      'data:*',
    ],
    description: 'Full tenant access',
  },
  admin: {
    scope: 'tenant',
    permissions: [
      'tenant:read',
      'tenant:write',
      'users:*',
      'data:*',
    ],
    description: 'Tenant configuration',
  },
  member: {
    scope: 'tenant',
    permissions: [
      'tenant:read',
      'data:*',
    ],
    description: 'Standard access',
  },
  customer: {
    scope: 'tenant',
    permissions: [
      'data:read:own',
      'data:write:own',
    ],
    description: 'Limited access',
  },
};
```

### Permission Checking

```typescript
// lib/auth.ts
export async function checkPermission(
  userId: string,
  permission: string,
  resourceTenantId?: string
): Promise<boolean> {
  const user = await getUser(userId);
  
  // Super admins have all permissions
  if (user.role === 'super_admin') {
    return true;
  }
  
  // Check tenant scope
  if (resourceTenantId && user.tenant_id !== resourceTenantId) {
    return false;
  }
  
  // Check role permissions
  const rolePermissions = ROLES[user.role].permissions;
  return matchPermission(rolePermissions, permission);
}

// Usage in API route
export async function DELETE(request: Request, { params }) {
  const user = await getAuthenticatedUser(request);
  
  if (!await checkPermission(user.id, 'users:delete', params.tenantId)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with deletion
}
```

### Database-Level Authorization (RLS)

```sql
-- Row-Level Security ensures data isolation
CREATE POLICY "tenant_isolation"
  ON tenant_data
  FOR ALL
  USING (
    -- User can only access their tenant's data
    tenant_id = current_user_tenant_id()
    -- OR they are a super admin
    OR is_super_admin()
  );

-- Role-specific policies
CREATE POLICY "admin_can_manage_users"
  ON profiles
  FOR ALL
  USING (
    is_super_admin()
    OR (
      is_tenant_admin()
      AND tenant_id = current_user_tenant_id()
    )
  );
```

---

## Data Security

### Encryption

| Data State | Encryption | Method |
|------------|------------|--------|
| At Rest | Yes | AES-256 (Supabase managed) |
| In Transit | Yes | TLS 1.3 |
| Backups | Yes | AES-256 |

### Sensitive Data Handling

```typescript
// Identify and protect sensitive fields
const SENSITIVE_FIELDS = [
  'password',
  'api_key',
  'stripe_customer_id',
  'twilio_auth_token',
  'email', // PII
  'phone', // PII
];

// Redact in logs
function redactSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }
  return redacted;
}
```

### Data Classification

| Classification | Examples | Handling |
|---------------|----------|----------|
| **Public** | Marketing content | No restrictions |
| **Internal** | Feature flags, configs | Logged access |
| **Confidential** | User data, emails | Encrypted, RLS |
| **Restricted** | Passwords, API keys | Never logged, encrypted |

### Tenant Data Isolation

Every tenant's data is isolated through multiple layers:

1. **Application Layer**: Tenant context validated on every request
2. **API Layer**: Tenant ID required for all tenant-scoped operations
3. **Database Layer**: RLS policies filter all queries automatically
4. **Storage Layer**: Separate bucket prefixes per tenant

```sql
-- Example: File storage isolation
SELECT * FROM storage_files
WHERE bucket_id = 'bucket-123'
-- RLS automatically adds:
-- AND tenant_id = current_user_tenant_id()
```

---

## API Security

### Authentication

All API endpoints require authentication:

```typescript
// API route authentication
export async function GET(request: Request) {
  const supabase = createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // User is authenticated
  // Proceed with request
}
```

### Rate Limiting

```typescript
// Rate limiting configuration
const RATE_LIMITS = {
  'api/auth/*': { requests: 10, window: '1m' },
  'api/email/*': { requests: 100, window: '1h' },
  'api/storage/*': { requests: 1000, window: '1h' },
  'api/*': { requests: 100, window: '1m' },
};

// Implementation via Vercel Edge Config or custom middleware
```

### Input Validation

```typescript
// Using Zod for request validation
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'member', 'customer']),
});

export async function POST(request: Request) {
  const body = await request.json();
  
  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: 'Invalid request', details: result.error.issues },
      { status: 400 }
    );
  }
  
  // Proceed with validated data
  const validatedData = result.data;
}
```

### CORS Configuration

```typescript
// Strict CORS policy
const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(request),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true',
};

function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://openpeople.ai',
    /^https:\/\/.*\.openpeople\.ai$/,
    // Dynamically allow verified tenant domains
  ];
  
  if (origin && isAllowed(origin, allowedOrigins)) {
    return origin;
  }
  return 'https://openpeople.ai';
}
```

---

## Infrastructure Security

### Network Security

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NETWORK ARCHITECTURE                                 │
│                                                                              │
│  Internet                                                                    │
│     │                                                                        │
│     │ TLS 1.3                                                               │
│     ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Vercel Edge (WAF, DDoS Protection)                                 │    │
│  └──────────────────────────────┬──────────────────────────────────────┘    │
│                                 │ Internal                                   │
│                                 ▼                                            │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   Application    │◄──►│    Supabase      │◄──►│       R2         │       │
│  │   Functions      │    │   (Private)      │    │    (Private)     │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Secrets Management

| Secret Type | Storage | Access |
|-------------|---------|--------|
| Environment variables | Vercel Encrypted | Serverless functions |
| Database credentials | Supabase managed | Connection string |
| API keys | Vercel Encrypted | Specific routes |
| Tenant secrets | Database (encrypted) | Tenant-scoped |

**Best Practices**:
- Never commit secrets to version control
- Rotate secrets regularly
- Use least-privilege access for service accounts
- Audit secret access

### Dependency Security

```bash
# Regular security audits
npm audit

# Automated dependency updates
# Use Dependabot or Renovate for automated PRs

# Lock file integrity
npm ci  # Use in CI/CD
```

---

## Security Monitoring

### Email Security Logging

- Email payloads (subjects, bodies, addresses, headers) must never be logged.
- Logs should contain only redacted metadata (counts, booleans, hashed IDs).
- Webhook endpoints must enforce signature verification (fail closed in production).

### Security Events to Monitor

| Event | Severity | Response |
|-------|----------|----------|
| Failed login attempts (>5) | Medium | Alert, temp block |
| Role elevation | High | Alert, review |
| Bulk data export | High | Alert, audit |
| API abuse | Medium | Rate limit, alert |
| RLS bypass attempt | Critical | Block, investigate |

### Audit Logging

```typescript
// Security audit log entry
interface SecurityAuditLog {
  timestamp: string;
  event_type: 'auth' | 'access' | 'data' | 'admin';
  action: string;
  actor_id: string;
  actor_role: string;
  resource_type: string;
  resource_id: string;
  tenant_id: string | null;
  ip_address: string;
  user_agent: string;
  result: 'success' | 'failure';
  details: Record<string, unknown>;
}

// Log security events
async function logSecurityEvent(event: SecurityAuditLog) {
  await supabase.from('security_audit_logs').insert(event);
  
  // Alert on high-severity events
  if (isHighSeverity(event)) {
    await sendSecurityAlert(event);
  }
}
```

### Automated Security Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P1** | Critical - Data breach | 15 minutes | Unauthorized data access |
| **P2** | High - Security vulnerability | 1 hour | RLS bypass |
| **P3** | Medium - Suspicious activity | 4 hours | Multiple failed logins |
| **P4** | Low - Security improvement | Next sprint | Dependency update |

### Incident Response Procedure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INCIDENT RESPONSE WORKFLOW                              │
│                                                                              │
│  1. DETECT                                                                   │
│     └── Monitoring alerts, user reports, automated scans                    │
│                                                                              │
│  2. CONTAIN                                                                  │
│     └── Isolate affected systems, block malicious actors                    │
│                                                                              │
│  3. INVESTIGATE                                                              │
│     └── Analyze logs, determine scope and impact                            │
│                                                                              │
│  4. REMEDIATE                                                                │
│     └── Fix vulnerability, restore systems                                  │
│                                                                              │
│  5. COMMUNICATE                                                              │
│     └── Notify affected parties, update status page                         │
│                                                                              │
│  6. REVIEW                                                                   │
│     └── Post-incident analysis, update procedures                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Security Contacts

| Role | Responsibility | Escalation |
|------|----------------|------------|
| Security Lead | Overall security | First responder |
| Engineering Lead | Technical remediation | P1/P2 incidents |
| Legal | Compliance, notification | Data breaches |
| Communications | External messaging | Customer notification |

---

## Security Checklist

### Development

- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] Parameterized queries (no SQL injection)
- [ ] Dependency updates current
- [ ] No secrets in code

### Deployment

- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error messages sanitized

### Operations

- [ ] Security monitoring active
- [ ] Audit logging enabled
- [ ] Backups encrypted
- [ ] Incident response plan tested
- [ ] Security training completed

---

## Priority Security Work (Not Yet Implemented)

These are the highest impact gaps to address first.

1. **Centralized auth middleware** to enforce tenant and role checks across all
   routes (see `docs/TODO.md`).
2. **Rate limiting** across public and tenant APIs.
3. **CSRF protection** for state-changing routes.
4. **Security headers** (CSP, HSTS, X-Frame-Options, etc.).
5. **RLS policy review** to ensure full tenant isolation.
6. **Data retention enforcement** (automated purging).
7. **MFA rollout** for admin and high-privilege accounts.
8. **Security monitoring alerts** and automated scanning in CI.

---

## Related Documentation

- [Data Security Bible](./data-security-bible.md)
- [Compliance](./compliance.md)
- [Privacy](./privacy.md)
- [Architecture Overview](../architecture/overview.md)
- [Multi-Tenancy](../architecture/multi-tenancy.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
