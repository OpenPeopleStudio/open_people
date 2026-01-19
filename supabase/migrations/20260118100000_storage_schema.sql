-- ═══════════════════════════════════════════════════════════════════════════
-- Cloud Storage Add-on Schema
-- Tables for managing tenant storage subscriptions and file metadata
-- ═══════════════════════════════════════════════════════════════════════════

-- Storage subscriptions (which tier each tenant is on)
create table if not exists storage_subscriptions (
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

-- Storage buckets (logical containers for files)
create table if not exists storage_buckets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  is_public boolean default false,
  cors_origins text[] default '{}',
  created_at timestamptz default now(),
  unique(tenant_id, name)
);

-- Storage files (metadata for files stored in R2)
create table if not exists storage_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  bucket_id uuid references storage_buckets(id) on delete cascade not null,
  key text not null, -- full path: folder/subfolder/file.ext
  filename text not null, -- just the filename
  content_type text not null default 'application/octet-stream',
  size bigint not null default 0,
  etag text,
  metadata jsonb default '{}',
  is_public boolean default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz, -- soft delete for versioning
  unique(bucket_id, key)
);

-- Storage usage tracking (per tenant, per period)
create table if not exists storage_usage (
  tenant_id uuid references tenants(id) on delete cascade,
  period_start date not null,
  storage_bytes bigint default 0,
  bandwidth_bytes bigint default 0,
  file_count integer default 0,
  request_count integer default 0,
  updated_at timestamptz default now(),
  primary key (tenant_id, period_start)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_storage_subscriptions_tenant on storage_subscriptions(tenant_id);
create index if not exists idx_storage_buckets_tenant on storage_buckets(tenant_id);
create index if not exists idx_storage_files_tenant on storage_files(tenant_id);
create index if not exists idx_storage_files_bucket on storage_files(bucket_id);
create index if not exists idx_storage_files_key on storage_files(key);
create index if not exists idx_storage_files_deleted on storage_files(deleted_at) where deleted_at is null;
create index if not exists idx_storage_usage_tenant on storage_usage(tenant_id);
create index if not exists idx_storage_usage_period on storage_usage(period_start);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table storage_subscriptions enable row level security;
alter table storage_buckets enable row level security;
alter table storage_files enable row level security;
alter table storage_usage enable row level security;

-- Subscriptions: Users can view their tenant's subscription
drop policy if exists "Users can view their storage subscription" on storage_subscriptions;
create policy "Users can view their storage subscription"
  on storage_subscriptions for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Buckets: Users can manage their tenant's buckets
drop policy if exists "Users can view their storage buckets" on storage_buckets;
create policy "Users can view their storage buckets"
  on storage_buckets for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Users can create storage buckets" on storage_buckets;
create policy "Users can create storage buckets"
  on storage_buckets for insert
  with check (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Users can update their storage buckets" on storage_buckets;
create policy "Users can update their storage buckets"
  on storage_buckets for update
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Users can delete their storage buckets" on storage_buckets;
create policy "Users can delete their storage buckets"
  on storage_buckets for delete
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Files: Users can manage their tenant's files
drop policy if exists "Users can view their storage files" on storage_files;
create policy "Users can view their storage files"
  on storage_files for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
    or is_public = true
  );

drop policy if exists "Users can create storage files" on storage_files;
create policy "Users can create storage files"
  on storage_files for insert
  with check (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Users can update their storage files" on storage_files;
create policy "Users can update their storage files"
  on storage_files for update
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Users can delete their storage files" on storage_files;
create policy "Users can delete their storage files"
  on storage_files for delete
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Usage: Users can view their tenant's usage
drop policy if exists "Users can view their storage usage" on storage_usage;
create policy "Users can view their storage usage"
  on storage_usage for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to update storage usage when files change
create or replace function update_storage_usage()
returns trigger as $$
declare
  period date := date_trunc('month', now())::date;
begin
  -- Insert or update usage record
  insert into storage_usage (tenant_id, period_start, storage_bytes, file_count)
  select 
    coalesce(new.tenant_id, old.tenant_id),
    period,
    coalesce(sum(size) filter (where deleted_at is null), 0),
    count(*) filter (where deleted_at is null)
  from storage_files
  where tenant_id = coalesce(new.tenant_id, old.tenant_id)
  on conflict (tenant_id, period_start)
  do update set
    storage_bytes = excluded.storage_bytes,
    file_count = excluded.file_count,
    updated_at = now();
  
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Trigger for file changes
drop trigger if exists storage_files_usage_trigger on storage_files;
create trigger storage_files_usage_trigger
  after insert or update or delete on storage_files
  for each row execute function update_storage_usage();

-- Function to get tenant storage stats
create or replace function get_tenant_storage_stats(p_tenant_id uuid)
returns table (
  total_storage_bytes bigint,
  total_files integer,
  total_buckets integer,
  bandwidth_this_month bigint
) as $$
begin
  return query
  select
    coalesce(sum(f.size) filter (where f.deleted_at is null), 0)::bigint as total_storage_bytes,
    (count(f.id) filter (where f.deleted_at is null))::integer as total_files,
    (select count(*)::integer from storage_buckets where tenant_id = p_tenant_id) as total_buckets,
    coalesce(
      (select bandwidth_bytes from storage_usage 
       where tenant_id = p_tenant_id 
       and period_start = date_trunc('month', now())::date),
      0
    )::bigint as bandwidth_this_month
  from storage_files f
  where f.tenant_id = p_tenant_id;
end;
$$ language plpgsql security definer;
