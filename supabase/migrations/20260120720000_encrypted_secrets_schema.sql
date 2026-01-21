-- ════════════════════════════════════════════════════════════════════════════
-- Encrypted Secrets Schema
-- KMS-backed envelope encryption for sensitive credentials
-- ════════════════════════════════════════════════════════════════════════════

-- Encrypted secrets with envelope encryption
create table if not exists encrypted_secrets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  
  -- Secret identity
  secret_type text not null, -- 'api_key', 'oauth_token', 'credential', 'webhook_secret'
  secret_name text not null,
  description text,
  
  -- Envelope encryption
  kms_key_id text not null,       -- KMS key identifier (ARN or alias)
  encrypted_dek bytea not null,   -- DEK encrypted by KMS
  encrypted_value bytea not null, -- Value encrypted by DEK
  
  -- Encryption metadata
  algorithm text not null default 'AES-256-GCM',
  iv bytea not null,
  auth_tag bytea,
  
  -- Key versioning (for rotation)
  key_version integer not null default 1,
  rotated_at timestamptz,
  rotation_scheduled_at timestamptz,
  
  -- Access control
  access_policy jsonb, -- Fine-grained access rules
  
  -- Hint for display (e.g., last 4 chars)
  hint text,
  
  -- Audit fields
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  last_accessed_at timestamptz,
  last_accessed_by uuid references auth.users(id) on delete set null,
  access_count integer not null default 0,
  
  -- Soft delete for audit trail
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  
  constraint encrypted_secrets_unique unique (tenant_id, secret_type, secret_name)
);

create index if not exists idx_encrypted_secrets_tenant 
  on encrypted_secrets(tenant_id, secret_type);

create index if not exists idx_encrypted_secrets_rotation 
  on encrypted_secrets(rotation_scheduled_at) 
  where rotation_scheduled_at is not null and deleted_at is null;

-- Updated_at trigger
create or replace function update_encrypted_secrets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists encrypted_secrets_updated_at on encrypted_secrets;
create trigger encrypted_secrets_updated_at
  before update on encrypted_secrets
  for each row execute function update_encrypted_secrets_updated_at();


-- ════════════════════════════════════════════════════════════════════════════
-- Secret Access Audit Log
-- Immutable log of all secret access operations
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists secret_access_log (
  id uuid primary key default gen_random_uuid(),
  
  -- What was accessed
  secret_id uuid not null references encrypted_secrets(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete set null,
  secret_type text not null,
  secret_name text not null,
  
  -- Who accessed
  accessor_id uuid not null references auth.users(id) on delete cascade,
  accessor_role text,
  
  -- Access details
  access_type text not null, -- 'decrypt', 'encrypt', 'rotate', 'delete', 'reveal', 'list'
  access_granted boolean not null,
  denial_reason text,
  
  -- Context
  ip_address inet,
  user_agent text,
  request_id text,
  correlation_id text,
  
  -- Result
  duration_ms integer,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_secret_access_log_secret 
  on secret_access_log(secret_id, created_at desc);

create index if not exists idx_secret_access_log_tenant 
  on secret_access_log(tenant_id, created_at desc);

create index if not exists idx_secret_access_log_accessor 
  on secret_access_log(accessor_id, created_at desc);

create index if not exists idx_secret_access_log_denied 
  on secret_access_log(created_at desc) 
  where access_granted = false;


-- ════════════════════════════════════════════════════════════════════════════
-- Break Glass Access
-- Emergency access records
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists break_glass_access (
  id uuid primary key default gen_random_uuid(),
  
  -- Authorization (requires two people)
  requestor_id uuid not null references auth.users(id),
  approver_id uuid not null references auth.users(id),
  justification text not null,
  ticket_reference text, -- Link to incident ticket
  
  -- Scope
  tenant_id uuid references tenants(id) on delete cascade,
  secret_types text[], -- Empty = all types
  
  -- Time bounds
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  revocation_reason text,
  
  -- Operations tracking
  operations_performed jsonb not null default '[]',
  
  -- Notification
  security_notified_at timestamptz,
  
  created_at timestamptz not null default now(),
  
  -- Requestor and approver must be different
  constraint break_glass_different_people check (requestor_id != approver_id)
);

create index if not exists idx_break_glass_active 
  on break_glass_access(expires_at) 
  where revoked_at is null;


-- ════════════════════════════════════════════════════════════════════════════
-- Tenant DEK Registry
-- Tracks per-tenant data encryption keys
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists tenant_dek_registry (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  
  -- DEK identity
  key_purpose text not null default 'default', -- 'default', 'api_keys', 'credentials'
  key_version integer not null default 1,
  
  -- Encrypted DEK (encrypted by master KEK in KMS)
  kms_key_id text not null,
  encrypted_dek bytea not null,
  
  -- Status
  status text not null default 'active' check (status in ('active', 'rotating', 'retired')),
  
  -- Timestamps
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  retired_at timestamptz,
  scheduled_retirement_at timestamptz,
  
  unique(tenant_id, key_purpose, key_version)
);

create index if not exists idx_tenant_dek_active 
  on tenant_dek_registry(tenant_id, key_purpose) 
  where status = 'active';


-- ════════════════════════════════════════════════════════════════════════════
-- Helper Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Log a secret access (called from application layer)
create or replace function log_secret_access(
  p_secret_id uuid,
  p_accessor_id uuid,
  p_access_type text,
  p_access_granted boolean,
  p_denial_reason text default null,
  p_ip_address inet default null,
  p_user_agent text default null,
  p_request_id text default null,
  p_duration_ms integer default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_secret encrypted_secrets;
  v_log_id uuid;
begin
  -- Get secret info
  select * into v_secret from encrypted_secrets where id = p_secret_id;
  
  -- Insert log entry
  insert into secret_access_log (
    secret_id,
    tenant_id,
    secret_type,
    secret_name,
    accessor_id,
    accessor_role,
    access_type,
    access_granted,
    denial_reason,
    ip_address,
    user_agent,
    request_id,
    duration_ms
  ) values (
    p_secret_id,
    v_secret.tenant_id,
    v_secret.secret_type,
    v_secret.secret_name,
    p_accessor_id,
    (select role from "709_profiles" where id = p_accessor_id),
    p_access_type,
    p_access_granted,
    p_denial_reason,
    p_ip_address,
    p_user_agent,
    p_request_id,
    p_duration_ms
  )
  returning id into v_log_id;
  
  -- Update access count and timestamp on the secret
  if p_access_granted then
    update encrypted_secrets
    set 
      last_accessed_at = now(),
      last_accessed_by = p_accessor_id,
      access_count = access_count + 1
    where id = p_secret_id;
  end if;
  
  return v_log_id;
end;
$$;


-- Check if user can access a secret
create or replace function can_access_secret(
  p_secret_id uuid,
  p_user_id uuid,
  p_access_type text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_secret encrypted_secrets;
  v_profile "709_profiles";
  v_break_glass break_glass_access;
begin
  -- Get secret and user info
  select * into v_secret from encrypted_secrets where id = p_secret_id and deleted_at is null;
  select * into v_profile from "709_profiles" where id = p_user_id;
  
  if v_secret is null or v_profile is null then
    return false;
  end if;
  
  -- Super admins can access everything
  if v_profile.is_super_admin then
    return true;
  end if;
  
  -- Check tenant membership
  if v_secret.tenant_id is not null and v_secret.tenant_id != v_profile.tenant_id then
    -- Check for active break glass access
    select * into v_break_glass
    from break_glass_access
    where requestor_id = p_user_id
      and (tenant_id is null or tenant_id = v_secret.tenant_id)
      and (secret_types is null or v_secret.secret_type = any(secret_types))
      and expires_at > now()
      and revoked_at is null;
    
    if v_break_glass is null then
      return false;
    end if;
  end if;
  
  -- Role-based access
  case v_profile.role
    when 'owner' then
      return true;
    when 'admin' then
      -- Admins can list and decrypt their own secrets
      if p_access_type in ('list', 'decrypt') then
        -- Check access_policy or if they created it
        if v_secret.created_by = p_user_id then
          return true;
        end if;
        -- Check access_policy JSONB for explicit grant
        if v_secret.access_policy ? 'allowed_users' and 
           v_secret.access_policy->'allowed_users' ? p_user_id::text then
          return true;
        end if;
      end if;
      return false;
    else
      return false;
  end case;
end;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- RLS Policies
-- ════════════════════════════════════════════════════════════════════════════

alter table encrypted_secrets enable row level security;
alter table secret_access_log enable row level security;
alter table break_glass_access enable row level security;
alter table tenant_dek_registry enable row level security;

-- Service role has full access
create policy "Service role full access to encrypted_secrets"
  on encrypted_secrets for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to secret_access_log"
  on secret_access_log for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to break_glass_access"
  on break_glass_access for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to tenant_dek_registry"
  on tenant_dek_registry for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Users can view secrets they have access to
create policy "Users can view accessible secrets"
  on encrypted_secrets for select
  using (can_access_secret(id, auth.uid(), 'list'));

-- Tenant admins/owners can insert secrets
create policy "Tenant admins can insert secrets"
  on encrypted_secrets for insert
  with check (
    tenant_id = (
      select p.tenant_id 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.role in ('admin', 'owner')
    )
  );

-- View own access logs
create policy "Users can view own access logs"
  on secret_access_log for select
  using (accessor_id = auth.uid());

-- Tenant admins can view tenant access logs
create policy "Tenant admins can view tenant access logs"
  on secret_access_log for select
  using (
    tenant_id = (
      select p.tenant_id 
      from "709_profiles" p 
      where p.id = auth.uid() 
      and p.role in ('admin', 'owner')
    )
  );

-- Super admins can view all
create policy "Super admins can view all secrets"
  on encrypted_secrets for select
  using (is_super_admin());

create policy "Super admins can view all access logs"
  on secret_access_log for select
  using (is_super_admin());

create policy "Super admins can manage break glass"
  on break_glass_access for all
  using (is_super_admin());
