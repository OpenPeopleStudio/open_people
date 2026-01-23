-- ═══════════════════════════════════════════════════════════════════════════
-- Email Accounts & Inbox Schema
-- Tables for managing email accounts (SMTP/IMAP/POP/Resend) and inbox messages
-- ═══════════════════════════════════════════════════════════════════════════

-- Email accounts (SMTP/IMAP/POP/Resend configurations)
create table if not exists email_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,

  -- Account info
  name text not null,
  email_address text not null,
  is_default boolean default false,
  is_active boolean default true,

  -- Provider/Protocol type
  provider text not null check (provider in ('smtp', 'imap', 'pop3', 'resend', 'smtp_imap', 'managed')),

  -- Mode: managed (DNS-only) or custom (SMTP/IMAP credentials)
  mode text default 'custom' check (mode in ('managed', 'custom')),

  -- Managed domain ID (for managed mode)
  managed_domain_id uuid,
  
  -- SMTP settings (for sending)
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean default true,
  smtp_user text,
  smtp_password_encrypted text,
  smtp_password_iv text,
  
  -- IMAP settings (for inbox sync)
  imap_host text,
  imap_port integer,
  imap_secure boolean default true,
  imap_user text,
  imap_password_encrypted text,
  imap_password_iv text,
  
  -- POP3 settings (alternative to IMAP)
  pop3_host text,
  pop3_port integer,
  pop3_secure boolean default true,
  pop3_user text,
  pop3_password_encrypted text,
  pop3_password_iv text,
  
  -- Resend settings (use API key from api_keys table)
  resend_api_key_id uuid,
  resend_domain text,
  
  -- Sync settings
  sync_enabled boolean default true,
  sync_interval_minutes integer default 5,
  last_sync_at timestamptz,
  last_sync_error text,
  last_sync_uid text,  -- For IMAP UID tracking

  -- OAuth settings (for Gmail/Outlook)
  oauth_access_token text,
  oauth_refresh_token text,
  oauth_expires_at bigint,  -- Unix timestamp
  oauth_token_type text,
  last_sync_uid text,  -- For IMAP UID tracking
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(tenant_id, email_address)
);

-- Email messages (inbox/sent items)
create table if not exists email_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  account_id uuid references email_accounts(id) on delete cascade not null,
  
  -- Message identifiers
  message_id text,           -- RFC 2822 Message-ID
  provider_id text,          -- Provider-specific ID (Resend ID, IMAP UID, etc.)
  thread_id text,            -- For threading related messages
  in_reply_to text,          -- Reference to parent message
  
  -- Direction
  direction text not null check (direction in ('inbound', 'outbound')),
  
  -- Envelope
  from_address text not null,
  from_name text,
  to_addresses jsonb not null default '[]',      -- [{email, name}]
  cc_addresses jsonb default '[]',
  bcc_addresses jsonb default '[]',
  reply_to text,
  
  -- Content
  subject text,
  body_text text,
  body_html text,
  body_preview text,         -- First ~200 chars for list view
  
  -- Attachments metadata
  attachments jsonb default '[]',  -- [{filename, content_type, size, storage_key}]
  has_attachments boolean default false,
  
  -- Status
  status text not null default 'received' check (status in (
    'draft', 'queued', 'sending', 'sent', 'delivered', 'received',
    'opened', 'clicked', 'bounced', 'complained', 'failed'
  )),
  
  -- Mailbox/Folder
  mailbox text default 'INBOX',
  
  -- Flags
  is_read boolean default false,
  is_starred boolean default false,
  is_archived boolean default false,
  is_deleted boolean default false,
  is_spam boolean default false,
  
  -- Labels/Tags
  labels text[] default '{}',
  
  -- Timestamps
  sent_at timestamptz,
  received_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  
  -- Error tracking
  error_message text,
  retry_count integer default 0,
  
  -- Raw headers for debugging
  raw_headers jsonb,
  
  -- Metadata
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email message attachments storage (actual file content references)
create table if not exists email_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  message_id uuid references email_messages(id) on delete cascade not null,
  
  filename text not null,
  content_type text,
  size_bytes integer,
  
  -- Storage location
  storage_bucket text,
  storage_path text,
  
  -- Inline images
  content_id text,  -- For inline images with cid: references
  is_inline boolean default false,
  
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- Accounts indexes
create index if not exists idx_email_accounts_tenant on email_accounts(tenant_id);
create index if not exists idx_email_accounts_email on email_accounts(email_address);
create index if not exists idx_email_accounts_default on email_accounts(tenant_id, is_default) where is_default = true;

-- Messages indexes
create index if not exists idx_email_messages_tenant on email_messages(tenant_id);
create index if not exists idx_email_messages_account on email_messages(account_id);
create index if not exists idx_email_messages_direction on email_messages(direction);
create index if not exists idx_email_messages_status on email_messages(status);
create index if not exists idx_email_messages_mailbox on email_messages(account_id, mailbox);
create index if not exists idx_email_messages_thread on email_messages(thread_id);
create index if not exists idx_email_messages_message_id on email_messages(message_id);
create index if not exists idx_email_messages_from on email_messages(from_address);
create index if not exists idx_email_messages_received on email_messages(received_at desc);
create index if not exists idx_email_messages_created on email_messages(created_at desc);
create index if not exists idx_email_messages_unread on email_messages(account_id, is_read) where is_read = false;
create index if not exists idx_email_messages_starred on email_messages(account_id, is_starred) where is_starred = true;

-- Attachments indexes
create index if not exists idx_email_attachments_tenant on email_attachments(tenant_id);
create index if not exists idx_email_attachments_message on email_attachments(message_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table email_accounts enable row level security;
alter table email_messages enable row level security;
alter table email_attachments enable row level security;

-- Email accounts policies
drop policy if exists "Users can view their email accounts" on email_accounts;
create policy "Users can view their email accounts"
  on email_accounts for select
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email accounts" on email_accounts;
create policy "Users can manage their email accounts"
  on email_accounts for all
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

-- Email messages policies
drop policy if exists "Users can view their email messages" on email_messages;
create policy "Users can view their email messages"
  on email_messages for select
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email messages" on email_messages;
create policy "Users can manage their email messages"
  on email_messages for all
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

-- Email attachments policies
drop policy if exists "Users can view their email attachments" on email_attachments;
create policy "Users can view their email attachments"
  on email_attachments for select
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email attachments" on email_attachments;
create policy "Users can manage their email attachments"
  on email_attachments for all
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to get inbox stats for an account
create or replace function get_email_inbox_stats(p_account_id uuid)
returns table (
  total_messages bigint,
  unread_messages bigint,
  starred_messages bigint,
  draft_messages bigint,
  sent_messages bigint,
  spam_messages bigint,
  archived_messages bigint
) as $$
begin
  return query
  select
    count(*) filter (where not is_deleted) as total_messages,
    count(*) filter (where not is_read and not is_deleted and direction = 'inbound') as unread_messages,
    count(*) filter (where is_starred and not is_deleted) as starred_messages,
    count(*) filter (where status = 'draft') as draft_messages,
    count(*) filter (where direction = 'outbound' and status in ('sent', 'delivered')) as sent_messages,
    count(*) filter (where is_spam and not is_deleted) as spam_messages,
    count(*) filter (where is_archived and not is_deleted) as archived_messages
  from email_messages
  where account_id = p_account_id;
end;
$$ language plpgsql security definer;

-- Function to mark messages as read
create or replace function mark_messages_read(p_message_ids uuid[])
returns void as $$
begin
  update email_messages
  set is_read = true, updated_at = now()
  where id = any(p_message_ids);
end;
$$ language plpgsql security definer;

-- Function to move messages to mailbox
create or replace function move_messages_to_mailbox(p_message_ids uuid[], p_mailbox text)
returns void as $$
begin
  update email_messages
  set mailbox = p_mailbox, updated_at = now()
  where id = any(p_message_ids);
end;
$$ language plpgsql security definer;

-- Trigger to update updated_at on accounts
create or replace function update_email_accounts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_accounts_updated_at on email_accounts;
create trigger email_accounts_updated_at
  before update on email_accounts
  for each row
  execute function update_email_accounts_updated_at();

-- Trigger to update updated_at on messages
create or replace function update_email_messages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_messages_updated_at on email_messages;
create trigger email_messages_updated_at
  before update on email_messages
  for each row
  execute function update_email_messages_updated_at();

-- Trigger to ensure only one default account per tenant
create or replace function ensure_single_default_email_account()
returns trigger as $$
begin
  if new.is_default = true then
    update email_accounts
    set is_default = false
    where tenant_id = new.tenant_id
      and id != new.id
      and is_default = true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_accounts_single_default on email_accounts;
create trigger email_accounts_single_default
  before insert or update of is_default on email_accounts
  for each row
  when (new.is_default = true)
  execute function ensure_single_default_email_account();
-- ═══════════════════════════════════════════════════════════════════════════
-- Email Accounts & Inbox Schema
-- Tables for managing email accounts (SMTP/IMAP/POP/Resend) and inbox messages
-- ═══════════════════════════════════════════════════════════════════════════

-- Email accounts (SMTP/IMAP/POP/Resend configurations)
create table if not exists email_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,

  -- Account info
  name text not null,
  email_address text not null,
  is_default boolean default false,
  is_active boolean default true,

  -- Provider/Protocol type
  provider text not null check (provider in ('smtp', 'imap', 'pop3', 'resend', 'smtp_imap', 'managed')),

  -- Mode: managed (DNS-only) or custom (SMTP/IMAP credentials)
  mode text default 'custom' check (mode in ('managed', 'custom')),

  -- Managed domain ID (for managed mode)
  managed_domain_id uuid,
  
  -- SMTP settings (for sending)
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean default true,
  smtp_user text,
  smtp_password_encrypted text,
  smtp_password_iv text,
  
  -- IMAP settings (for inbox sync)
  imap_host text,
  imap_port integer,
  imap_secure boolean default true,
  imap_user text,
  imap_password_encrypted text,
  imap_password_iv text,
  
  -- POP3 settings (alternative to IMAP)
  pop3_host text,
  pop3_port integer,
  pop3_secure boolean default true,
  pop3_user text,
  pop3_password_encrypted text,
  pop3_password_iv text,
  
  -- Resend settings (use API key from api_keys table)
  resend_api_key_id uuid,
  resend_domain text,
  
  -- Sync settings
  sync_enabled boolean default true,
  sync_interval_minutes integer default 5,
  last_sync_at timestamptz,
  last_sync_error text,
  last_sync_uid text,  -- For IMAP UID tracking

  -- OAuth settings (for Gmail/Outlook)
  oauth_access_token text,
  oauth_refresh_token text,
  oauth_expires_at bigint,  -- Unix timestamp
  oauth_token_type text,
  last_sync_uid text,  -- For IMAP UID tracking
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(tenant_id, email_address)
);

-- Email messages (inbox/sent items)
create table if not exists email_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  account_id uuid references email_accounts(id) on delete cascade not null,
  
  -- Message identifiers
  message_id text,           -- RFC 2822 Message-ID
  provider_id text,          -- Provider-specific ID (Resend ID, IMAP UID, etc.)
  thread_id text,            -- For threading related messages
  in_reply_to text,          -- Reference to parent message
  
  -- Direction
  direction text not null check (direction in ('inbound', 'outbound')),
  
  -- Envelope
  from_address text not null,
  from_name text,
  to_addresses jsonb not null default '[]',      -- [{email, name}]
  cc_addresses jsonb default '[]',
  bcc_addresses jsonb default '[]',
  reply_to text,
  
  -- Content
  subject text,
  body_text text,
  body_html text,
  body_preview text,         -- First ~200 chars for list view
  
  -- Attachments metadata
  attachments jsonb default '[]',  -- [{filename, content_type, size, storage_key}]
  has_attachments boolean default false,
  
  -- Status
  status text not null default 'received' check (status in (
    'draft', 'queued', 'sending', 'sent', 'delivered', 'received',
    'opened', 'clicked', 'bounced', 'complained', 'failed'
  )),
  
  -- Mailbox/Folder
  mailbox text default 'INBOX',
  
  -- Flags
  is_read boolean default false,
  is_starred boolean default false,
  is_archived boolean default false,
  is_deleted boolean default false,
  is_spam boolean default false,
  
  -- Labels/Tags
  labels text[] default '{}',
  
  -- Timestamps
  sent_at timestamptz,
  received_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  
  -- Error tracking
  error_message text,
  retry_count integer default 0,
  
  -- Raw headers for debugging
  raw_headers jsonb,
  
  -- Metadata
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email message attachments storage (actual file content references)
create table if not exists email_attachments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  message_id uuid references email_messages(id) on delete cascade not null,
  
  filename text not null,
  content_type text,
  size_bytes integer,
  
  -- Storage location
  storage_bucket text,
  storage_path text,
  
  -- Inline images
  content_id text,  -- For inline images with cid: references
  is_inline boolean default false,
  
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- Accounts indexes
create index if not exists idx_email_accounts_tenant on email_accounts(tenant_id);
create index if not exists idx_email_accounts_email on email_accounts(email_address);
create index if not exists idx_email_accounts_default on email_accounts(tenant_id, is_default) where is_default = true;

-- Messages indexes
create index if not exists idx_email_messages_tenant on email_messages(tenant_id);
create index if not exists idx_email_messages_account on email_messages(account_id);
create index if not exists idx_email_messages_direction on email_messages(direction);
create index if not exists idx_email_messages_status on email_messages(status);
create index if not exists idx_email_messages_mailbox on email_messages(account_id, mailbox);
create index if not exists idx_email_messages_thread on email_messages(thread_id);
create index if not exists idx_email_messages_message_id on email_messages(message_id);
create index if not exists idx_email_messages_from on email_messages(from_address);
create index if not exists idx_email_messages_received on email_messages(received_at desc);
create index if not exists idx_email_messages_created on email_messages(created_at desc);
create index if not exists idx_email_messages_unread on email_messages(account_id, is_read) where is_read = false;
create index if not exists idx_email_messages_starred on email_messages(account_id, is_starred) where is_starred = true;

-- Attachments indexes
create index if not exists idx_email_attachments_tenant on email_attachments(tenant_id);
create index if not exists idx_email_attachments_message on email_attachments(message_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table email_accounts enable row level security;
alter table email_messages enable row level security;
alter table email_attachments enable row level security;

-- Email accounts policies
drop policy if exists "Users can view their email accounts" on email_accounts;
create policy "Users can view their email accounts"
  on email_accounts for select
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email accounts" on email_accounts;
create policy "Users can manage their email accounts"
  on email_accounts for all
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

-- Email messages policies
drop policy if exists "Users can view their email messages" on email_messages;
create policy "Users can view their email messages"
  on email_messages for select
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email messages" on email_messages;
create policy "Users can manage their email messages"
  on email_messages for all
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

-- Email attachments policies
drop policy if exists "Users can view their email attachments" on email_attachments;
create policy "Users can view their email attachments"
  on email_attachments for select
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email attachments" on email_attachments;
create policy "Users can manage their email attachments"
  on email_attachments for all
  using (
    tenant_id in (
      select tenant_id from "profiles" where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to get inbox stats for an account
create or replace function get_email_inbox_stats(p_account_id uuid)
returns table (
  total_messages bigint,
  unread_messages bigint,
  starred_messages bigint,
  draft_messages bigint,
  sent_messages bigint,
  spam_messages bigint,
  archived_messages bigint
) as $$
begin
  return query
  select
    count(*) filter (where not is_deleted) as total_messages,
    count(*) filter (where not is_read and not is_deleted and direction = 'inbound') as unread_messages,
    count(*) filter (where is_starred and not is_deleted) as starred_messages,
    count(*) filter (where status = 'draft') as draft_messages,
    count(*) filter (where direction = 'outbound' and status in ('sent', 'delivered')) as sent_messages,
    count(*) filter (where is_spam and not is_deleted) as spam_messages,
    count(*) filter (where is_archived and not is_deleted) as archived_messages
  from email_messages
  where account_id = p_account_id;
end;
$$ language plpgsql security definer;

-- Function to mark messages as read
create or replace function mark_messages_read(p_message_ids uuid[])
returns void as $$
begin
  update email_messages
  set is_read = true, updated_at = now()
  where id = any(p_message_ids);
end;
$$ language plpgsql security definer;

-- Function to move messages to mailbox
create or replace function move_messages_to_mailbox(p_message_ids uuid[], p_mailbox text)
returns void as $$
begin
  update email_messages
  set mailbox = p_mailbox, updated_at = now()
  where id = any(p_message_ids);
end;
$$ language plpgsql security definer;

-- Trigger to update updated_at on accounts
create or replace function update_email_accounts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_accounts_updated_at on email_accounts;
create trigger email_accounts_updated_at
  before update on email_accounts
  for each row
  execute function update_email_accounts_updated_at();

-- Trigger to update updated_at on messages
create or replace function update_email_messages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_messages_updated_at on email_messages;
create trigger email_messages_updated_at
  before update on email_messages
  for each row
  execute function update_email_messages_updated_at();

-- Trigger to ensure only one default account per tenant
create or replace function ensure_single_default_email_account()
returns trigger as $$
begin
  if new.is_default = true then
    update email_accounts
    set is_default = false
    where tenant_id = new.tenant_id
      and id != new.id
      and is_default = true;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_accounts_single_default on email_accounts;
create trigger email_accounts_single_default
  before insert or update of is_default on email_accounts
  for each row
  when (new.is_default = true)
  execute function ensure_single_default_email_account();
