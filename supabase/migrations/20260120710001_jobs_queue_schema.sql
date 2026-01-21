-- ════════════════════════════════════════════════════════════════════════════
-- Generalized Jobs Queue Schema
-- Builds on the ai_worker_jobs pattern for any async background work
-- ════════════════════════════════════════════════════════════════════════════

-- Generic jobs table for any background work
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  
  -- Job identity
  queue text not null default 'default',
  job_type text not null,
  
  -- Ownership
  tenant_id uuid references tenants(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  
  -- Priority (higher = run sooner)
  priority integer not null default 0,
  
  -- Status
  status text not null default 'pending' 
    check (status in ('pending', 'running', 'completed', 'failed', 'cancelled', 'dlq')),
  
  -- Locking for concurrent workers
  locked_at timestamptz,
  locked_by text,
  
  -- Payloads
  input jsonb not null default '{}',
  result jsonb,
  error_message text,
  
  -- Retry configuration
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  retry_backoff_seconds integer not null default 30,
  next_retry_at timestamptz,
  
  -- Idempotency
  idempotency_key text,
  
  -- Scheduling
  scheduled_for timestamptz, -- Run at specific time (null = ASAP)
  timeout_seconds integer not null default 600,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Constraints
  constraint jobs_idempotency_unique unique (queue, idempotency_key)
);

-- Indexes for efficient job claiming
create index if not exists idx_jobs_queue_pending 
  on jobs(queue, priority desc, created_at) 
  where status = 'pending';

create index if not exists idx_jobs_queue_scheduled 
  on jobs(scheduled_for, priority desc) 
  where status = 'pending' and scheduled_for is not null;

create index if not exists idx_jobs_retry 
  on jobs(next_retry_at) 
  where status = 'failed' and retry_count < max_retries;

create index if not exists idx_jobs_tenant 
  on jobs(tenant_id, created_at desc);

create index if not exists idx_jobs_owner 
  on jobs(owner_id, created_at desc);

create index if not exists idx_jobs_stale_locks 
  on jobs(locked_at) 
  where status = 'running';

-- Updated_at trigger
create or replace function update_jobs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists jobs_updated_at on jobs;
create trigger jobs_updated_at
  before update on jobs
  for each row execute function update_jobs_updated_at();


-- ════════════════════════════════════════════════════════════════════════════
-- Job Rate Limits (per tenant per queue)
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists job_tenant_limits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  queue text not null default 'default',
  
  -- Concurrency
  max_concurrent integer not null default 5,
  current_running integer not null default 0,
  
  -- Rate limiting
  max_per_minute integer not null default 60,
  count_this_minute integer not null default 0,
  minute_window_start timestamptz not null default now(),
  
  -- Throttling
  is_throttled boolean not null default false,
  throttled_until timestamptz,
  throttle_reason text,
  
  updated_at timestamptz not null default now(),
  
  unique(tenant_id, queue)
);

create index if not exists idx_job_tenant_limits_lookup 
  on job_tenant_limits(tenant_id, queue);


-- ════════════════════════════════════════════════════════════════════════════
-- Job DLQ
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists job_dlq (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  
  -- Denormalized for querying
  queue text not null,
  job_type text not null,
  tenant_id uuid references tenants(id) on delete cascade,
  input jsonb not null,
  
  -- Failure info
  final_error text not null,
  total_attempts integer not null,
  
  -- Replay
  can_replay boolean not null default true,
  replayed_at timestamptz,
  replay_job_id uuid references jobs(id) on delete set null,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_job_dlq_tenant 
  on job_dlq(tenant_id, created_at desc);

create index if not exists idx_job_dlq_queue 
  on job_dlq(queue, created_at desc);


-- ════════════════════════════════════════════════════════════════════════════
-- Claim Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Claim next job from a queue, respecting tenant limits
create or replace function claim_next_job(
  p_queue text,
  p_runner_id text,
  p_lock_timeout_seconds integer default 600
)
returns jobs
language plpgsql
security definer
as $$
declare
  v_job jobs;
  v_limit job_tenant_limits;
begin
  -- Find and lock a claimable job
  with candidate as (
    select j.id, j.tenant_id
    from jobs j
    left join job_tenant_limits tl 
      on j.tenant_id = tl.tenant_id and tl.queue = p_queue
    where
      j.queue = p_queue
      and (
        -- Pending and ready to run
        (j.status = 'pending' and (j.scheduled_for is null or j.scheduled_for <= now()))
        -- Or stale lock
        or (
          j.status = 'running'
          and j.locked_at is not null
          and j.locked_at < (now() - make_interval(secs => p_lock_timeout_seconds))
        )
      )
      -- Respect tenant limits
      and (
        tl.tenant_id is null
        or (
          tl.current_running < tl.max_concurrent
          and not tl.is_throttled
        )
      )
    order by j.priority desc, j.created_at asc
    for update of j skip locked
    limit 1
  )
  update jobs
  set
    status = 'running',
    locked_at = now(),
    locked_by = p_runner_id,
    started_at = coalesce(started_at, now()),
    updated_at = now()
  where id = (select id from candidate)
  returning * into v_job;

  -- Increment tenant running count
  if v_job is not null and v_job.tenant_id is not null then
    insert into job_tenant_limits (tenant_id, queue, current_running)
    values (v_job.tenant_id, p_queue, 1)
    on conflict (tenant_id, queue) do update
    set 
      current_running = job_tenant_limits.current_running + 1,
      updated_at = now();
  end if;

  return v_job;
end;
$$;

comment on function claim_next_job(text, text, integer) is
  'Atomically claim the next job from a queue, respecting tenant concurrency limits.';


-- Claim multiple jobs (for batch processing)
create or replace function claim_jobs_batch(
  p_queue text,
  p_runner_id text,
  p_batch_size integer default 10,
  p_lock_timeout_seconds integer default 600
)
returns setof jobs
language plpgsql
security definer
as $$
begin
  return query
  with candidates as (
    select j.id
    from jobs j
    left join job_tenant_limits tl 
      on j.tenant_id = tl.tenant_id and tl.queue = p_queue
    where
      j.queue = p_queue
      and (
        (j.status = 'pending' and (j.scheduled_for is null or j.scheduled_for <= now()))
        or (
          j.status = 'running'
          and j.locked_at < (now() - make_interval(secs => p_lock_timeout_seconds))
        )
      )
      and (
        tl.tenant_id is null
        or (tl.current_running < tl.max_concurrent and not tl.is_throttled)
      )
    order by j.priority desc, j.created_at asc
    for update of j skip locked
    limit p_batch_size
  ),
  claimed as (
    update jobs
    set
      status = 'running',
      locked_at = now(),
      locked_by = p_runner_id,
      started_at = coalesce(started_at, now()),
      updated_at = now()
    where id in (select id from candidates)
    returning *
  )
  select * from claimed;
end;
$$;


-- Claim retry-ready jobs
create or replace function claim_retry_jobs(
  p_queue text,
  p_runner_id text,
  p_batch_size integer default 10
)
returns setof jobs
language plpgsql
security definer
as $$
begin
  return query
  with retryable as (
    select id
    from jobs
    where 
      queue = p_queue
      and status = 'failed'
      and retry_count < max_retries
      and (next_retry_at is null or next_retry_at <= now())
    order by next_retry_at asc nulls first, created_at asc
    for update skip locked
    limit p_batch_size
  ),
  claimed as (
    update jobs
    set 
      status = 'running',
      locked_at = now(),
      locked_by = p_runner_id,
      retry_count = retry_count + 1,
      started_at = now(),
      updated_at = now()
    where id in (select id from retryable)
    returning *
  )
  select * from claimed;
end;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- Job Completion Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Enqueue a new job
create or replace function enqueue_job(
  p_queue text,
  p_job_type text,
  p_input jsonb,
  p_tenant_id uuid default null,
  p_owner_id uuid default null,
  p_priority integer default 0,
  p_idempotency_key text default null,
  p_scheduled_for timestamptz default null,
  p_max_retries integer default 3,
  p_timeout_seconds integer default 600
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_job_id uuid;
begin
  -- Check idempotency
  if p_idempotency_key is not null then
    select id into v_job_id
    from jobs
    where queue = p_queue and idempotency_key = p_idempotency_key;
    
    if v_job_id is not null then
      return v_job_id;
    end if;
  end if;

  -- Insert job
  insert into jobs (
    queue,
    job_type,
    tenant_id,
    owner_id,
    priority,
    input,
    idempotency_key,
    scheduled_for,
    max_retries,
    timeout_seconds
  ) values (
    p_queue,
    p_job_type,
    p_tenant_id,
    p_owner_id,
    p_priority,
    p_input,
    p_idempotency_key,
    p_scheduled_for,
    p_max_retries,
    p_timeout_seconds
  )
  returning id into v_job_id;

  return v_job_id;
end;
$$;

comment on function enqueue_job is
  'Enqueue a new job with optional idempotency key and scheduling.';


-- Complete a job successfully
create or replace function complete_job(
  p_job_id uuid,
  p_result jsonb default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_job jobs;
begin
  select * into v_job from jobs where id = p_job_id;
  
  if v_job is null then
    return;
  end if;

  -- Update job status
  update jobs
  set
    status = 'completed',
    result = p_result,
    completed_at = now(),
    updated_at = now()
  where id = p_job_id;

  -- Decrement tenant running count
  if v_job.tenant_id is not null then
    update job_tenant_limits
    set 
      current_running = greatest(0, current_running - 1),
      updated_at = now()
    where tenant_id = v_job.tenant_id and queue = v_job.queue;
  end if;
end;
$$;


-- Fail a job with optional DLQ
create or replace function fail_job(
  p_job_id uuid,
  p_error text,
  p_move_to_dlq boolean default false
)
returns void
language plpgsql
security definer
as $$
declare
  v_job jobs;
  v_next_retry timestamptz;
begin
  select * into v_job from jobs where id = p_job_id;
  
  if v_job is null then
    return;
  end if;

  -- Decrement tenant running count
  if v_job.tenant_id is not null then
    update job_tenant_limits
    set 
      current_running = greatest(0, current_running - 1),
      updated_at = now()
    where tenant_id = v_job.tenant_id and queue = v_job.queue;
  end if;

  -- Check if should move to DLQ
  if p_move_to_dlq or v_job.retry_count >= v_job.max_retries then
    -- Move to DLQ
    insert into job_dlq (
      job_id,
      queue,
      job_type,
      tenant_id,
      input,
      final_error,
      total_attempts
    ) values (
      p_job_id,
      v_job.queue,
      v_job.job_type,
      v_job.tenant_id,
      v_job.input,
      p_error,
      v_job.retry_count + 1
    );

    update jobs
    set
      status = 'dlq',
      error_message = p_error,
      completed_at = now(),
      updated_at = now()
    where id = p_job_id;
  else
    -- Schedule retry with exponential backoff
    v_next_retry := now() + (
      least(3600, v_job.retry_backoff_seconds * power(2, v_job.retry_count)) * interval '1 second'
    );

    update jobs
    set
      status = 'failed',
      error_message = p_error,
      next_retry_at = v_next_retry,
      locked_at = null,
      locked_by = null,
      updated_at = now()
    where id = p_job_id;
  end if;
end;
$$;

comment on function fail_job is
  'Fail a job with exponential backoff retry or move to DLQ.';


-- Replay a job from DLQ
create or replace function replay_dlq_job(
  p_dlq_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_dlq job_dlq;
  v_original jobs;
  v_new_job_id uuid;
begin
  select * into v_dlq from job_dlq where id = p_dlq_id;
  
  if v_dlq is null then
    raise exception 'DLQ entry not found: %', p_dlq_id;
  end if;
  
  if not v_dlq.can_replay then
    raise exception 'Job cannot be replayed: %', p_dlq_id;
  end if;
  
  if v_dlq.replayed_at is not null then
    raise exception 'Job already replayed: %', p_dlq_id;
  end if;

  select * into v_original from jobs where id = v_dlq.job_id;
  
  -- Create new job
  insert into jobs (
    queue,
    job_type,
    tenant_id,
    owner_id,
    priority,
    input,
    max_retries,
    timeout_seconds
  ) values (
    v_original.queue,
    v_original.job_type,
    v_original.tenant_id,
    v_original.owner_id,
    v_original.priority,
    v_original.input,
    v_original.max_retries,
    v_original.timeout_seconds
  )
  returning id into v_new_job_id;

  -- Mark DLQ entry as replayed
  update job_dlq
  set 
    replayed_at = now(),
    replay_job_id = v_new_job_id
  where id = p_dlq_id;

  return v_new_job_id;
end;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ════════════════════════════════════════════════════════════════════════════

alter table jobs enable row level security;
alter table job_tenant_limits enable row level security;
alter table job_dlq enable row level security;

-- Service role has full access
create policy "Service role full access to jobs"
  on jobs for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to job_tenant_limits"
  on job_tenant_limits for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to job_dlq"
  on job_dlq for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Users can view and create their own jobs
create policy "Users can view own jobs"
  on jobs for select
  using (auth.uid() = owner_id);

create policy "Users can insert own jobs"
  on jobs for insert
  with check (auth.uid() = owner_id);

-- Tenant admins can view tenant jobs
create policy "Tenant admins can view tenant jobs"
  on jobs for select
  using (
    tenant_id = (
      select p.tenant_id 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.role in ('admin', 'owner')
    )
  );

create policy "Tenant admins can view tenant DLQ"
  on job_dlq for select
  using (
    tenant_id = (
      select p.tenant_id 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.role in ('admin', 'owner')
    )
  );

-- Super admins can view all
create policy "Super admins can view all jobs"
  on jobs for select
  using (is_super_admin());

create policy "Super admins can view all DLQ"
  on job_dlq for select
  using (is_super_admin());
