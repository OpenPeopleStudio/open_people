-- Ask follow-ups from openpeople.ai/ask.
-- Private store for a separate assistant to poll. No public read.
--
-- Forward: create table + RLS + service_role only.
-- Backout: drop table public.ask_followups;

create table if not exists public.ask_followups (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  question text not null,
  covered boolean not null default false,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create index if not exists ask_followups_open_created_idx
  on public.ask_followups (created_at desc)
  where answered_at is null;

create index if not exists ask_followups_answered_created_idx
  on public.ask_followups (created_at desc)
  where answered_at is not null;

alter table public.ask_followups enable row level security;
alter table public.ask_followups force row level security;

revoke all on table public.ask_followups from public, anon, authenticated;
grant all on table public.ask_followups to service_role;

drop policy if exists "service_role_only_ask_followups" on public.ask_followups;
create policy "service_role_only_ask_followups"
  on public.ask_followups
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.ask_followups is
  'Public /ask follow-ups. RLS on, no anon/authenticated access. Service-role only.';
