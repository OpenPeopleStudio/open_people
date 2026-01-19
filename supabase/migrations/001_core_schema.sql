-- ═══════════════════════════════════════════════════════════════════════════
-- OpenPeople.ai Core Schema
-- Multi-tenant SaaS foundation
-- ═══════════════════════════════════════════════════════════════════════════

-- Tenants table
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  primary_domain text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tenant domains (for custom domain support)
create table if not exists tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  domain text not null unique,
  is_primary boolean not null default false,
  verified_at timestamptz,
  verification_token text,
  created_at timestamptz default now()
);

-- Tenant billing
create table if not exists tenant_billing (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  plan text not null default 'starter',
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  billing_email text,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  plan_limits jsonb default '{
    "ai_calls_per_month": 1000,
    "storage_gb": 5,
    "team_members": 3
  }'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profiles (linked to auth.users and tenants)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('owner', 'admin', 'staff', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tenant usage tracking (for AI/storage metering)
create table if not exists tenant_usage (
  tenant_id uuid references tenants(id) on delete cascade,
  period_start date not null,
  ai_api_calls integer default 0,
  storage_bytes bigint default 0,
  messages_sent integer default 0,
  primary key (tenant_id, period_start)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_tenants_slug on tenants(slug);
create index if not exists idx_tenants_status on tenants(status);
create index if not exists idx_tenant_domains_domain on tenant_domains(domain);
create index if not exists idx_tenant_domains_tenant on tenant_domains(tenant_id);
create index if not exists idx_profiles_tenant on profiles(tenant_id);
create index if not exists idx_profiles_email on profiles(email);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table tenants enable row level security;
alter table tenant_domains enable row level security;
alter table tenant_billing enable row level security;
alter table profiles enable row level security;
alter table tenant_usage enable row level security;

-- Tenants: Users can only see their own tenant
create policy "Users can view their own tenant"
  on tenants for select
  using (
    id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Tenant domains: Users can view domains for their tenant
create policy "Users can view their tenant domains"
  on tenant_domains for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Tenant billing: Only owners can view billing
create policy "Owners can view tenant billing"
  on tenant_billing for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid() and role = 'owner'
    )
  );

-- Profiles: Users can view profiles in their tenant
create policy "Users can view profiles in their tenant"
  on profiles for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Profiles: Users can update their own profile
create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables
create trigger tenants_updated_at
  before update on tenants
  for each row execute function update_updated_at();

create trigger tenant_billing_updated_at
  before update on tenant_billing
  for each row execute function update_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
