-- ════════════════════════════════════════════════════════════════════════════
-- Token + Vibe Currency
-- Track token in/out and maintain a tenant-scoped vibe balance
-- ════════════════════════════════════════════════════════════════════════════

-- Allow fractional vibe deltas
alter table vibe_events
  alter column value type numeric
  using value::numeric;

-- Vibe balance per tenant
create table if not exists company_vibe_balances (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  balance numeric not null default 100,
  updated_at timestamptz default now()
);

create index if not exists idx_company_vibe_balances_updated
  on company_vibe_balances(updated_at desc);

-- Token events (in/out)
create table if not exists token_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid references auth.users(id),
  direction text not null,
  token_count integer not null,
  raw_vibe_delta numeric default 0,
  source text not null default 'unknown',
  created_at timestamptz default now()
);

create index if not exists idx_token_events_tenant_created
  on token_events(tenant_id, created_at desc);

create index if not exists idx_token_events_tenant_direction
  on token_events(tenant_id, direction, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table company_vibe_balances enable row level security;
alter table token_events enable row level security;

drop policy if exists "Tenant can view vibe balance" on company_vibe_balances;
create policy "Tenant can view vibe balance"
  on company_vibe_balances for select
  using (
    tenant_id = public.current_user_tenant_id()
    or public.is_super_admin()
  );

drop policy if exists "Tenant can update vibe balance" on company_vibe_balances;
create policy "Tenant can update vibe balance"
  on company_vibe_balances for all
  using (
    tenant_id = public.current_user_tenant_id()
    or public.is_super_admin()
  )
  with check (
    tenant_id = public.current_user_tenant_id()
    or public.is_super_admin()
  );

drop policy if exists "Tenant can view token events" on token_events;
create policy "Tenant can view token events"
  on token_events for select
  using (
    tenant_id = public.current_user_tenant_id()
    or public.is_super_admin()
  );

drop policy if exists "Tenant can create token events" on token_events;
create policy "Tenant can create token events"
  on token_events for insert
  with check (
    tenant_id = public.current_user_tenant_id()
    or public.is_super_admin()
  );
