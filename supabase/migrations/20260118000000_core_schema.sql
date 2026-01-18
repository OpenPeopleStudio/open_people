-- ═══════════════════════════════════════════════════════════════════════════
-- OpenPeople.ai Core Schema Additions
-- Extends the existing 709exclusive multi-tenant schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Add missing columns to tenant_billing (if not exists)
alter table tenant_billing 
add column if not exists stripe_subscription_id text;

alter table tenant_billing 
add column if not exists current_period_end timestamptz;

alter table tenant_billing 
add column if not exists plan_limits jsonb default '{
  "ai_calls_per_month": 1000,
  "storage_gb": 5,
  "team_members": 3
}'::jsonb;

-- Add verification_token to tenant_domains (if not exists)
alter table tenant_domains 
add column if not exists verification_token text;

-- Tenant usage tracking (for AI/storage metering)
create table if not exists tenant_usage (
  tenant_id uuid references tenants(id) on delete cascade,
  period_start date not null,
  ai_api_calls integer default 0,
  storage_bytes bigint default 0,
  messages_sent integer default 0,
  primary key (tenant_id, period_start)
);

-- Enable RLS on tenant_usage
alter table tenant_usage enable row level security;

-- Tenant usage policy
create policy "Users can view their tenant usage"
  on tenant_usage for select
  using (
    tenant_id in (
      select tenant_id from "709_profiles" where id = auth.uid()
    )
  );

-- Index for tenant_usage
create index if not exists idx_tenant_usage_tenant on tenant_usage(tenant_id);
create index if not exists idx_tenant_usage_period on tenant_usage(period_start);

-- ═══════════════════════════════════════════════════════════════════════════
-- Additional indexes for tenant tables (if not exists)
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_tenants_slug on tenants(slug);
create index if not exists idx_tenants_status on tenants(status);
create index if not exists idx_tenant_domains_domain on tenant_domains(domain);
create index if not exists idx_tenant_domains_tenant on tenant_domains(tenant_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Ensure RLS is enabled on tenant tables
-- ═══════════════════════════════════════════════════════════════════════════

alter table tenants enable row level security;
alter table tenant_domains enable row level security;
alter table tenant_billing enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Users can view their own tenant" on tenants;
drop policy if exists "Users can view their tenant domains" on tenant_domains;
drop policy if exists "Owners can view tenant billing" on tenant_billing;

-- Tenants: Users can only see their own tenant
create policy "Users can view their own tenant"
  on tenants for select
  using (
    id in (
      select tenant_id from "709_profiles" where id = auth.uid()
    )
  );

-- Tenant domains: Users can view domains for their tenant
create policy "Users can view their tenant domains"
  on tenant_domains for select
  using (
    tenant_id in (
      select tenant_id from "709_profiles" where id = auth.uid()
    )
  );

-- Tenant billing: Only owners can view billing
create policy "Owners can view tenant billing"
  on tenant_billing for select
  using (
    tenant_id in (
      select tenant_id from "709_profiles" where id = auth.uid() and role = 'owner'
    )
  );
