-- ════════════════════════════════════════════════════════════════════════════
-- Company Vibes + Lexicon
-- Per-tenant lexicon entries that can trigger vibe events
-- ════════════════════════════════════════════════════════════════════════════

-- Lexicon entries
create table if not exists company_lexicon_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  pattern text not null,
  match_kind text not null,
  meaning text,
  trigger_type text not null default 'vibe',
  trigger_payload jsonb default '{}',
  is_active boolean default true,
  is_case_sensitive boolean default false,
  priority integer default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_company_lexicon_tenant_active
  on company_lexicon_entries(tenant_id, is_active, priority desc);

create index if not exists idx_company_lexicon_tenant_created
  on company_lexicon_entries(tenant_id, created_at desc);

-- Vibe events (positive feedback)
create table if not exists vibe_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  created_by uuid references auth.users(id),
  source text not null default 'manual',
  lexicon_entry_id uuid references company_lexicon_entries(id) on delete set null,
  note text,
  value integer default 1,
  created_at timestamptz default now()
);

create index if not exists idx_vibe_events_tenant_created
  on vibe_events(tenant_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table company_lexicon_entries enable row level security;
alter table vibe_events enable row level security;

drop policy if exists "Tenant can manage lexicon entries" on company_lexicon_entries;
create policy "Tenant can manage lexicon entries"
  on company_lexicon_entries for all
  using (
    tenant_id = public.current_user_tenant_id()
    or public.is_super_admin()
  )
  with check (
    (
      tenant_id = public.current_user_tenant_id()
      and (created_by = auth.uid() or created_by is null)
    )
    or public.is_super_admin()
  );

drop policy if exists "Tenant can manage vibe events" on vibe_events;
create policy "Tenant can manage vibe events"
  on vibe_events for all
  using (
    tenant_id = public.current_user_tenant_id()
    or public.is_super_admin()
  )
  with check (
    (
      tenant_id = public.current_user_tenant_id()
      and (created_by = auth.uid() or created_by is null)
    )
    or public.is_super_admin()
  );
