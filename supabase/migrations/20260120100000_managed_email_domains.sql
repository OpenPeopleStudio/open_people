-- ═══════════════════════════════════════════════════════════════════════════
-- Managed Email Domains Schema
-- DNS-only email setup where we handle send/receive via our infrastructure
-- ═══════════════════════════════════════════════════════════════════════════

-- Add mode column to email_accounts
alter table email_accounts 
  add column if not exists mode text default 'custom' check (mode in ('managed', 'custom'));

-- Add managed_domain_id column
alter table email_accounts 
  add column if not exists managed_domain_id uuid;

-- Allow null account_id on email_messages (for inbound to unassigned domain)
alter table email_messages 
  alter column account_id drop not null;

-- Allow null tenant_id on email_accounts (for platform-level accounts)
alter table email_accounts 
  alter column tenant_id drop not null;

-- Update provider check to include 'managed'
alter table email_accounts 
  drop constraint if exists email_accounts_provider_check;

alter table email_accounts 
  add constraint email_accounts_provider_check 
  check (provider in ('managed', 'smtp', 'imap', 'pop3', 'resend', 'smtp_imap'));

-- Managed email domains table (DNS-only setup)
create table if not exists managed_email_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,  -- nullable for platform-level domains
  account_id uuid references email_accounts(id) on delete cascade,
  
  -- Domain configuration
  domain text not null,
  status text not null default 'pending' check (status in ('pending', 'verifying', 'verified', 'failed')),
  
  -- DNS records (JSON array of records to add)
  dns_records jsonb not null default '[]',
  
  -- Provider integration
  resend_domain_id text,
  
  -- Verification
  verified_at timestamptz,
  last_check_at timestamptz,
  error_message text,
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure tenant_id is nullable for platform-level domains (if table already existed with NOT NULL)
alter table managed_email_domains 
  alter column tenant_id drop not null;

-- Create unique index that handles NULL tenant_id properly
-- (unique constraint doesn't work well with NULLs, use partial indexes instead)
drop index if exists idx_managed_email_domains_tenant_domain;
create unique index idx_managed_email_domains_tenant_domain 
  on managed_email_domains(tenant_id, domain) 
  where tenant_id is not null;

create unique index if not exists idx_managed_email_domains_platform_domain 
  on managed_email_domains(domain) 
  where tenant_id is null;

-- Add foreign key from email_accounts to managed_email_domains
alter table email_accounts 
  add constraint email_accounts_managed_domain_fk 
  foreign key (managed_domain_id) references managed_email_domains(id) on delete set null;

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_managed_email_domains_tenant on managed_email_domains(tenant_id);
create index if not exists idx_managed_email_domains_account on managed_email_domains(account_id);
create index if not exists idx_managed_email_domains_domain on managed_email_domains(domain);
create index if not exists idx_managed_email_domains_status on managed_email_domains(status);
create index if not exists idx_email_accounts_mode on email_accounts(mode);
create index if not exists idx_email_accounts_managed_domain on email_accounts(managed_domain_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table managed_email_domains enable row level security;

-- Managed email domains policies
drop policy if exists "Users can view their managed domains" on managed_email_domains;
create policy "Users can view their managed domains"
  on managed_email_domains for select
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their managed domains" on managed_email_domains;
create policy "Users can manage their managed domains"
  on managed_email_domains for all
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════════════════════════════════════

-- Update timestamp trigger
create or replace function update_managed_email_domains_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists managed_email_domains_updated_at on managed_email_domains;
create trigger managed_email_domains_updated_at
  before update on managed_email_domains
  for each row
  execute function update_managed_email_domains_updated_at();
