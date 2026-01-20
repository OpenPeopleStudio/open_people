-- ════════════════════════════════════════════════════════════════════════════
-- AI Worker Jobs
-- Durable async run queue for long-running LLM calls
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists ai_worker_jobs (
  id uuid primary key default gen_random_uuid(),

  -- ownership
  owner_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete set null,

  -- job identity
  worker_id text not null,
  job_type text not null default 'run', -- e.g. week_plan, ops_propose

  -- state
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  locked_at timestamptz,
  locked_by text,

  -- payloads
  input jsonb not null default '{}',
  result jsonb,
  error_message text,

  -- optional link to ai_runs trace row
  ai_run_id uuid references ai_runs(id) on delete set null,

  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_ai_worker_jobs_owner on ai_worker_jobs(owner_id, created_at desc);
create index if not exists idx_ai_worker_jobs_tenant on ai_worker_jobs(tenant_id, created_at desc);
create index if not exists idx_ai_worker_jobs_status on ai_worker_jobs(status, created_at desc);
create index if not exists idx_ai_worker_jobs_worker on ai_worker_jobs(worker_id, created_at desc);

-- updated_at trigger
create or replace function update_ai_worker_jobs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ai_worker_jobs_updated_at on ai_worker_jobs;
create trigger ai_worker_jobs_updated_at
  before update on ai_worker_jobs
  for each row execute function update_ai_worker_jobs_updated_at();

-- RLS
alter table ai_worker_jobs enable row level security;

drop policy if exists "Users can view own ai worker jobs" on ai_worker_jobs;
create policy "Users can view own ai worker jobs"
  on ai_worker_jobs for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can insert own ai worker jobs" on ai_worker_jobs;
create policy "Users can insert own ai worker jobs"
  on ai_worker_jobs for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own ai worker jobs" on ai_worker_jobs;
create policy "Users can update own ai worker jobs"
  on ai_worker_jobs for update
  using (auth.uid() = owner_id);

-- Service role bypass (runner updates)
drop policy if exists "Service role full access to ai worker jobs" on ai_worker_jobs;
create policy "Service role full access to ai worker jobs"
  on ai_worker_jobs for all
  using (auth.jwt() ->> 'role' = 'service_role');

