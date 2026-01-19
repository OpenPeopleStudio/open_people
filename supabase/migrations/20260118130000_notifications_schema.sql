-- ═══════════════════════════════════════════════════════════════════════════
-- Notifications Schema
-- Tables for multichannel notifications (SMS, in-app, push)
-- ═══════════════════════════════════════════════════════════════════════════

-- Notification subscriptions
create table if not exists notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  tier text not null default 'free' check (tier in ('free', 'starter', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'trialing', 'canceled', 'past_due')),
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_from_number text,
  fcm_server_key text,
  stripe_subscription_id text,
  current_period_start timestamptz default now(),
  current_period_end timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id)
);

-- Notification templates
create table if not exists notification_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  slug text not null,
  channel text not null check (channel in ('sms', 'in_app', 'push', 'email')),
  subject text,
  body text not null,
  variables text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, slug)
);

-- Notification deliveries (log of all sent notifications)
create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  template_id uuid references notification_templates(id) on delete set null,
  channel text not null check (channel in ('sms', 'in_app', 'push', 'email')),
  recipient text not null,
  recipient_user_id uuid references auth.users(id) on delete set null,
  subject text,
  body text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed', 'read')),
  provider_id text,
  error_message text,
  metadata jsonb default '{}',
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- User notification preferences
create table if not exists user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  channel text not null check (channel in ('sms', 'in_app', 'push', 'email')),
  enabled boolean default true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, tenant_id, channel)
);

-- In-app notifications (user inbox)
create table if not exists in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  body text not null,
  action_url text,
  icon text,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Notification usage tracking
create table if not exists notification_usage (
  tenant_id uuid references tenants(id) on delete cascade,
  period_start date not null,
  sms_sent integer default 0,
  sms_delivered integer default 0,
  sms_failed integer default 0,
  in_app_sent integer default 0,
  in_app_read integer default 0,
  push_sent integer default 0,
  push_delivered integer default 0,
  updated_at timestamptz default now(),
  primary key (tenant_id, period_start)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_notification_subscriptions_tenant on notification_subscriptions(tenant_id);
create index if not exists idx_notification_templates_tenant on notification_templates(tenant_id);
create index if not exists idx_notification_templates_slug on notification_templates(tenant_id, slug);
create index if not exists idx_notification_deliveries_tenant on notification_deliveries(tenant_id);
create index if not exists idx_notification_deliveries_status on notification_deliveries(status);
create index if not exists idx_notification_deliveries_channel on notification_deliveries(channel);
create index if not exists idx_notification_deliveries_recipient on notification_deliveries(recipient_user_id);
create index if not exists idx_notification_deliveries_created on notification_deliveries(created_at);
create index if not exists idx_user_notification_prefs_user on user_notification_preferences(user_id);
create index if not exists idx_user_notification_prefs_tenant on user_notification_preferences(tenant_id);
create index if not exists idx_in_app_notifications_user on in_app_notifications(user_id);
create index if not exists idx_in_app_notifications_tenant on in_app_notifications(tenant_id);
create index if not exists idx_in_app_notifications_read on in_app_notifications(is_read);
create index if not exists idx_notification_usage_tenant on notification_usage(tenant_id);
create index if not exists idx_notification_usage_period on notification_usage(period_start);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table notification_subscriptions enable row level security;
alter table notification_templates enable row level security;
alter table notification_deliveries enable row level security;
alter table user_notification_preferences enable row level security;
alter table in_app_notifications enable row level security;
alter table notification_usage enable row level security;

-- Subscriptions
drop policy if exists "Users can view their notification subscription" on notification_subscriptions;
create policy "Users can view their notification subscription"
  on notification_subscriptions for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Templates
drop policy if exists "Users can manage their notification templates" on notification_templates;
create policy "Users can manage their notification templates"
  on notification_templates for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Deliveries
drop policy if exists "Users can view their notification deliveries" on notification_deliveries;
create policy "Users can view their notification deliveries"
  on notification_deliveries for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- User preferences
drop policy if exists "Users can manage their notification preferences" on user_notification_preferences;
create policy "Users can manage their notification preferences"
  on user_notification_preferences for all
  using (user_id = auth.uid());

-- In-app notifications
drop policy if exists "Users can view their in-app notifications" on in_app_notifications;
create policy "Users can view their in-app notifications"
  on in_app_notifications for select
  using (user_id = auth.uid());

drop policy if exists "Users can update their in-app notifications" on in_app_notifications;
create policy "Users can update their in-app notifications"
  on in_app_notifications for update
  using (user_id = auth.uid());

-- Usage
drop policy if exists "Users can view their notification usage" on notification_usage;
create policy "Users can view their notification usage"
  on notification_usage for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to increment notification usage
create or replace function increment_notification_usage(
  p_tenant_id uuid,
  p_period_start date,
  p_field text,
  p_increment integer default 1
)
returns void as $$
begin
  insert into notification_usage (tenant_id, period_start)
  values (p_tenant_id, p_period_start)
  on conflict (tenant_id, period_start) do nothing;
  
  execute format(
    'update notification_usage set %I = %I + $1, updated_at = now() where tenant_id = $2 and period_start = $3',
    p_field, p_field
  ) using p_increment, p_tenant_id, p_period_start;
end;
$$ language plpgsql security definer;

-- Function to get notification stats
create or replace function get_notification_stats(p_tenant_id uuid)
returns table (
  sms_sent integer,
  sms_delivered integer,
  sms_failed integer,
  sms_delivery_rate numeric,
  in_app_sent integer,
  in_app_read integer,
  in_app_read_rate numeric,
  push_sent integer,
  push_delivered integer
) as $$
begin
  return query
  select
    coalesce(sum(nu.sms_sent), 0)::integer as sms_sent,
    coalesce(sum(nu.sms_delivered), 0)::integer as sms_delivered,
    coalesce(sum(nu.sms_failed), 0)::integer as sms_failed,
    case 
      when sum(nu.sms_sent) > 0 
      then round((sum(nu.sms_delivered)::numeric / sum(nu.sms_sent)::numeric) * 100, 2)
      else 0 
    end as sms_delivery_rate,
    coalesce(sum(nu.in_app_sent), 0)::integer as in_app_sent,
    coalesce(sum(nu.in_app_read), 0)::integer as in_app_read,
    case 
      when sum(nu.in_app_sent) > 0 
      then round((sum(nu.in_app_read)::numeric / sum(nu.in_app_sent)::numeric) * 100, 2)
      else 0 
    end as in_app_read_rate,
    coalesce(sum(nu.push_sent), 0)::integer as push_sent,
    coalesce(sum(nu.push_delivered), 0)::integer as push_delivered
  from notification_usage nu
  where nu.tenant_id = p_tenant_id
  and nu.period_start >= date_trunc('month', now())::date;
end;
$$ language plpgsql security definer;

-- Function to get unread in-app notification count
create or replace function get_unread_notification_count(p_user_id uuid)
returns integer as $$
begin
  return (
    select count(*)::integer
    from in_app_notifications
    where user_id = p_user_id and is_read = false
  );
end;
$$ language plpgsql security definer;
