# System Architecture Overview

OpenPeople.ai is a multi-tenant SaaS platform for AI alignment and governance. This document provides a comprehensive overview of the system architecture, design principles, and component interactions.

## Table of Contents

- [Architecture Principles](#architecture-principles)
- [High-Level Architecture](#high-level-architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Integration Points](#integration-points)
- [Security Architecture](#security-architecture)

---

## Architecture Principles

### 1. Multi-Tenant by Design

Every component is built with multi-tenancy as a first-class concern:
- **Data Isolation**: Row-Level Security (RLS) ensures tenants can only access their own data
- **Configuration Isolation**: Each tenant has independent settings, themes, and feature flags
- **Resource Isolation**: Usage tracking and limits are enforced per-tenant

### 2. Edge-First Performance

- **Vercel Edge Network**: Global deployment with automatic edge caching
- **Cloudflare R2**: Zero-egress object storage for tenant assets
- **Supabase Edge Functions**: Low-latency database operations

### 3. Security by Default

- **Zero Trust**: Every request is authenticated and authorized
- **Encryption**: Data encrypted at rest and in transit
- **Audit Logging**: All sensitive operations are logged

### 4. Modular Add-Ons

Platform features are organized as composable add-ons:
- Core platform functionality is always available
- Premium features can be enabled per-tenant
- Each add-on has independent billing and usage tracking

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Marketing  │  │ Super Admin │  │   Tenant    │  │  API/SDK    │         │
│  │   Website   │  │  Dashboard  │  │ Applications│  │   Clients   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN ROUTING LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Next.js Middleware                              │    │
│  │  • Domain Resolution (marketing / super-admin / tenant)             │    │
│  │  • Authentication Verification                                       │    │
│  │  • Tenant Context Injection                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │   Marketing    │  │  Super Admin   │  │    Tenant      │                 │
│  │    Routes      │  │    Routes      │  │    Routes      │                 │
│  │  (/)           │  │  (/super-admin)│  │  (/{tenant})   │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        API Routes (/api)                             │    │
│  │  • /api/signup          • /api/storage/*      • /api/experiments/*  │    │
│  │  • /api/super-admin/*   • /api/email/*        • /api/notifications/*│    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Tenant    │  │   Storage    │  │    Email     │  │ Experiments  │     │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │     │
│  │  (lib/      │  │  (lib/       │  │  (lib/       │  │  (lib/       │     │
│  │   tenant.ts) │  │   storage/)  │  │   email/)    │  │   experiments/)│   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐                                         │
│  │Notifications │  │   Supabase   │                                         │
│  │   Service    │  │   Client     │                                         │
│  │  (lib/       │  │  (lib/       │                                         │
│  │notifications/)│  │  supabase/)  │                                        │
│  └──────────────┘  └──────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Supabase   │  │ Cloudflare   │  │    Resend    │  │    Twilio    │     │
│  │  PostgreSQL  │  │     R2       │  │   (Email)    │  │    (SMS)     │     │
│  │  + Auth      │  │  (Storage)   │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Domain Routing Layer

The platform supports three types of routes, determined by the incoming domain:

| Domain Pattern | Route Type | Description |
|---------------|------------|-------------|
| `openpeople.ai`, `www.openpeople.ai` | Marketing | Public marketing website |
| `app.openpeople.ai`, `super.localhost` | Super Admin | Platform administration |
| `{tenant}.openpeople.ai`, custom domains | Tenant | Tenant-specific applications |

**Implementation**: `lib/tenant.ts`

```typescript
// Route type detection
export type RouteType = "marketing" | "super-admin" | "tenant";

// Resolution priority for tenant domains:
// 1. Verified custom domains (tenant_domains table)
// 2. Primary domain (tenants.primary_domain)
// 3. Subdomain routing ({slug}.openpeople.ai)
// 4. Fallback to default tenant
```

### 2. Authentication System

Built on Supabase Auth with multi-tenant extensions:

| Role | Scope | Capabilities |
|------|-------|--------------|
| `super_admin` | Platform-wide | Full platform access, tenant management |
| `owner` | Single tenant | Full tenant access, billing management |
| `admin` | Single tenant | Tenant configuration, user management |
| `member` | Single tenant | Standard tenant features |
| `customer` | Single tenant | Limited customer-facing features |

**Key Functions**:
- `is_super_admin()` - Check if current user is a platform admin
- `is_tenant_admin()` - Check if current user is a tenant admin/owner
- `current_user_tenant_id()` - Get the tenant ID for the current user

### 3. Tenant Context

Every request within a tenant context carries tenant information:

```typescript
type TenantContextValue = {
  id: string;           // UUID
  slug: string;         // URL-safe identifier
  name: string;         // Display name
  primary_domain?: string;
  settings: TenantSettings;  // Theme, features, integrations
  status: "active" | "inactive" | "suspended";
};
```

**Settings Structure**:
- `theme` - Branding (colors, logo, typography)
- `features` - Feature flags (AI, messaging, etc.)
- `integrations` - Third-party service configuration
- `commerce` - Currency and payment settings
- `contact` - Business contact information
- `legal` - Legal and compliance settings

### 4. Add-On Services

Each add-on follows a consistent pattern:

| Add-On | Storage | Provider | Endpoints |
|--------|---------|----------|-----------|
| **Cloud Storage** | `storage_*` tables | Cloudflare R2 | `/api/storage/*` |
| **Email** | `email_*` tables | Resend | `/api/email/*` |
| **Experiments** | `experiment_*` tables | Built-in | `/api/experiments/*` |
| **Notifications** | `notification_*` tables | Twilio | `/api/notifications/*` |

**Common Add-On Tables**:
- `{addon}_subscriptions` - Billing tier and status
- `{addon}_usage` - Usage tracking per period
- Feature-specific tables (templates, logs, etc.)

---

## Data Flow

### Request Lifecycle

```
1. Request arrives at edge (Vercel)
   │
2. Next.js middleware processes request
   ├── Extract host header
   ├── Determine route type (marketing/super-admin/tenant)
   ├── Resolve tenant context if applicable
   └── Verify authentication
   │
3. Route to appropriate handler
   ├── Server Component (pages)
   └── API Route (api endpoints)
   │
4. Service layer processes business logic
   ├── Supabase client with RLS context
   └── External service calls (R2, Resend, Twilio)
   │
5. Database operations with RLS
   ├── User's tenant_id from auth.uid()
   └── Automatic data filtering
   │
6. Response returned through edge
```

### Tenant Resolution Flow

```
Domain: store.openpeople.ai
         │
         ▼
┌─────────────────────┐
│ 1. Custom Domain?   │ → Check tenant_domains table
└─────────────────────┘
         │ No
         ▼
┌─────────────────────┐
│ 2. Primary Domain?  │ → Check tenants.primary_domain
└─────────────────────┘
         │ No
         ▼
┌─────────────────────┐
│ 3. Subdomain?       │ → Extract "store" from host
└─────────────────────┘
         │ Yes
         ▼
┌─────────────────────┐
│ 4. Lookup by Slug   │ → tenants WHERE slug = 'store'
└─────────────────────┘
         │
         ▼
    Tenant Context
```

---

## Multi-Tenant Architecture

See [Multi-Tenancy Architecture](./multi-tenancy.md) for detailed documentation.

### Key Concepts

1. **Shared Database, Isolated Data**
   - Single PostgreSQL database with all tenant data
   - Row-Level Security (RLS) enforces isolation at the database level
   - Every table with tenant data has `tenant_id` column

2. **Tenant Identification**
   - Each tenant has a unique UUID (`tenants.id`)
   - URL-safe slug for subdomain routing (`tenants.slug`)
   - Optional custom domains (`tenant_domains` table)

3. **User-Tenant Relationship**
   - Users belong to exactly one tenant (via `profiles.tenant_id`)
   - Super admins have `tenant_id = NULL` for platform-wide access
   - Tenant owners can invite and manage users

### Database Schema Overview

```
┌─────────────────┐       ┌─────────────────┐
│     tenants     │       │    profiles     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ tenant_id (FK)  │
│ name            │       │ id (PK)         │
│ slug (unique)   │       │ email           │
│ status          │       │ role            │
│ settings (JSONB)│       │ full_name       │
│ primary_domain  │       └─────────────────┘
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐       ┌─────────────────┐
│ tenant_domains  │       │ tenant_billing  │
├─────────────────┤       ├─────────────────┤
│ tenant_id (FK)  │       │ tenant_id (FK)  │
│ domain (unique) │       │ plan            │
│ verified_at     │       │ stripe_*        │
│ is_primary      │       │ plan_limits     │
└─────────────────┘       └─────────────────┘
```

---

## Integration Points

### External Service Configuration

| Service | Environment Variables | Purpose |
|---------|----------------------|---------|
| **Supabase** | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database, Auth, Realtime |
| **Cloudflare R2** | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | File storage |
| **Resend** | `RESEND_API_KEY` | Transactional email |
| **Twilio** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | SMS notifications |

### Webhook Endpoints

| Endpoint | Provider | Purpose |
|----------|----------|---------|
| `/api/email/webhooks` | Resend | Email delivery events |
| `/api/notifications/webhooks` | Twilio | SMS delivery events |

---

## Security Architecture

See [Security Overview](../security/overview.md) for detailed documentation.

### Key Security Measures

1. **Authentication**
   - Supabase Auth with JWT tokens
   - Session management via `@supabase/ssr`
   - Secure cookie handling

2. **Authorization**
   - Role-based access control (RBAC)
   - Row-Level Security (RLS) on all tenant tables
   - API route authorization middleware

3. **Data Protection**
   - Encryption at rest (Supabase managed)
   - TLS for all connections
   - Sensitive data redaction in logs

4. **API Security**
   - Rate limiting per tenant
   - API key authentication for external access
   - CORS configuration per domain

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Runtime** | Next.js | 16.x |
| **Language** | TypeScript | 5.x |
| **UI Framework** | React | 19.x |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | PostgreSQL (Supabase) | 15.x |
| **Auth** | Supabase Auth | Latest |
| **Storage** | Cloudflare R2 | - |
| **Email** | Resend | Latest |
| **SMS** | Twilio | Latest |
| **Deployment** | Vercel | - |

---

## Related Documentation

- [Database Schema](./database.md) - Detailed database design
- [Multi-Tenancy Architecture](./multi-tenancy.md) - Tenant isolation patterns
- [Security Overview](../security/overview.md) - Security practices
- [Deployment Guide](../deployment/overview.md) - Production deployment
- [API Overview](../api/overview.md) - API design and endpoints

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
