-- Job Queue System Migration
-- Adds comprehensive job queue infrastructure for event-driven processing

-- Create job_queue table
create table if not exists job_queue (
  id text primary key,
  type text not null,
  priority integer not null default 1,
  data jsonb not null default '{}',
  status text not null default 'pending',
  max_retries integer not null default 3,
  retry_count integer not null default 0,
  next_run_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  result jsonb,
  created_by text,
  correlation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_job_queue_status on job_queue(status);
create index if not exists idx_job_queue_next_run on job_queue(next_run_at);
create index if not exists idx_job_queue_type on job_queue(type);
create index if not exists idx_job_queue_priority on job_queue(priority desc, created_at asc);
create index if not exists idx_job_queue_correlation on job_queue(correlation_id);

-- Row Level Security
alter table job_queue enable row level security;

-- Policies for job queue access
create policy "Super admins can manage all jobs" on job_queue
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Users can view their own jobs" on job_queue
  for select using (created_by = auth.uid()::text);

-- Job queue statistics view
create or replace view job_queue_stats as
select
  status,
  count(*) as count,
  avg(extract(epoch from (completed_at - started_at))) as avg_duration_seconds,
  min(created_at) as oldest_pending,
  max(updated_at) as last_updated
from job_queue
where status in ('pending', 'processing', 'completed', 'failed')
group by status;

-- Function to clean up old completed jobs
create or replace function cleanup_old_jobs(days_old integer default 30)
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from job_queue
  where status in ('completed', 'failed')
    and created_at < now() - interval '1 day' * days_old;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Function to get job statistics
create or replace function get_job_stats()
returns table (
  status text,
  count bigint,
  avg_duration_seconds numeric,
  oldest_pending timestamptz,
  last_updated timestamptz
)
language sql
as $$
  select * from job_queue_stats;
$$;

-- Comments
comment on table job_queue is 'Background job queue for event-driven processing';
comment on column job_queue.type is 'Job type identifier (e.g., email_triage, ai_analyze)';
comment on column job_queue.priority is 'Job priority (0=low, 1=normal, 2=high, 3=critical)';
comment on column job_queue.max_retries is 'Maximum number of retry attempts';
comment on column job_queue.retry_count is 'Current number of retry attempts';
comment on column job_queue.correlation_id is 'Correlation ID for request tracing';