-- ═══════════════════════════════════════════════════════════════════════════
-- Experimentation & Feature Flags Schema
-- Tables for A/B testing, feature flags, and user experimentation
-- ═══════════════════════════════════════════════════════════════════════════

-- Experiment subscriptions
create table if not exists experiment_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  tier text not null default 'free' check (tier in ('free', 'starter', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'trialing', 'canceled', 'past_due')),
  stripe_subscription_id text,
  current_period_start timestamptz default now(),
  current_period_end timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id)
);

-- Audiences (targeting rules)
create table if not exists audiences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  description text,
  rules jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Experiments
create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  key text not null,
  description text,
  type text not null default 'ab_test' check (type in ('ab_test', 'multivariate', 'feature_flag')),
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'archived')),
  rollout_percentage integer not null default 100 check (rollout_percentage >= 0 and rollout_percentage <= 100),
  audience_id uuid references audiences(id) on delete set null,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, key)
);

-- Experiment variants
create table if not exists experiment_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references experiments(id) on delete cascade not null,
  name text not null,
  key text not null,
  description text,
  weight integer not null default 50 check (weight >= 0 and weight <= 100),
  is_control boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Feature flags
create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  key text not null,
  description text,
  enabled boolean default false,
  rollout_percentage integer not null default 100 check (rollout_percentage >= 0 and rollout_percentage <= 100),
  audience_id uuid references audiences(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, key)
);

-- Exposure events
create table if not exists exposure_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  experiment_id uuid references experiments(id) on delete cascade,
  flag_id uuid references feature_flags(id) on delete cascade,
  variant_id uuid references experiment_variants(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  session_id text,
  attributes jsonb default '{}',
  created_at timestamptz default now()
);

-- Conversion events
create table if not exists conversion_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  experiment_id uuid references experiments(id) on delete cascade not null,
  variant_id uuid references experiment_variants(id) on delete set null not null,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  event_value numeric,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Experiment usage tracking
create table if not exists experiment_usage (
  tenant_id uuid references tenants(id) on delete cascade,
  period_start date not null,
  active_experiments integer default 0,
  active_flags integer default 0,
  total_exposures integer default 0,
  total_conversions integer default 0,
  updated_at timestamptz default now(),
  primary key (tenant_id, period_start)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_experiment_subscriptions_tenant on experiment_subscriptions(tenant_id);
create index if not exists idx_audiences_tenant on audiences(tenant_id);
create index if not exists idx_experiments_tenant on experiments(tenant_id);
create index if not exists idx_experiments_status on experiments(status);
create index if not exists idx_experiments_key on experiments(tenant_id, key);
create index if not exists idx_experiment_variants_experiment on experiment_variants(experiment_id);
create index if not exists idx_feature_flags_tenant on feature_flags(tenant_id);
create index if not exists idx_feature_flags_key on feature_flags(tenant_id, key);
create index if not exists idx_feature_flags_enabled on feature_flags(enabled);
create index if not exists idx_exposure_events_tenant on exposure_events(tenant_id);
create index if not exists idx_exposure_events_experiment on exposure_events(experiment_id);
create index if not exists idx_exposure_events_flag on exposure_events(flag_id);
create index if not exists idx_exposure_events_user on exposure_events(user_id);
create index if not exists idx_exposure_events_anon on exposure_events(anonymous_id);
create index if not exists idx_exposure_events_created on exposure_events(created_at);
create index if not exists idx_conversion_events_tenant on conversion_events(tenant_id);
create index if not exists idx_conversion_events_experiment on conversion_events(experiment_id);
create index if not exists idx_conversion_events_variant on conversion_events(variant_id);
create index if not exists idx_experiment_usage_tenant on experiment_usage(tenant_id);
create index if not exists idx_experiment_usage_period on experiment_usage(period_start);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table experiment_subscriptions enable row level security;
alter table audiences enable row level security;
alter table experiments enable row level security;
alter table experiment_variants enable row level security;
alter table feature_flags enable row level security;
alter table exposure_events enable row level security;
alter table conversion_events enable row level security;
alter table experiment_usage enable row level security;

-- Subscriptions
drop policy if exists "Users can view their experiment subscription" on experiment_subscriptions;
create policy "Users can view their experiment subscription"
  on experiment_subscriptions for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Audiences
drop policy if exists "Users can manage their audiences" on audiences;
create policy "Users can manage their audiences"
  on audiences for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Experiments
drop policy if exists "Users can manage their experiments" on experiments;
create policy "Users can manage their experiments"
  on experiments for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Experiment variants
drop policy if exists "Users can manage experiment variants" on experiment_variants;
create policy "Users can manage experiment variants"
  on experiment_variants for all
  using (
    experiment_id in (
      select id from experiments where tenant_id in (
        select tenant_id from profiles where id = auth.uid()
      )
    )
  );

-- Feature flags
drop policy if exists "Users can manage their feature flags" on feature_flags;
create policy "Users can manage their feature flags"
  on feature_flags for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Exposure events (read-only for users, insert via API)
drop policy if exists "Users can view their exposure events" on exposure_events;
create policy "Users can view their exposure events"
  on exposure_events for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Conversion events (read-only for users, insert via API)
drop policy if exists "Users can view their conversion events" on conversion_events;
create policy "Users can view their conversion events"
  on conversion_events for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Usage
drop policy if exists "Users can view their experiment usage" on experiment_usage;
create policy "Users can view their experiment usage"
  on experiment_usage for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to get experiment stats
create or replace function get_experiment_stats(p_experiment_id uuid)
returns table (
  variant_id uuid,
  variant_key text,
  exposures bigint,
  conversions bigint,
  conversion_rate numeric,
  unique_users bigint
) as $$
begin
  return query
  select
    v.id as variant_id,
    v.key as variant_key,
    count(distinct e.id) as exposures,
    count(distinct c.id) as conversions,
    case 
      when count(distinct e.id) > 0 
      then round((count(distinct c.id)::numeric / count(distinct e.id)::numeric) * 100, 2)
      else 0 
    end as conversion_rate,
    count(distinct coalesce(e.user_id::text, e.anonymous_id)) as unique_users
  from experiment_variants v
  left join exposure_events e on e.variant_id = v.id
  left join conversion_events c on c.variant_id = v.id
  where v.experiment_id = p_experiment_id
  group by v.id, v.key
  order by v.created_at;
end;
$$ language plpgsql security definer;

-- Function to increment experiment usage
create or replace function increment_experiment_usage(
  p_tenant_id uuid,
  p_period_start date,
  p_field text,
  p_increment integer default 1
)
returns void as $$
begin
  insert into experiment_usage (tenant_id, period_start)
  values (p_tenant_id, p_period_start)
  on conflict (tenant_id, period_start) do nothing;
  
  execute format(
    'update experiment_usage set %I = %I + $1, updated_at = now() where tenant_id = $2 and period_start = $3',
    p_field, p_field
  ) using p_increment, p_tenant_id, p_period_start;
end;
$$ language plpgsql security definer;
