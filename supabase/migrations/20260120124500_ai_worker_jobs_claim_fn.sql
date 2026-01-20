-- ════════════════════════════════════════════════════════════════════════════
-- AI Worker Jobs: atomic claim function
-- Uses FOR UPDATE SKIP LOCKED to safely claim a job across multiple workers.
-- Also supports reclaiming stale locks (e.g. crashed worker).
-- ════════════════════════════════════════════════════════════════════════════

create or replace function claim_next_ai_worker_job(
  p_runner_id text,
  p_lock_timeout_seconds int default 600
)
returns ai_worker_jobs
language plpgsql
security definer
as $$
declare
  v_job ai_worker_jobs;
begin
  with candidate as (
    select id
    from ai_worker_jobs
    where
      status = 'queued'
      or (
        status = 'running'
        and locked_at is not null
        and locked_at < (now() - make_interval(secs => p_lock_timeout_seconds))
      )
    order by created_at asc
    for update skip locked
    limit 1
  )
  update ai_worker_jobs j
  set
    status = 'running',
    locked_at = now(),
    locked_by = p_runner_id,
    started_at = coalesce(j.started_at, now())
  where j.id = (select id from candidate)
  returning * into v_job;

  return v_job;
end;
$$;

comment on function claim_next_ai_worker_job(text, int) is
  'Atomically claims the next queued ai_worker_job (or reclaims stale running job) using SKIP LOCKED.';

