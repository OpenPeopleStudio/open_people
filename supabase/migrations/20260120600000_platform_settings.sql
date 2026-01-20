-- ═══════════════════════════════════════════════════════════════════════════
-- Platform Settings Schema
-- Centralized configuration for super admin platform settings
-- ═══════════════════════════════════════════════════════════════════════════

-- Platform settings table (key-value by category)
create table if not exists platform_settings (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('general', 'features', 'limits', 'security', 'email', 'storage', 'maintenance')),
  key text not null,
  value jsonb not null,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique(category, key)
);

-- Settings audit log for tracking changes
create table if not exists settings_audit_log (
  id uuid primary key default gen_random_uuid(),
  setting_id uuid references platform_settings(id) on delete set null,
  category text not null,
  key text not null,
  old_value jsonb,
  new_value jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz default now(),
  ip_address inet,
  user_agent text
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_platform_settings_category on platform_settings(category);
create index if not exists idx_platform_settings_key on platform_settings(category, key);
create index if not exists idx_settings_audit_log_setting on settings_audit_log(setting_id);
create index if not exists idx_settings_audit_log_category on settings_audit_log(category);
create index if not exists idx_settings_audit_log_changed_at on settings_audit_log(changed_at desc);
create index if not exists idx_settings_audit_log_changed_by on settings_audit_log(changed_by);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table platform_settings enable row level security;
alter table settings_audit_log enable row level security;

-- Platform settings: Only super admins can read/write (via service role)
-- Regular users cannot access platform settings
drop policy if exists "Service role full access to platform_settings" on platform_settings;
create policy "Service role full access to platform_settings"
  on platform_settings for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Settings audit log: Only super admins can read (via service role)
drop policy if exists "Service role full access to settings_audit_log" on settings_audit_log;
create policy "Service role full access to settings_audit_log"
  on settings_audit_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to upsert a platform setting with audit logging
create or replace function upsert_platform_setting(
  p_category text,
  p_key text,
  p_value jsonb,
  p_description text default null,
  p_user_id uuid default null,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns uuid as $$
declare
  v_setting_id uuid;
  v_old_value jsonb;
begin
  -- Get existing value for audit log
  select id, value into v_setting_id, v_old_value
  from platform_settings
  where category = p_category and key = p_key;

  -- Upsert the setting
  insert into platform_settings (category, key, value, description, updated_by, updated_at)
  values (p_category, p_key, p_value, coalesce(p_description, ''), p_user_id, now())
  on conflict (category, key) do update set
    value = excluded.value,
    description = coalesce(excluded.description, platform_settings.description),
    updated_by = excluded.updated_by,
    updated_at = now()
  returning id into v_setting_id;

  -- Create audit log entry
  insert into settings_audit_log (
    setting_id,
    category,
    key,
    old_value,
    new_value,
    changed_by,
    ip_address,
    user_agent
  ) values (
    v_setting_id,
    p_category,
    p_key,
    v_old_value,
    p_value,
    p_user_id,
    p_ip_address,
    p_user_agent
  );

  return v_setting_id;
end;
$$ language plpgsql security definer;

-- Function to get all settings by category
create or replace function get_platform_settings_by_category(p_category text)
returns table (
  id uuid,
  key text,
  value jsonb,
  description text,
  updated_at timestamptz
) as $$
begin
  return query
  select ps.id, ps.key, ps.value, ps.description, ps.updated_at
  from platform_settings ps
  where ps.category = p_category
  order by ps.key;
end;
$$ language plpgsql security definer;

-- Function to get a single setting
create or replace function get_platform_setting(p_category text, p_key text)
returns jsonb as $$
declare
  v_value jsonb;
begin
  select value into v_value
  from platform_settings
  where category = p_category and key = p_key;
  
  return v_value;
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed Default Settings
-- ═══════════════════════════════════════════════════════════════════════════

-- General settings
insert into platform_settings (category, key, value, description) values
  ('general', 'platform_name', '"OpenPeople.ai"', 'Platform display name'),
  ('general', 'support_email', '"support@openpeople.ai"', 'Support contact email'),
  ('general', 'default_plan', '"starter"', 'Default plan for new tenants'),
  ('general', 'trial_days', '14', 'Number of days in trial period'),
  ('general', 'root_domain', '"openpeople.ai"', 'Root domain for the platform')
on conflict (category, key) do nothing;

-- Feature flags
insert into platform_settings (category, key, value, description) values
  ('features', 'signups_enabled', 'true', 'Allow new user signups'),
  ('features', 'ai_services_enabled', 'true', 'Enable AI-powered features platform-wide'),
  ('features', 'custom_domains_enabled', 'true', 'Allow tenants to use custom domains'),
  ('features', 'api_access_enabled', 'true', 'Allow API access for tenants'),
  ('features', 'webhooks_enabled', 'true', 'Enable webhook functionality'),
  ('features', 'sso_enabled', 'false', 'Enable SSO authentication'),
  ('features', 'audit_logs_enabled', 'true', 'Enable audit logging'),
  ('features', 'analytics_enabled', 'true', 'Enable analytics features')
on conflict (category, key) do nothing;

-- Limits
insert into platform_settings (category, key, value, description) values
  ('limits', 'max_tenants_per_account', '5', 'Maximum tenants per account'),
  ('limits', 'max_users_per_tenant', '100', 'Maximum users per tenant'),
  ('limits', 'max_storage_gb_free', '1', 'Free plan storage limit (GB)'),
  ('limits', 'max_ai_calls_free', '100', 'Free plan AI calls per month'),
  ('limits', 'api_rate_limit_per_minute', '60', 'API rate limit (requests per minute)'),
  ('limits', 'max_file_upload_mb', '50', 'Maximum file upload size (MB)'),
  ('limits', 'max_webhook_retries', '3', 'Maximum webhook delivery retries')
on conflict (category, key) do nothing;

-- Security settings
insert into platform_settings (category, key, value, description) values
  ('security', 'min_password_length', '8', 'Minimum password length'),
  ('security', 'require_uppercase', 'true', 'Require uppercase in passwords'),
  ('security', 'require_lowercase', 'true', 'Require lowercase in passwords'),
  ('security', 'require_numbers', 'true', 'Require numbers in passwords'),
  ('security', 'require_special_chars', 'false', 'Require special characters in passwords'),
  ('security', 'session_timeout_minutes', '1440', 'Session timeout in minutes (24 hours)'),
  ('security', 'max_failed_login_attempts', '5', 'Max failed login attempts before lockout'),
  ('security', 'enforce_2fa_admins', 'false', 'Enforce 2FA for admin users'),
  ('security', 'allowed_ip_ranges', '[]', 'Allowed IP ranges (CIDR format, empty = all)')
on conflict (category, key) do nothing;

-- Email settings
insert into platform_settings (category, key, value, description) values
  ('email', 'default_provider', '"resend"', 'Default email provider'),
  ('email', 'daily_send_limit', '1000', 'Daily email send limit per tenant'),
  ('email', 'default_from_name', '"OpenPeople"', 'Default sender name'),
  ('email', 'default_from_email', '"noreply@openpeople.ai"', 'Default sender email'),
  ('email', 'allowed_sender_domains', '["openpeople.ai"]', 'Allowed sender domains')
on conflict (category, key) do nothing;

-- Storage settings
insert into platform_settings (category, key, value, description) values
  ('storage', 'provider', '"r2"', 'Storage provider (r2, s3, local)'),
  ('storage', 'max_file_size_mb', '50', 'Maximum file size in MB'),
  ('storage', 'allowed_extensions', '["jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt", "zip"]', 'Allowed file extensions'),
  ('storage', 'retention_days', '365', 'Default file retention in days (0 = forever)'),
  ('storage', 'public_url_pattern', '""', 'Public URL pattern for files')
on conflict (category, key) do nothing;

-- Maintenance settings
insert into platform_settings (category, key, value, description) values
  ('maintenance', 'enabled', 'false', 'Maintenance mode enabled'),
  ('maintenance', 'message', '"We are currently performing scheduled maintenance. Please check back soon."', 'Maintenance mode message'),
  ('maintenance', 'scheduled_start', 'null', 'Scheduled maintenance start time'),
  ('maintenance', 'scheduled_end', 'null', 'Scheduled maintenance end time'),
  ('maintenance', 'bypass_emails', '[]', 'Emails that can bypass maintenance mode')
on conflict (category, key) do nothing;
