# Database Schema Documentation

This document provides comprehensive documentation of the OpenPeople.ai database schema, including table definitions, relationships, indexes, and Row-Level Security (RLS) policies.

## Table of Contents

- [Schema Overview](#schema-overview)
- [Core Tables](#core-tables)
- [Add-On Schemas](#add-on-schemas)
- [Row-Level Security](#row-level-security)
- [Functions and Triggers](#functions-and-triggers)
- [Indexes](#indexes)
- [Migration Strategy](#migration-strategy)

---

## Schema Overview

The database is organized into logical domains:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE SCHEMA                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   tenants   │  │   profiles  │  │   tenant_   │  │   tenant_   │         │
│  │             │  │             │  │   domains   │  │   billing   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                         ┌─────────────┐                                      │
│                         │tenant_usage │                                      │
│                         └─────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           STORAGE ADD-ON                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  storage_   │  │  storage_   │  │  storage_   │  │  storage_   │         │
│  │subscriptions│  │   buckets   │  │    files    │  │    usage    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            EMAIL ADD-ON                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   email_    │  │   email_    │  │   email_    │  │   email_    │         │
│  │subscriptions│  │   domains   │  │  templates  │  │    logs     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                         ┌─────────────┐                                      │
│                         │ email_usage │                                      │
│                         └─────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPERIMENTS ADD-ON                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ experiment_ │  │  audiences  │  │ experiments │  │ experiment_ │         │
│  │subscriptions│  │             │  │             │  │  variants   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │  feature_   │  │  exposure_  │  │ conversion_ │                          │
│  │   flags     │  │   events    │  │   events    │                          │
│  └─────────────┘  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATIONS ADD-ON                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │notification_│  │notification_│  │notification_│  │   in_app_   │         │
│  │subscriptions│  │  templates  │  │ deliveries  │  │notifications│         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────────┐  ┌─────────────┐                                       │
│  │user_notification_│  │notification_│                                       │
│  │   preferences    │  │    usage    │                                       │
│  └─────────────────┘  └─────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### tenants

The central table for all tenant organizations.

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'suspended')),
  settings        JSONB DEFAULT '{}',
  primary_domain  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Display name |
| `slug` | TEXT | URL-safe identifier for subdomain routing |
| `status` | TEXT | Tenant status (active/inactive/suspended) |
| `settings` | JSONB | Full tenant configuration (see TenantSettings type) |
| `primary_domain` | TEXT | Legacy primary custom domain |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Settings JSONB Structure**:
```json
{
  "theme": {
    "brand_name": "Acme Corp",
    "logo_url": "https://...",
    "colors": { "accent": "#3B82F6", ... }
  },
  "features": {
    "ai_inventory": true,
    "ai_chat": true
  },
  "integrations": {
    "payments": { "provider": "stripe" },
    "email": { "provider": "resend" }
  }
}
```

### profiles

User profiles linked to tenants and Supabase Auth.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | References auth.users (Supabase Auth) |
| `tenant_id` | UUID | NULL for super_admin, otherwise tenant reference |
| `email` | TEXT | User email (denormalized from auth.users) |
| `full_name` | TEXT | Display name |
| `avatar_url` | TEXT | Profile image URL |
| `role` | TEXT | User role (super_admin/owner/admin/member/customer) |

**Note**: The `profiles` view provides backward compatibility with legacy code.

### tenant_domains

Custom domain configuration for tenants.

```sql
CREATE TABLE tenant_domains (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  domain              TEXT NOT NULL,
  is_primary          BOOLEAN DEFAULT false,
  verified_at         TIMESTAMPTZ,
  verification_token  TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(domain)
);
```

| Column | Type | Description |
|--------|------|-------------|
| `domain` | TEXT | Custom domain (e.g., store.example.com) |
| `is_primary` | BOOLEAN | Primary domain for the tenant |
| `verified_at` | TIMESTAMPTZ | When domain verification completed |
| `verification_token` | TEXT | Token for DNS verification |

### tenant_billing

Billing and subscription information.

```sql
CREATE TABLE tenant_billing (
  tenant_id               UUID REFERENCES tenants(id) ON DELETE CASCADE PRIMARY KEY,
  plan                    TEXT NOT NULL DEFAULT 'starter',
  status                  TEXT NOT NULL DEFAULT 'trialing',
  billing_email           TEXT,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  trial_ends_at           TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  plan_limits             JSONB DEFAULT '{
    "ai_calls_per_month": 1000,
    "storage_gb": 5,
    "team_members": 3
  }',
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);
```

### tenant_usage

Aggregated usage metrics per billing period.

```sql
CREATE TABLE tenant_usage (
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  period_start  DATE NOT NULL,
  ai_api_calls  INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  PRIMARY KEY (tenant_id, period_start)
);
```

---

## Add-On Schemas

### Storage Add-On

**storage_subscriptions**: Tracks storage tier per tenant

```sql
CREATE TABLE storage_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  tier                    TEXT NOT NULL DEFAULT 'free'
                          CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
  status                  TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id  TEXT,
  current_period_start    TIMESTAMPTZ DEFAULT now(),
  current_period_end      TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);
```

**storage_buckets**: Logical containers for files

```sql
CREATE TABLE storage_buckets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  is_public    BOOLEAN DEFAULT false,
  cors_origins TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);
```

**storage_files**: File metadata (actual files in R2)

```sql
CREATE TABLE storage_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  bucket_id     UUID REFERENCES storage_buckets(id) ON DELETE CASCADE NOT NULL,
  key           TEXT NOT NULL,  -- full path: folder/file.ext
  filename      TEXT NOT NULL,
  content_type  TEXT NOT NULL DEFAULT 'application/octet-stream',
  size          BIGINT NOT NULL DEFAULT 0,
  etag          TEXT,
  metadata      JSONB DEFAULT '{}',
  is_public     BOOLEAN DEFAULT false,
  uploaded_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ,  -- soft delete
  UNIQUE(bucket_id, key)
);
```

### Email Add-On

**email_subscriptions**: Email tier per tenant

**email_domains**: Custom sending domains with DNS verification

**email_templates**: Reusable email templates

```sql
CREATE TABLE email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  html_body   TEXT NOT NULL,
  text_body   TEXT,
  variables   TEXT[] DEFAULT '{}',
  category    TEXT NOT NULL DEFAULT 'transactional'
              CHECK (category IN ('transactional', 'marketing', 'notification')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);
```

**email_logs**: Sent email history with delivery tracking

### Experiments Add-On

**audiences**: Targeting rule definitions

```sql
CREATE TABLE audiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  rules       JSONB NOT NULL DEFAULT '[]',  -- targeting rules
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

**experiments**: A/B tests and multivariate experiments

```sql
CREATE TABLE experiments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  key                 TEXT NOT NULL,  -- programmatic identifier
  description         TEXT,
  type                TEXT NOT NULL DEFAULT 'ab_test'
                      CHECK (type IN ('ab_test', 'multivariate', 'feature_flag')),
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
  rollout_percentage  INTEGER NOT NULL DEFAULT 100,
  audience_id         UUID REFERENCES audiences(id) ON DELETE SET NULL,
  start_date          TIMESTAMPTZ,
  end_date            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, key)
);
```

**feature_flags**: Simple on/off feature toggles

**exposure_events** / **conversion_events**: Analytics tracking

### Notifications Add-On

**notification_templates**: Multi-channel templates (SMS, in-app, push)

**notification_deliveries**: Delivery log with status tracking

**in_app_notifications**: User inbox for in-app notifications

**user_notification_preferences**: Per-user channel preferences

---

## Row-Level Security

All tenant-scoped tables have RLS enabled with policies following this pattern:

### Standard Tenant Isolation Policy

```sql
-- Users can only access their own tenant's data
CREATE POLICY "tenant_isolation_policy"
  ON some_table
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### Super Admin Override

```sql
-- Super admins can access all data
CREATE POLICY "super_admin_access"
  ON some_table
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### RLS Helper Functions

```sql
-- Get current user's tenant ID
CREATE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is super admin
CREATE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is tenant admin
CREATE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'owner')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

---

## Functions and Triggers

### Usage Tracking Functions

```sql
-- Update storage usage when files change
CREATE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
  period DATE := date_trunc('month', now())::DATE;
BEGIN
  INSERT INTO storage_usage (tenant_id, period_start, storage_bytes, file_count)
  SELECT 
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    period,
    COALESCE(SUM(size) FILTER (WHERE deleted_at IS NULL), 0),
    COUNT(*) FILTER (WHERE deleted_at IS NULL)
  FROM storage_files
  WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id)
  ON CONFLICT (tenant_id, period_start)
  DO UPDATE SET
    storage_bytes = EXCLUDED.storage_bytes,
    file_count = EXCLUDED.file_count,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Statistics Functions

```sql
-- Get tenant storage statistics
CREATE FUNCTION get_tenant_storage_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_storage_bytes BIGINT,
  total_files INTEGER,
  total_buckets INTEGER,
  bandwidth_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(f.size) FILTER (WHERE f.deleted_at IS NULL), 0)::BIGINT,
    COUNT(f.id)::INTEGER FILTER (WHERE f.deleted_at IS NULL),
    (SELECT COUNT(*)::INTEGER FROM storage_buckets WHERE tenant_id = p_tenant_id),
    COALESCE(
      (SELECT bandwidth_bytes FROM storage_usage 
       WHERE tenant_id = p_tenant_id 
       AND period_start = date_trunc('month', now())::DATE),
      0
    )::BIGINT
  FROM storage_files f
  WHERE f.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Indexes

### Core Table Indexes

```sql
-- Tenants
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- Profiles
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Tenant domains
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX idx_tenant_domains_tenant ON tenant_domains(tenant_id);
```

### Add-On Indexes

Each add-on follows a consistent indexing strategy:

1. **Tenant ID index** on all tables (`idx_{table}_tenant`)
2. **Lookup indexes** for common query patterns
3. **Foreign key indexes** for join performance
4. **Partial indexes** where appropriate (e.g., `WHERE deleted_at IS NULL`)

---

## Migration Strategy

### Naming Convention

Migrations follow the pattern: `YYYYMMDDHHMMSS_description.sql`

Example: `20260118000000_core_schema.sql`

### Migration Order

1. **Core schema** - tenants, profiles, domains, billing
2. **Add-on schemas** - storage, email, experiments, notifications
3. **Seed data** - default tenants, super admin users
4. **RLS policies** - applied after tables exist

### Idempotent Migrations

All migrations use idempotent patterns:

```sql
-- Tables
CREATE TABLE IF NOT EXISTS ...

-- Columns
ALTER TABLE ADD COLUMN IF NOT EXISTS ...

-- Indexes
CREATE INDEX IF NOT EXISTS ...

-- Policies (drop and recreate)
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ...
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐         ┌─────────────────┐
│    profiles     │────────►│     tenants     │
├─────────────────┤  N:1    ├─────────────────┤
│ id (PK, FK)     │         │ id (PK)         │
│ tenant_id (FK)  │         │ slug (unique)   │
│ role            │         │ settings        │
└─────────────────┘         └────────┬────────┘
                                     │ 1:N
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │ tenant_domains  │ │ tenant_billing  │ │  tenant_usage   │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │
                    │ 1:N (per add-on)
                    ▼
          ┌─────────────────────────────────────────────────────┐
          │              ADD-ON TABLES                           │
          │  storage_*, email_*, experiment_*, notification_*   │
          └─────────────────────────────────────────────────────┘
```

---

## Vault Automation (Email Ingestion)

**Tables**

- `vault_automation_rules`
  - Matching: `email_from_pattern`, `email_from_exact[]`, `email_subject_pattern`, `email_subject_contains[]`
  - Attachments: `attachment_types`, `attachment_name_pattern`, `min_attachment_size`, `max_attachment_size`
  - Actions: `target_folder_id`, `auto_approve`, `ai_classify`, `apply_tags[]`, `priority`
  - Stats: `files_processed`, `last_triggered_at`
- `vault_inbox` (pending review) with `source_email_from/subject/date` + `rule_id`
- `vault_audit_log` captures automation events

**API/UI Alignment**

- API: `POST /api/vault/automation/rules` accepts the fields above (patterns + contains + exact).
- UI: `/super-admin/vault/automation` create/edit form matches the schema fields; auto-approve and target folder are wired through the API.

---

## Related Documentation

- [Architecture Overview](./overview.md)
- [Multi-Tenancy Architecture](./multi-tenancy.md)
- [Security Overview](../security/overview.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
