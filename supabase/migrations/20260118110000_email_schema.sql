-- ═══════════════════════════════════════════════════════════════════════════
-- Email Add-on Schema
-- Tables for managing tenant email subscriptions, templates, and logs
-- ═══════════════════════════════════════════════════════════════════════════

-- Email subscriptions (which tier each tenant is on)
create table if not exists email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  tier text not null default 'free' check (tier in ('free', 'starter', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'trialing', 'canceled', 'past_due')),
  stripe_subscription_id text,
  current_period_start timestamptz default now(),
  current_period_end timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id)
);

-- Email domains (custom sending domains)
create table if not exists email_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  domain text not null,
  resend_domain_id text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed')),
  dns_records jsonb,
  created_at timestamptz default now(),
  verified_at timestamptz,
  unique(tenant_id, domain)
);

-- Email templates
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  slug text not null,
  subject text not null,
  html_body text not null,
  text_body text,
  variables text[] default '{}',
  category text not null default 'transactional' check (category in ('transactional', 'marketing', 'notification')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, slug)
);

-- Email logs (sent emails)
create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  template_id uuid references email_templates(id) on delete set null,
  resend_id text,
  from_email text not null,
  to_email text not null,
  cc text[],
  bcc text[],
  subject text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Email usage tracking (per tenant, per period)
create table if not exists email_usage (
  tenant_id uuid references tenants(id) on delete cascade,
  period_start date not null,
  emails_sent integer default 0,
  emails_delivered integer default 0,
  emails_opened integer default 0,
  emails_clicked integer default 0,
  emails_bounced integer default 0,
  emails_complained integer default 0,
  updated_at timestamptz default now(),
  primary key (tenant_id, period_start)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists idx_email_subscriptions_tenant on email_subscriptions(tenant_id);
create index if not exists idx_email_domains_tenant on email_domains(tenant_id);
create index if not exists idx_email_domains_domain on email_domains(domain);
create index if not exists idx_email_templates_tenant on email_templates(tenant_id);
create index if not exists idx_email_templates_slug on email_templates(tenant_id, slug);
create index if not exists idx_email_logs_tenant on email_logs(tenant_id);
create index if not exists idx_email_logs_status on email_logs(status);
create index if not exists idx_email_logs_created on email_logs(created_at);
create index if not exists idx_email_logs_resend on email_logs(resend_id);
create index if not exists idx_email_usage_tenant on email_usage(tenant_id);
create index if not exists idx_email_usage_period on email_usage(period_start);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

alter table email_subscriptions enable row level security;
alter table email_domains enable row level security;
alter table email_templates enable row level security;
alter table email_logs enable row level security;
alter table email_usage enable row level security;

-- Subscriptions
drop policy if exists "Users can view their email subscription" on email_subscriptions;
create policy "Users can view their email subscription"
  on email_subscriptions for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Domains
drop policy if exists "Users can view their email domains" on email_domains;
create policy "Users can view their email domains"
  on email_domains for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email domains" on email_domains;
create policy "Users can manage their email domains"
  on email_domains for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Templates
drop policy if exists "Users can view their email templates" on email_templates;
create policy "Users can view their email templates"
  on email_templates for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

drop policy if exists "Users can manage their email templates" on email_templates;
create policy "Users can manage their email templates"
  on email_templates for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Logs
drop policy if exists "Users can view their email logs" on email_logs;
create policy "Users can view their email logs"
  on email_logs for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Usage
drop policy if exists "Users can view their email usage" on email_usage;
create policy "Users can view their email usage"
  on email_usage for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to increment email usage
create or replace function increment_email_usage(
  p_tenant_id uuid,
  p_period_start date,
  p_field text
)
returns void as $$
begin
  insert into email_usage (tenant_id, period_start)
  values (p_tenant_id, p_period_start)
  on conflict (tenant_id, period_start) do nothing;
  
  execute format(
    'update email_usage set %I = %I + 1, updated_at = now() where tenant_id = $1 and period_start = $2',
    p_field, p_field
  ) using p_tenant_id, p_period_start;
end;
$$ language plpgsql security definer;

-- Function to get tenant email stats
create or replace function get_tenant_email_stats(p_tenant_id uuid)
returns table (
  total_sent integer,
  total_delivered integer,
  total_opened integer,
  total_clicked integer,
  total_bounced integer,
  delivery_rate numeric,
  open_rate numeric
) as $$
begin
  return query
  select
    coalesce(sum(emails_sent), 0)::integer as total_sent,
    coalesce(sum(emails_delivered), 0)::integer as total_delivered,
    coalesce(sum(emails_opened), 0)::integer as total_opened,
    coalesce(sum(emails_clicked), 0)::integer as total_clicked,
    coalesce(sum(emails_bounced), 0)::integer as total_bounced,
    case 
      when sum(emails_sent) > 0 
      then round((sum(emails_delivered)::numeric / sum(emails_sent)::numeric) * 100, 2)
      else 0 
    end as delivery_rate,
    case 
      when sum(emails_delivered) > 0 
      then round((sum(emails_opened)::numeric / sum(emails_delivered)::numeric) * 100, 2)
      else 0 
    end as open_rate
  from email_usage
  where tenant_id = p_tenant_id
  and period_start >= date_trunc('month', now())::date;
end;
$$ language plpgsql security definer;
