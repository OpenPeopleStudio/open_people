-- ═══════════════════════════════════════════════════════════════════════════
-- Super Admin Encrypted Vault Schema
-- Secure, encrypted file storage for super admins with AI analysis
-- Each super admin has their own isolated, encrypted vault
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Spaces (one per super admin)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references "709_profiles"(id) on delete cascade not null,
  name text not null default 'My Vault',
  
  -- Encryption key verification (not the actual key!)
  -- Used to verify master password without storing it
  key_verification_hash text not null,
  key_verification_salt text not null,
  
  -- Settings
  settings jsonb default '{
    "auto_lock_minutes": 30,
    "require_2fa": false,
    "retention_years": 7
  }',
  
  -- Stats (denormalized for performance)
  total_files integer default 0,
  total_size_bytes bigint default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(owner_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Encryption Keys
-- Master key is derived from password, these are wrapped data encryption keys
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_encryption_keys (
  id text primary key, -- Short hash identifier
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  
  -- The data encryption key (DEK), encrypted with the key encryption key (KEK)
  -- KEK is derived from the master password
  encrypted_dek text not null,
  encryption_iv text not null,
  encryption_salt text not null,
  
  -- Key metadata
  algorithm text not null default 'AES-GCM-256',
  key_derivation text not null default 'PBKDF2-SHA256-150000',
  
  -- Status
  is_active boolean default true,
  created_at timestamptz default now(),
  rotated_at timestamptz,
  
  -- Only one active key per vault
  unique(vault_id) where is_active = true
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Folders
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_folders (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  parent_id uuid references vault_folders(id) on delete cascade,
  
  name text not null,
  path text not null, -- Full path: /Invoices/2026/January
  
  -- Smart folder configuration (null for regular folders)
  is_smart_folder boolean default false,
  smart_folder_query jsonb, -- { "ai_category": "invoice", "date_range": "this_year" }
  
  -- Icon/color customization
  icon text default 'folder',
  color text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(vault_id, path)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Files
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_files (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  folder_id uuid references vault_folders(id) on delete set null,
  
  -- R2 storage reference
  r2_key text not null, -- vault/{vault_id}/files/{file_id}.enc
  
  -- File metadata (stored unencrypted for search/filtering)
  filename text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes bigint not null,
  
  -- Encryption details
  encryption_key_id text references vault_encryption_keys(id) not null,
  encryption_iv text not null,
  
  -- Original file hash (before encryption) for duplicate detection
  content_hash text not null,
  
  -- AI analysis results (stored unencrypted for search/filtering)
  ai_summary text,
  ai_category text, -- 'invoice', 'receipt', 'contract', 'statement', 'id_document', 'other'
  ai_subcategory text, -- More specific: 'utility_bill', 'bank_statement', etc.
  ai_tags text[] default '{}',
  ai_extracted_data jsonb default '{}', -- Structured data: amounts, dates, vendors, etc.
  ai_confidence real, -- 0.0 to 1.0
  ai_analyzed_at timestamptz,
  ai_error text, -- If analysis failed
  
  -- Thumbnail (encrypted, stored in R2)
  thumbnail_key text, -- vault/{vault_id}/thumbnails/{file_id}.enc
  
  -- Source tracking
  source_type text not null default 'manual', -- 'manual', 'email', 'automation'
  source_metadata jsonb default '{}', -- Email headers, rule ID, sender, etc.
  
  -- Status
  status text not null default 'active' check (status in ('pending', 'active', 'archived', 'deleted')),
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Automation Rules
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_automation_rules (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  
  name text not null,
  description text,
  is_active boolean default true,
  priority integer default 0, -- Higher = processed first
  
  -- Email matching criteria (all are optional, combined with AND)
  email_from_pattern text, -- Regex or exact match
  email_from_exact text[], -- Exact email addresses
  email_subject_pattern text, -- Regex pattern
  email_subject_contains text[], -- Contains any of these strings
  
  -- Attachment matching
  attachment_types text[] default '{}', -- MIME types: ['application/pdf', 'image/*']
  attachment_name_pattern text, -- Regex for filename
  min_attachment_size bigint, -- Minimum size in bytes
  max_attachment_size bigint, -- Maximum size in bytes
  
  -- Actions
  target_folder_id uuid references vault_folders(id) on delete set null,
  auto_approve boolean default false, -- Skip inbox if true
  ai_classify boolean default true, -- Run AI analysis
  apply_tags text[] default '{}', -- Additional tags to apply
  
  -- Stats
  files_processed integer default 0,
  last_triggered_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Inbox (pending files from automation)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_inbox (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  file_id uuid references vault_files(id) on delete cascade not null,
  rule_id uuid references vault_automation_rules(id) on delete set null,
  
  -- Suggested placement
  suggested_folder_id uuid references vault_folders(id) on delete set null,
  suggested_tags text[] default '{}',
  
  -- AI classification preview
  ai_category_preview text,
  ai_summary_preview text,
  
  -- Source info for review
  source_email_from text,
  source_email_subject text,
  source_email_date timestamptz,
  
  -- Status
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewer_notes text,
  
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault AI Suggestions
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_suggestions (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  
  -- Suggestion type
  type text not null check (type in (
    'duplicate',      -- Duplicate file detected
    'consolidate',    -- Multiple related files can be merged
    'missing',        -- Expected recurring file not received
    'organize',       -- Files should be moved to different folder
    'retention',      -- Files past retention period
    'cleanup'         -- Unused/orphaned files
  )),
  
  -- Priority/urgency
  priority text not null default 'low' check (priority in ('low', 'medium', 'high')),
  
  -- Description
  title text not null,
  description text not null,
  
  -- Related files
  file_ids uuid[] default '{}',
  
  -- Suggested action
  suggested_action jsonb not null, -- { "action": "move", "target_folder_id": "...", "file_ids": [...] }
  
  -- Status
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed', 'expired')),
  applied_at timestamptz,
  dismissed_at timestamptz,
  dismiss_reason text,
  
  -- AI confidence
  confidence real, -- 0.0 to 1.0
  
  created_at timestamptz default now(),
  expires_at timestamptz -- Auto-dismiss after this date
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Audit Log
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_audit_log (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  
  -- Action details
  action text not null, -- 'unlock', 'lock', 'upload', 'download', 'delete', 'move', 'share', etc.
  resource_type text, -- 'file', 'folder', 'rule', 'settings'
  resource_id uuid,
  
  -- Actor info
  performed_by uuid references "709_profiles"(id) on delete set null,
  
  -- Request metadata
  ip_address inet,
  user_agent text,
  
  -- Additional context
  metadata jsonb default '{}',
  
  -- Success/failure
  success boolean default true,
  error_message text,
  
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Sessions (for cross-device unlock)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_sessions (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  
  -- Session type
  type text not null check (type in ('primary', 'qr_approval', 'recovery')),
  
  -- For QR approval: the pending request
  qr_challenge text, -- Random challenge for QR code
  qr_device_name text, -- "Chrome on MacOS"
  qr_requested_at timestamptz,
  qr_expires_at timestamptz,
  qr_approved boolean,
  qr_approved_at timestamptz,
  
  -- Session status
  is_active boolean default true,
  
  -- Device info
  device_id text, -- Fingerprint for device recognition
  device_name text,
  ip_address inet,
  user_agent text,
  
  -- Timing
  created_at timestamptz default now(),
  last_activity_at timestamptz default now(),
  expires_at timestamptz not null,
  
  -- For recovery codes
  recovery_code_hash text,
  recovery_code_used boolean default false
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Recovery Codes
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  
  -- Hashed recovery code (we never store the plaintext)
  code_hash text not null,
  
  -- Status
  is_used boolean default false,
  used_at timestamptz,
  used_ip inet,
  
  created_at timestamptz default now(),
  
  unique(vault_id, code_hash)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vault Backups
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists vault_backups (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references vault_spaces(id) on delete cascade not null,
  
  -- Backup file in R2
  r2_key text not null, -- vault/{vault_id}/backups/{backup_id}.enc.zip
  
  -- Stats
  file_count integer not null,
  total_size_bytes bigint not null,
  
  -- Status
  status text not null default 'creating' check (status in ('creating', 'ready', 'expired', 'deleted')),
  
  -- Expiration
  created_at timestamptz default now(),
  expires_at timestamptz not null, -- Backups auto-expire
  downloaded_at timestamptz,
  
  -- Notes
  notes text
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- Vault spaces
create index if not exists idx_vault_spaces_owner on vault_spaces(owner_id);

-- Encryption keys
create index if not exists idx_vault_encryption_keys_vault on vault_encryption_keys(vault_id);
create index if not exists idx_vault_encryption_keys_active on vault_encryption_keys(vault_id) where is_active = true;

-- Folders
create index if not exists idx_vault_folders_vault on vault_folders(vault_id);
create index if not exists idx_vault_folders_parent on vault_folders(parent_id);
create index if not exists idx_vault_folders_path on vault_folders(vault_id, path);

-- Files
create index if not exists idx_vault_files_vault on vault_files(vault_id);
create index if not exists idx_vault_files_folder on vault_files(folder_id);
create index if not exists idx_vault_files_status on vault_files(vault_id, status) where status = 'active';
create index if not exists idx_vault_files_category on vault_files(vault_id, ai_category);
create index if not exists idx_vault_files_content_hash on vault_files(vault_id, content_hash);
create index if not exists idx_vault_files_created on vault_files(vault_id, created_at desc);
create index if not exists idx_vault_files_source on vault_files(vault_id, source_type);

-- Full-text search on filenames and AI summary
create index if not exists idx_vault_files_search on vault_files 
  using gin(to_tsvector('english', coalesce(filename, '') || ' ' || coalesce(ai_summary, '')));

-- Tags array search
create index if not exists idx_vault_files_tags on vault_files using gin(ai_tags);

-- Automation rules
create index if not exists idx_vault_automation_rules_vault on vault_automation_rules(vault_id);
create index if not exists idx_vault_automation_rules_active on vault_automation_rules(vault_id, is_active) where is_active = true;

-- Inbox
create index if not exists idx_vault_inbox_vault on vault_inbox(vault_id);
create index if not exists idx_vault_inbox_status on vault_inbox(vault_id, status) where status = 'pending';

-- Suggestions
create index if not exists idx_vault_suggestions_vault on vault_suggestions(vault_id);
create index if not exists idx_vault_suggestions_pending on vault_suggestions(vault_id, status) where status = 'pending';

-- Audit log
create index if not exists idx_vault_audit_vault on vault_audit_log(vault_id);
create index if not exists idx_vault_audit_created on vault_audit_log(vault_id, created_at desc);
create index if not exists idx_vault_audit_resource on vault_audit_log(resource_type, resource_id);

-- Sessions
create index if not exists idx_vault_sessions_vault on vault_sessions(vault_id);
create index if not exists idx_vault_sessions_active on vault_sessions(vault_id, is_active) where is_active = true;
create index if not exists idx_vault_sessions_qr on vault_sessions(qr_challenge) where qr_challenge is not null;

-- Recovery codes
create index if not exists idx_vault_recovery_codes_vault on vault_recovery_codes(vault_id);

-- Backups
create index if not exists idx_vault_backups_vault on vault_backups(vault_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table vault_spaces enable row level security;
alter table vault_encryption_keys enable row level security;
alter table vault_folders enable row level security;
alter table vault_files enable row level security;
alter table vault_automation_rules enable row level security;
alter table vault_inbox enable row level security;
alter table vault_suggestions enable row level security;
alter table vault_audit_log enable row level security;
alter table vault_sessions enable row level security;
alter table vault_recovery_codes enable row level security;
alter table vault_backups enable row level security;

-- Helper function to check if user owns a vault
create or replace function user_owns_vault(p_vault_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from vault_spaces 
    where id = p_vault_id and owner_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is super admin
create or replace function is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from "709_profiles" 
    where id = auth.uid() and role = 'super_admin'
  );
end;
$$ language plpgsql security definer;

-- Vault spaces: Only owner can access
create policy "Users can view own vault" on vault_spaces
  for select using (owner_id = auth.uid());

create policy "Users can create own vault" on vault_spaces
  for insert with check (owner_id = auth.uid() and is_super_admin());

create policy "Users can update own vault" on vault_spaces
  for update using (owner_id = auth.uid());

create policy "Users can delete own vault" on vault_spaces
  for delete using (owner_id = auth.uid());

-- Encryption keys: Only owner can access
create policy "Users can manage vault encryption keys" on vault_encryption_keys
  for all using (user_owns_vault(vault_id));

-- Folders: Only owner can access
create policy "Users can manage vault folders" on vault_folders
  for all using (user_owns_vault(vault_id));

-- Files: Only owner can access
create policy "Users can manage vault files" on vault_files
  for all using (user_owns_vault(vault_id));

-- Automation rules: Only owner can access
create policy "Users can manage vault automation rules" on vault_automation_rules
  for all using (user_owns_vault(vault_id));

-- Inbox: Only owner can access
create policy "Users can manage vault inbox" on vault_inbox
  for all using (user_owns_vault(vault_id));

-- Suggestions: Only owner can access
create policy "Users can manage vault suggestions" on vault_suggestions
  for all using (user_owns_vault(vault_id));

-- Audit log: Only owner can view
create policy "Users can view vault audit log" on vault_audit_log
  for select using (user_owns_vault(vault_id));

-- Sessions: Only owner can access
create policy "Users can manage vault sessions" on vault_sessions
  for all using (user_owns_vault(vault_id));

-- Recovery codes: Only owner can access
create policy "Users can manage vault recovery codes" on vault_recovery_codes
  for all using (user_owns_vault(vault_id));

-- Backups: Only owner can access
create policy "Users can manage vault backups" on vault_backups
  for all using (user_owns_vault(vault_id));

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to update vault stats when files change
create or replace function update_vault_stats()
returns trigger as $$
begin
  update vault_spaces
  set 
    total_files = (
      select count(*) from vault_files 
      where vault_id = coalesce(new.vault_id, old.vault_id) 
      and status = 'active'
    ),
    total_size_bytes = (
      select coalesce(sum(size_bytes), 0) from vault_files 
      where vault_id = coalesce(new.vault_id, old.vault_id) 
      and status = 'active'
    ),
    updated_at = now()
  where id = coalesce(new.vault_id, old.vault_id);
  
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Trigger for file changes
create trigger vault_files_stats_trigger
  after insert or update or delete on vault_files
  for each row execute function update_vault_stats();

-- Function to search vault files
create or replace function search_vault_files(
  p_vault_id uuid,
  p_query text default null,
  p_category text default null,
  p_folder_id uuid default null,
  p_tags text[] default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  filename text,
  content_type text,
  size_bytes bigint,
  ai_summary text,
  ai_category text,
  ai_tags text[],
  folder_id uuid,
  folder_path text,
  created_at timestamptz
) as $$
begin
  return query
  select 
    f.id,
    f.filename,
    f.content_type,
    f.size_bytes,
    f.ai_summary,
    f.ai_category,
    f.ai_tags,
    f.folder_id,
    vf.path as folder_path,
    f.created_at
  from vault_files f
  left join vault_folders vf on f.folder_id = vf.id
  where f.vault_id = p_vault_id
    and f.status = 'active'
    and (p_query is null or to_tsvector('english', coalesce(f.filename, '') || ' ' || coalesce(f.ai_summary, '')) @@ plainto_tsquery('english', p_query))
    and (p_category is null or f.ai_category = p_category)
    and (p_folder_id is null or f.folder_id = p_folder_id)
    and (p_tags is null or f.ai_tags && p_tags)
  order by f.created_at desc
  limit p_limit
  offset p_offset;
end;
$$ language plpgsql security definer;

-- Function to get vault stats
create or replace function get_vault_stats(p_vault_id uuid)
returns table (
  total_files integer,
  total_size_bytes bigint,
  files_by_category jsonb,
  pending_inbox integer,
  pending_suggestions integer,
  recent_activity_count integer
) as $$
begin
  return query
  select
    (select count(*)::integer from vault_files where vault_id = p_vault_id and status = 'active'),
    (select coalesce(sum(size_bytes), 0)::bigint from vault_files where vault_id = p_vault_id and status = 'active'),
    (
      select coalesce(jsonb_object_agg(ai_category, cnt), '{}'::jsonb)
      from (
        select ai_category, count(*)::integer as cnt 
        from vault_files 
        where vault_id = p_vault_id and status = 'active' and ai_category is not null
        group by ai_category
      ) cat
    ),
    (select count(*)::integer from vault_inbox where vault_id = p_vault_id and status = 'pending'),
    (select count(*)::integer from vault_suggestions where vault_id = p_vault_id and status = 'pending'),
    (select count(*)::integer from vault_audit_log where vault_id = p_vault_id and created_at > now() - interval '7 days');
end;
$$ language plpgsql security definer;

-- Function to clean up expired sessions
create or replace function cleanup_vault_sessions()
returns void as $$
begin
  -- Deactivate expired sessions
  update vault_sessions 
  set is_active = false
  where is_active = true and expires_at < now();
  
  -- Delete old inactive sessions (older than 30 days)
  delete from vault_sessions
  where is_active = false and created_at < now() - interval '30 days';
  
  -- Delete expired QR challenges (older than 5 minutes)
  update vault_sessions
  set qr_challenge = null, qr_expires_at = null
  where qr_challenge is not null and qr_expires_at < now();
end;
$$ language plpgsql security definer;

-- Function to detect duplicate files
create or replace function detect_vault_duplicates(p_vault_id uuid, p_content_hash text)
returns table (
  file_id uuid,
  filename text,
  created_at timestamptz
) as $$
begin
  return query
  select f.id, f.filename, f.created_at
  from vault_files f
  where f.vault_id = p_vault_id
    and f.content_hash = p_content_hash
    and f.status = 'active'
  order by f.created_at;
end;
$$ language plpgsql security definer;
