-- ════════════════════════════════════════════════════════════════════════════
-- Event Outbox Schema
-- Transactional outbox pattern for reliable event dispatch
-- ════════════════════════════════════════════════════════════════════════════

-- Event outbox: stores events to be dispatched asynchronously
create table if not exists event_outbox (
  id uuid primary key default gen_random_uuid(),
  
  -- Event identity
  event_id uuid not null unique default gen_random_uuid(),
  event_type text not null,
  event_version text not null default '1.0.0',
  
  -- Context
  tenant_id uuid references tenants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  correlation_id text,
  causation_id uuid,
  source text not null,
  
  -- Payload
  payload jsonb not null default '{}',
  metadata jsonb,
  
  -- Timing
  occurred_at timestamptz not null default now(),
  
  -- Dispatch state
  status text not null default 'pending' 
    check (status in ('pending', 'processing', 'dispatched', 'failed', 'dlq')),
  retry_count integer not null default 0,
  max_retries integer not null default 5,
  next_retry_at timestamptz,
  last_error text,
  
  -- Idempotency
  idempotency_key text,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dispatched_at timestamptz,
  
  -- Constraints
  constraint event_outbox_idempotency_unique unique (tenant_id, idempotency_key)
);

-- Indexes for efficient dispatch queries
create index if not exists idx_event_outbox_status_pending 
  on event_outbox(status, created_at) 
  where status = 'pending';

create index if not exists idx_event_outbox_status_retry 
  on event_outbox(next_retry_at) 
  where status = 'failed' and retry_count < max_retries;

create index if not exists idx_event_outbox_tenant 
  on event_outbox(tenant_id, created_at desc);

create index if not exists idx_event_outbox_type 
  on event_outbox(event_type, occurred_at desc);

create index if not exists idx_event_outbox_correlation 
  on event_outbox(correlation_id) 
  where correlation_id is not null;

-- Updated_at trigger
create or replace function update_event_outbox_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists event_outbox_updated_at on event_outbox;
create trigger event_outbox_updated_at
  before update on event_outbox
  for each row execute function update_event_outbox_updated_at();


-- ════════════════════════════════════════════════════════════════════════════
-- Event Dispatch Log
-- Records each dispatch attempt to each sink
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists event_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references event_outbox(id) on delete cascade,
  
  -- Sink info
  sink text not null, -- 'notification', 'webhook', 'audit', 'analytics'
  sink_endpoint text, -- URL or identifier
  
  -- Attempt details
  attempt_number integer not null default 1,
  
  -- Result
  success boolean not null,
  status_code integer,
  response_body text,
  error_message text,
  
  -- Timing
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  latency_ms integer,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_event_dispatch_log_outbox 
  on event_dispatch_log(outbox_id, created_at desc);

create index if not exists idx_event_dispatch_log_sink 
  on event_dispatch_log(sink, created_at desc);

create index if not exists idx_event_dispatch_log_failed 
  on event_dispatch_log(sink, created_at desc) 
  where success = false;


-- ════════════════════════════════════════════════════════════════════════════
-- Event Dead Letter Queue
-- Events that exhausted retries or had fatal errors
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists event_dlq (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references event_outbox(id) on delete cascade,
  
  -- Denormalized event info for easier querying
  event_type text not null,
  tenant_id uuid references tenants(id) on delete cascade,
  payload jsonb not null,
  
  -- Failure info
  final_error text not null,
  total_attempts integer not null,
  failed_sinks text[] not null default '{}',
  
  -- Replay
  can_replay boolean not null default true,
  replayed_at timestamptz,
  replay_outbox_id uuid references event_outbox(id) on delete set null,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_event_dlq_tenant 
  on event_dlq(tenant_id, created_at desc);

create index if not exists idx_event_dlq_type 
  on event_dlq(event_type, created_at desc);

create index if not exists idx_event_dlq_replay 
  on event_dlq(created_at desc) 
  where can_replay = true and replayed_at is null;


-- ════════════════════════════════════════════════════════════════════════════
-- Event Sink Configuration
-- Per-tenant routing configuration for event sinks
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists event_sink_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Sink configuration
  sink text not null, -- 'notification', 'webhook', 'audit', 'analytics'
  enabled boolean not null default true,
  
  -- Filtering
  event_types text[] not null default '{}', -- Empty = all events
  filter jsonb, -- Additional filter criteria
  
  -- Sink-specific config
  config jsonb not null default '{}',
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  unique(tenant_id, sink)
);

create index if not exists idx_event_sink_config_tenant 
  on event_sink_config(tenant_id);


-- ════════════════════════════════════════════════════════════════════════════
-- Tenant Concurrency Limits
-- Per-tenant rate limiting for event dispatch
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists event_tenant_limits (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  
  -- Concurrency limits
  max_concurrent_dispatches integer not null default 10,
  current_dispatches integer not null default 0,
  
  -- Rate limits (per minute)
  max_events_per_minute integer not null default 1000,
  events_this_minute integer not null default 0,
  minute_window_start timestamptz not null default now(),
  
  -- Backpressure
  is_throttled boolean not null default false,
  throttled_until timestamptz,
  
  updated_at timestamptz not null default now()
);


-- ════════════════════════════════════════════════════════════════════════════
-- Helper Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Enqueue an event within a transaction
create or replace function enqueue_event(
  p_event_type text,
  p_payload jsonb,
  p_tenant_id uuid default null,
  p_actor_id uuid default null,
  p_source text default 'api',
  p_correlation_id text default null,
  p_causation_id uuid default null,
  p_idempotency_key text default null,
  p_metadata jsonb default null,
  p_event_version text default '1.0.0'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_event_id uuid;
begin
  -- Check idempotency
  if p_idempotency_key is not null then
    select event_id into v_event_id
    from event_outbox
    where tenant_id is not distinct from p_tenant_id
      and idempotency_key = p_idempotency_key;
    
    if v_event_id is not null then
      return v_event_id;
    end if;
  end if;

  -- Insert event
  insert into event_outbox (
    event_type,
    event_version,
    tenant_id,
    actor_id,
    source,
    correlation_id,
    causation_id,
    payload,
    metadata,
    idempotency_key,
    occurred_at
  ) values (
    p_event_type,
    p_event_version,
    p_tenant_id,
    p_actor_id,
    p_source,
    p_correlation_id,
    p_causation_id,
    p_payload,
    p_metadata,
    p_idempotency_key,
    now()
  )
  returning event_id into v_event_id;

  return v_event_id;
end;
$$;

comment on function enqueue_event is 
  'Enqueue an event to the outbox within the current transaction. Supports idempotency via key.';


-- Claim events for dispatch (with tenant concurrency limits)
create or replace function claim_pending_events(
  p_dispatcher_id text,
  p_batch_size integer default 100,
  p_lock_timeout_seconds integer default 300
)
returns setof event_outbox
language plpgsql
security definer
as $$
begin
  return query
  with claimable as (
    select o.id
    from event_outbox o
    left join event_tenant_limits tl on o.tenant_id = tl.tenant_id
    where
      o.status = 'pending'
      -- Respect tenant concurrency limits
      and (
        tl.tenant_id is null 
        or (
          tl.current_dispatches < tl.max_concurrent_dispatches
          and not tl.is_throttled
        )
      )
    order by o.created_at asc
    for update of o skip locked
    limit p_batch_size
  ),
  claimed as (
    update event_outbox
    set 
      status = 'processing',
      updated_at = now()
    where id in (select id from claimable)
    returning *
  )
  select * from claimed;
end;
$$;

comment on function claim_pending_events is
  'Atomically claim a batch of pending events for dispatch, respecting tenant concurrency limits.';


-- Claim failed events ready for retry
create or replace function claim_retry_events(
  p_dispatcher_id text,
  p_batch_size integer default 50
)
returns setof event_outbox
language plpgsql
security definer
as $$
begin
  return query
  with retryable as (
    select id
    from event_outbox
    where 
      status = 'failed'
      and retry_count < max_retries
      and (next_retry_at is null or next_retry_at <= now())
    order by next_retry_at asc nulls first, created_at asc
    for update skip locked
    limit p_batch_size
  ),
  claimed as (
    update event_outbox
    set 
      status = 'processing',
      retry_count = retry_count + 1,
      updated_at = now()
    where id in (select id from retryable)
    returning *
  )
  select * from claimed;
end;
$$;

comment on function claim_retry_events is
  'Atomically claim failed events ready for retry.';


-- Mark event as dispatched
create or replace function mark_event_dispatched(
  p_outbox_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update event_outbox
  set 
    status = 'dispatched',
    dispatched_at = now(),
    updated_at = now()
  where id = p_outbox_id;
end;
$$;


-- Mark event as failed with retry scheduling
create or replace function mark_event_failed(
  p_outbox_id uuid,
  p_error text,
  p_move_to_dlq boolean default false
)
returns void
language plpgsql
security definer
as $$
declare
  v_event event_outbox;
  v_next_retry timestamptz;
begin
  select * into v_event from event_outbox where id = p_outbox_id;
  
  if v_event is null then
    return;
  end if;

  if p_move_to_dlq or v_event.retry_count >= v_event.max_retries then
    -- Move to DLQ
    insert into event_dlq (
      outbox_id,
      event_type,
      tenant_id,
      payload,
      final_error,
      total_attempts
    ) values (
      p_outbox_id,
      v_event.event_type,
      v_event.tenant_id,
      v_event.payload,
      p_error,
      v_event.retry_count + 1
    );

    update event_outbox
    set 
      status = 'dlq',
      last_error = p_error,
      updated_at = now()
    where id = p_outbox_id;
  else
    -- Schedule retry with exponential backoff
    -- Base: 5 seconds, max: 5 minutes
    v_next_retry := now() + (
      least(300, 5 * power(2, v_event.retry_count)) * interval '1 second'
    );

    update event_outbox
    set 
      status = 'failed',
      last_error = p_error,
      next_retry_at = v_next_retry,
      updated_at = now()
    where id = p_outbox_id;
  end if;
end;
$$;

comment on function mark_event_failed is
  'Mark an event as failed with optional DLQ move and exponential backoff retry scheduling.';


-- Replay event from DLQ
create or replace function replay_dlq_event(
  p_dlq_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_dlq event_dlq;
  v_original event_outbox;
  v_new_event_id uuid;
begin
  select * into v_dlq from event_dlq where id = p_dlq_id;
  
  if v_dlq is null then
    raise exception 'DLQ entry not found: %', p_dlq_id;
  end if;
  
  if not v_dlq.can_replay then
    raise exception 'Event cannot be replayed: %', p_dlq_id;
  end if;
  
  if v_dlq.replayed_at is not null then
    raise exception 'Event already replayed: %', p_dlq_id;
  end if;

  select * into v_original from event_outbox where id = v_dlq.outbox_id;
  
  -- Create new outbox entry
  insert into event_outbox (
    event_type,
    event_version,
    tenant_id,
    actor_id,
    source,
    correlation_id,
    causation_id,
    payload,
    metadata,
    occurred_at,
    status
  ) values (
    v_original.event_type,
    v_original.event_version,
    v_original.tenant_id,
    v_original.actor_id,
    v_original.source,
    v_original.correlation_id,
    v_original.causation_id,
    v_original.payload,
    v_original.metadata,
    v_original.occurred_at,
    'pending'
  )
  returning event_id into v_new_event_id;

  -- Mark DLQ entry as replayed
  update event_dlq
  set 
    replayed_at = now(),
    replay_outbox_id = (select id from event_outbox where event_id = v_new_event_id)
  where id = p_dlq_id;

  return v_new_event_id;
end;
$$;

comment on function replay_dlq_event is
  'Replay a DLQ event by creating a new outbox entry.';


-- ════════════════════════════════════════════════════════════════════════════
-- Statistics View
-- ════════════════════════════════════════════════════════════════════════════

create or replace view event_outbox_stats as
select
  tenant_id,
  event_type,
  status,
  count(*) as count,
  min(created_at) as oldest,
  max(created_at) as newest,
  avg(retry_count)::numeric(5,2) as avg_retries
from event_outbox
where created_at > now() - interval '24 hours'
group by tenant_id, event_type, status;

comment on view event_outbox_stats is
  'Aggregated event outbox statistics for the last 24 hours.';


-- ════════════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ════════════════════════════════════════════════════════════════════════════

alter table event_outbox enable row level security;
alter table event_dispatch_log enable row level security;
alter table event_dlq enable row level security;
alter table event_sink_config enable row level security;
alter table event_tenant_limits enable row level security;

-- Service role has full access (for dispatcher workers)
create policy "Service role full access to event_outbox"
  on event_outbox for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to event_dispatch_log"
  on event_dispatch_log for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to event_dlq"
  on event_dlq for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to event_sink_config"
  on event_sink_config for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to event_tenant_limits"
  on event_tenant_limits for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Tenant admins can view their own event data
create policy "Tenant admins can view own events"
  on event_outbox for select
  using (
    tenant_id is not null
    and tenant_id = (
      select p.tenant_id 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.role in ('admin', 'owner')
    )
  );

create policy "Tenant admins can view own dispatch logs"
  on event_dispatch_log for select
  using (
    exists (
      select 1 
      from event_outbox o
      join "709_profiles" p on p.tenant_id = o.tenant_id
      where o.id = event_dispatch_log.outbox_id
      and p.id = auth.uid()
      and p.role in ('admin', 'owner')
    )
  );

create policy "Tenant admins can view own DLQ"
  on event_dlq for select
  using (
    tenant_id is not null
    and tenant_id = (
      select p.tenant_id 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.role in ('admin', 'owner')
    )
  );

create policy "Tenant admins can manage sink config"
  on event_sink_config for all
  using (
    tenant_id = (
      select p.tenant_id 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.role in ('admin', 'owner')
    )
  );

-- Super admins can view all
create policy "Super admins can view all events"
  on event_outbox for select
  using (
    exists (
      select 1 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.is_super_admin = true
    )
  );

create policy "Super admins can view all dispatch logs"
  on event_dispatch_log for select
  using (
    exists (
      select 1 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.is_super_admin = true
    )
  );

create policy "Super admins can view all DLQ"
  on event_dlq for select
  using (
    exists (
      select 1 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.is_super_admin = true
    )
  );
