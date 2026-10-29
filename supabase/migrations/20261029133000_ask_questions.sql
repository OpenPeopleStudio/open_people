-- Ask questions from openpeople.ai/ask.
-- Durable log of assistant questions. No public read. No IP or user-agent.
--
-- Forward: create table + RLS + service_role only.
-- Backout: drop table public.ask_questions;
--
-- Unapplied in this PR. Tom's database desk reviews and applies it.
-- Application code fail-softs if the table is missing.

create table if not exists public.ask_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null,
  status text not null default 'received',
  provider text,
  model text,
  fallback_fired boolean,
  covered boolean,
  error text,
  deployment_id text,
  request_id text,
  device_class text,
  constraint ask_questions_status_check
    check (status in ('received', 'answered', 'failed')),
  constraint ask_questions_device_class_check
    check (device_class is null or device_class in ('mobile', 'desktop', 'unknown'))
);

create index if not exists ask_questions_created_idx
  on public.ask_questions (created_at desc);

create index if not exists ask_questions_request_id_idx
  on public.ask_questions (request_id)
  where request_id is not null;

alter table public.ask_questions enable row level security;
alter table public.ask_questions force row level security;

revoke all on table public.ask_questions from public, anon, authenticated;
grant all on table public.ask_questions to service_role;

drop policy if exists "service_role_only_ask_questions" on public.ask_questions;
create policy "service_role_only_ask_questions"
  on public.ask_questions
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.ask_questions is
  'Public /ask questions. RLS on, no anon/authenticated access. Service-role only. Question text only; no IP or user-agent.';
