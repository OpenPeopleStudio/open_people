-- ═══════════════════════════════════════════════════════════════════════════
-- Email Workspace Schema
-- AI-first SMB email workspace with threads, AI triage, collaboration, and analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- Core Email Workspace Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Email threads (conversations) - groups related messages
create table if not exists email_threads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,

  -- Thread metadata
  subject text not null,
  participants jsonb not null default '[]', -- [{email, name, role: 'from'|'to'|'cc'|'bcc'}]
  message_count integer default 0,
  last_message_at timestamptz,

  -- AI processing
  ai_summary text,
  ai_priority_score numeric check (ai_priority_score >= 0 and ai_priority_score <= 1),
  ai_intent text check (ai_intent in ('support', 'sales', 'admin', 'internal', 'spam', 'unknown')),
  ai_sentiment text check (ai_sentiment in ('positive', 'neutral', 'negative')),
  ai_processed_at timestamptz,

  -- Status
  status text not null default 'active' check (status in ('active', 'resolved', 'archived', 'spam')),

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email labels (tags for organization)
create table if not exists email_labels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  color text not null default '#6B7280', -- hex color
  is_system boolean default false, -- system labels can't be deleted
  created_at timestamptz default now(),
  unique(tenant_id, name)
);

-- Thread labels junction table
create table if not exists email_thread_labels (
  thread_id uuid references email_threads(id) on delete cascade not null,
  label_id uuid references email_labels(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (thread_id, label_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Collaboration Features
-- ═══════════════════════════════════════════════════════════════════════════

-- Thread assignments (who owns/responsible for a thread)
create table if not exists email_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  thread_id uuid references email_threads(id) on delete cascade not null,
  assignee_id uuid references profiles(id) on delete cascade not null,
  assigned_by uuid references profiles(id) on delete set null,
  assigned_at timestamptz default now(),
  due_at timestamptz, -- SLA deadline
  status text not null default 'active' check (status in ('active', 'completed', 'escalated')),
  notes text,
  unique(thread_id, assignee_id)
);

-- Thread comments (internal notes and @mentions)
create table if not exists email_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  thread_id uuid references email_threads(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  mentions jsonb default '[]', -- [{user_id, username}]
  is_internal boolean default true, -- internal notes vs customer-visible
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SLA configurations (response time targets)
create table if not exists email_slas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  name text not null,
  description text,
  priority text not null check (priority in ('urgent', 'high', 'normal', 'low')),
  response_time_hours integer not null default 24,
  resolution_time_hours integer default 72,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, priority)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- AI Automation & Rules
-- ═══════════════════════════════════════════════════════════════════════════

-- AI processing queue (messages waiting for AI analysis)
create table if not exists email_ai_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  message_id uuid references email_messages(id) on delete cascade not null,
  thread_id uuid references email_threads(id) on delete set null,

  -- Processing status
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  priority integer default 0, -- higher = more urgent

  -- AI tasks to perform
  tasks jsonb not null default '[]', -- ['summarize', 'classify', 'suggest_reply', 'extract_action_items']

  -- Results
  results jsonb default '{}',
  error_message text,

  -- Processing metadata
  started_at timestamptz,
  completed_at timestamptz,
  retry_count integer default 0,
  max_retries integer default 3,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Automation rules (auto-label, auto-assign, auto-reply)
create table if not exists email_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,

  name text not null,
  description text,
  is_active boolean default true,

  -- Trigger conditions
  conditions jsonb not null default '[]', -- [{field, operator, value}]

  -- Actions to take
  actions jsonb not null default '[]', -- [{type: 'label'|'assign'|'sla'|'webhook', config: {...}}]

  -- Processing order
  priority integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI suggested replies
create table if not exists email_suggestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,
  message_id uuid references email_messages(id) on delete cascade not null,
  thread_id uuid references email_threads(id) on delete cascade not null,

  -- Suggestion content
  subject text,
  body_html text,
  body_text text,
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 1),

  -- Usage tracking
  used_at timestamptz,
  used_by uuid references profiles(id) on delete set null,

  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Admin & Safety Features
-- ═══════════════════════════════════════════════════════════════════════════

-- Email policies (org-wide settings)
create table if not exists email_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,

  -- Policy types
  signature_template text, -- HTML template for email signatures
  allowed_domains text[], -- domains users can send from
  blocked_domains text[], -- domains to block incoming from
  max_attachment_size_mb integer default 10,
  require_tls boolean default true,

  -- DLP patterns
  dlp_patterns jsonb default '[]', -- [{name, pattern, action: 'block'|'warn'|'allow'}]

  -- Auto-processing settings
  auto_archive_days integer default 30,
  auto_delete_spam_days integer default 7,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id)
);

-- Audit log (security and compliance events)
create table if not exists email_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade not null,

  -- Event details
  event_type text not null, -- 'send', 'receive', 'assign', 'comment', 'rule_trigger', 'policy_change'
  event_subtype text, -- specific action like 'auto_reply', 'manual_send'

  -- Actor and target
  user_id uuid references profiles(id) on delete set null,
  thread_id uuid references email_threads(id) on delete set null,
  message_id uuid references email_messages(id) on delete set null,

  -- Event data
  metadata jsonb default '{}',
  ip_address inet,
  user_agent text,

  created_at timestamptz default now()
);

-- Rate limiting and abuse prevention
create table if not exists email_rate_limits (
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,

  -- Rate limit windows
  minute_count integer default 0,
  minute_window timestamptz default now(),
  hour_count integer default 0,
  hour_window timestamptz default now(),
  day_count integer default 0,
  day_window timestamptz default now(),

  -- Block status
  is_blocked boolean default false,
  blocked_until timestamptz,
  block_reason text,

  updated_at timestamptz default now(),
  primary key (tenant_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Analytics & Metrics
-- ═══════════════════════════════════════════════════════════════════════════

-- Email metrics (aggregated stats)
create table if not exists email_metrics (
  tenant_id uuid references tenants(id) on delete cascade,
  period_start date not null,

  -- Message counts
  messages_received integer default 0,
  messages_sent integer default 0,
  messages_inbound integer default 0,
  messages_outbound integer default 0,

  -- Response metrics
  avg_response_time_hours numeric,
  sla_hit_rate numeric check (sla_hit_rate >= 0 and sla_hit_rate <= 1),
  resolution_rate numeric check (resolution_rate >= 0 and resolution_rate <= 1),

  -- AI metrics
  ai_processed_messages integer default 0,
  ai_suggestion_usage_rate numeric check (ai_suggestion_usage_rate >= 0 and ai_suggestion_usage_rate <= 1),
  time_saved_hours numeric,

  -- User engagement
  active_users integer default 0,
  assignments_completed integer default 0,

  updated_at timestamptz default now(),
  primary key (tenant_id, period_start)
);

-- User activity tracking
create table if not exists email_user_activity (
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  period_start date not null,

  -- Activity counts
  messages_read integer default 0,
  messages_sent integer default 0,
  assignments_taken integer default 0,
  assignments_completed integer default 0,
  comments_added integer default 0,

  -- Time tracking
  time_spent_minutes integer default 0,
  ai_suggestions_used integer default 0,

  updated_at timestamptz default now(),
  primary key (tenant_id, user_id, period_start)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

-- Threads
create index if not exists idx_email_threads_tenant on email_threads(tenant_id);
create index if not exists idx_email_threads_status on email_threads(status);
create index if not exists idx_email_threads_ai_intent on email_threads(ai_intent);
create index if not exists idx_email_threads_priority on email_threads(ai_priority_score desc);
create index if not exists idx_email_threads_last_message on email_threads(last_message_at desc);
create index if not exists idx_email_threads_participants on email_threads using gin(participants);

-- Labels
create index if not exists idx_email_labels_tenant on email_labels(tenant_id);

-- Assignments
create index if not exists idx_email_assignments_tenant on email_assignments(tenant_id);
create index if not exists idx_email_assignments_thread on email_assignments(thread_id);
create index if not exists idx_email_assignments_assignee on email_assignments(assignee_id);
create index if not exists idx_email_assignments_status on email_assignments(status);
create index if not exists idx_email_assignments_due on email_assignments(due_at) where due_at is not null;

-- Comments
create index if not exists idx_email_comments_tenant on email_comments(tenant_id);
create index if not exists idx_email_comments_thread on email_comments(thread_id);
create index if not exists idx_email_comments_author on email_comments(author_id);
create index if not exists idx_email_comments_created on email_comments(created_at desc);

-- SLAs
create index if not exists idx_email_slas_tenant on email_slas(tenant_id);

-- AI Queue
create index if not exists idx_email_ai_queue_tenant on email_ai_queue(tenant_id);
create index if not exists idx_email_ai_queue_status on email_ai_queue(status);
create index if not exists idx_email_ai_queue_priority on email_ai_queue(priority desc);
create index if not exists idx_email_ai_queue_message on email_ai_queue(message_id);

-- Rules
create index if not exists idx_email_rules_tenant on email_rules(tenant_id);
create index if not exists idx_email_rules_active on email_rules(tenant_id, is_active) where is_active = true;

-- Suggestions
create index if not exists idx_email_suggestions_tenant on email_suggestions(tenant_id);
create index if not exists idx_email_suggestions_message on email_suggestions(message_id);
create index if not exists idx_email_suggestions_thread on email_suggestions(thread_id);
create index if not exists idx_email_suggestions_used on email_suggestions(used_at) where used_at is not null;

-- Policies
create index if not exists idx_email_policies_tenant on email_policies(tenant_id);

-- Audit Log
create index if not exists idx_email_audit_log_tenant on email_audit_log(tenant_id);
create index if not exists idx_email_audit_log_event on email_audit_log(event_type, created_at desc);
create index if not exists idx_email_audit_log_user on email_audit_log(user_id, created_at desc);
create index if not exists idx_email_audit_log_thread on email_audit_log(thread_id);

-- Rate Limits
create index if not exists idx_email_rate_limits_blocked on email_rate_limits(is_blocked) where is_blocked = true;

-- Metrics
create index if not exists idx_email_metrics_tenant on email_metrics(tenant_id);
create index if not exists idx_email_metrics_period on email_metrics(period_start);

-- User Activity
create index if not exists idx_email_user_activity_tenant on email_user_activity(tenant_id);
create index if not exists idx_email_user_activity_user on email_user_activity(user_id);
create index if not exists idx_email_user_activity_period on email_user_activity(period_start);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table email_threads enable row level security;
alter table email_labels enable row level security;
alter table email_thread_labels enable row level security;
alter table email_assignments enable row level security;
alter table email_comments enable row level security;
alter table email_slas enable row level security;
alter table email_ai_queue enable row level security;
alter table email_rules enable row level security;
alter table email_suggestions enable row level security;
alter table email_policies enable row level security;
alter table email_audit_log enable row level security;
alter table email_rate_limits enable row level security;
alter table email_metrics enable row level security;
alter table email_user_activity enable row level security;

-- Threads: Users can view threads for their tenant
create policy "Users can view threads in their tenant"
  on email_threads for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage threads in their tenant"
  on email_threads for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Labels: Users can view/manage labels for their tenant
create policy "Users can view labels in their tenant"
  on email_labels for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage labels in their tenant"
  on email_labels for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Thread Labels: Users can manage labels on threads in their tenant
create policy "Users can manage thread labels in their tenant"
  on email_thread_labels for all
  using (
    exists (
      select 1 from email_threads t
      where t.id = thread_id
      and t.tenant_id in (
        select tenant_id from profiles where id = auth.uid()
      )
    )
  );

-- Assignments: Users can view/manage assignments for their tenant
create policy "Users can view assignments in their tenant"
  on email_assignments for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage assignments in their tenant"
  on email_assignments for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Comments: Users can view/manage comments for their tenant
create policy "Users can view comments in their tenant"
  on email_comments for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage comments in their tenant"
  on email_comments for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- SLAs: Users can view/manage SLAs for their tenant
create policy "Users can view SLAs in their tenant"
  on email_slas for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage SLAs in their tenant"
  on email_slas for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- AI Queue: Internal service access only (no user policies needed)
-- Rules: Users can view/manage rules for their tenant
create policy "Users can view rules in their tenant"
  on email_rules for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage rules in their tenant"
  on email_rules for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Suggestions: Users can view suggestions for their tenant
create policy "Users can view suggestions in their tenant"
  on email_suggestions for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Policies: Users can view/manage policies for their tenant
create policy "Users can view policies in their tenant"
  on email_policies for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage policies in their tenant"
  on email_policies for all
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Audit Log: Users can view audit logs for their tenant
create policy "Users can view audit logs in their tenant"
  on email_audit_log for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- Rate Limits: Users can view their own rate limits
create policy "Users can view their rate limits"
  on email_rate_limits for select
  using (
    user_id = auth.uid()
  );

-- Metrics: Users can view metrics for their tenant
create policy "Users can view metrics in their tenant"
  on email_metrics for select
  using (
    tenant_id in (
      select tenant_id from profiles where id = auth.uid()
    )
  );

-- User Activity: Users can view their own activity
create policy "Users can view their activity"
  on email_user_activity for select
  using (
    user_id = auth.uid()
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Functions & Triggers
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to create thread from message
create or replace function create_thread_from_message(
  p_message_id uuid,
  p_subject text default null,
  p_participants jsonb default null
)
returns uuid as $$
declare
  v_thread_id uuid;
  v_message email_messages%rowtype;
  v_subject text;
  v_participants jsonb;
begin
  -- Get message details
  select * into v_message from email_messages where id = p_message_id;

  -- Determine subject
  v_subject := coalesce(p_subject, v_message.subject, '(no subject)');

  -- Build participants array
  if p_participants is not null then
    v_participants := p_participants;
  else
    v_participants := jsonb_build_array(
      jsonb_build_object(
        'email', v_message.from_address,
        'name', v_message.from_name,
        'role', 'from'
      )
    );

    -- Add to recipients
    if v_message.to_addresses is not null then
      for i in 0..jsonb_array_length(v_message.to_addresses) - 1 loop
        v_participants := v_participants || jsonb_build_object(
          'email', v_message.to_addresses->i->>'email',
          'name', v_message.to_addresses->i->>'name',
          'role', 'to'
        );
      end loop;
    end if;

    -- Add CC recipients
    if v_message.cc_addresses is not null then
      for i in 0..jsonb_array_length(v_message.cc_addresses) - 1 loop
        v_participants := v_participants || jsonb_build_object(
          'email', v_message.cc_addresses->i->>'email',
          'name', v_message.cc_addresses->i->>'name',
          'role', 'cc'
        );
      end loop;
    end if;
  end if;

  -- Create thread
  insert into email_threads (
    tenant_id,
    subject,
    participants,
    message_count,
    last_message_at
  ) values (
    v_message.tenant_id,
    v_subject,
    v_participants,
    1,
    v_message.received_at
  ) returning id into v_thread_id;

  -- Update message with thread_id
  update email_messages
  set thread_id = v_thread_id, updated_at = now()
  where id = p_message_id;

  return v_thread_id;
end;
$$ language plpgsql security definer;

-- Function to add message to existing thread
create or replace function add_message_to_thread(
  p_message_id uuid,
  p_thread_id uuid
)
returns void as $$
declare
  v_message email_messages%rowtype;
begin
  -- Get message details
  select * into v_message from email_messages where id = p_message_id;

  -- Update message thread
  update email_messages
  set thread_id = p_thread_id, updated_at = now()
  where id = p_message_id;

  -- Update thread stats
  update email_threads
  set
    message_count = message_count + 1,
    last_message_at = greatest(last_message_at, v_message.received_at),
    updated_at = now()
  where id = p_thread_id;

end;
$$ language plpgsql security definer;

-- Function to assign thread to user
create or replace function assign_thread_to_user(
  p_thread_id uuid,
  p_assignee_id uuid,
  p_assigned_by uuid default null,
  p_due_at timestamptz default null,
  p_notes text default null
)
returns uuid as $$
declare
  v_assignment_id uuid;
  v_tenant_id uuid;
begin
  -- Get tenant_id from thread
  select tenant_id into v_tenant_id from email_threads where id = p_thread_id;

  -- Create assignment
  insert into email_assignments (
    tenant_id,
    thread_id,
    assignee_id,
    assigned_by,
    due_at,
    notes
  ) values (
    v_tenant_id,
    p_thread_id,
    p_assignee_id,
    coalesce(p_assigned_by, auth.uid()),
    p_due_at,
    p_notes
  ) returning id into v_assignment_id;

  -- Update thread status if newly assigned
  update email_threads
  set status = 'active', updated_at = now()
  where id = p_thread_id and status = 'unassigned';

  return v_assignment_id;
end;
$$ language plpgsql security definer;

-- Function to log audit events
create or replace function log_email_event(
  p_tenant_id uuid,
  p_event_type text,
  p_event_subtype text default null,
  p_user_id uuid default null,
  p_thread_id uuid default null,
  p_message_id uuid default null,
  p_metadata jsonb default '{}',
  p_ip_address inet default null,
  p_user_agent text default null
)
returns void as $$
begin
  insert into email_audit_log (
    tenant_id,
    event_type,
    event_subtype,
    user_id,
    thread_id,
    message_id,
    metadata,
    ip_address,
    user_agent
  ) values (
    p_tenant_id,
    p_event_type,
    p_event_subtype,
    p_user_id,
    p_thread_id,
    p_message_id,
    p_metadata,
    p_ip_address,
    p_user_agent
  );
end;
$$ language plpgsql security definer;

-- Function to check rate limits
create or replace function check_email_rate_limit(
  p_tenant_id uuid,
  p_user_id uuid,
  p_action text default 'send'
)
returns table (
  allowed boolean,
  remaining_attempts integer,
  reset_at timestamptz
) as $$
declare
  v_limits record;
  v_minute_limit integer := 60;  -- 60 emails per minute
  v_hour_limit integer := 1000;  -- 1000 emails per hour
  v_day_limit integer := 5000;   -- 5000 emails per day
begin
  -- Get current limits
  select * into v_limits
  from email_rate_limits
  where tenant_id = p_tenant_id and user_id = p_user_id;

  -- Initialize if not exists
  if v_limits is null then
    insert into email_rate_limits (tenant_id, user_id)
    values (p_tenant_id, p_user_id)
    returning * into v_limits;
  end if;

  -- Reset windows if needed
  if v_limits.minute_window < now() - interval '1 minute' then
    update email_rate_limits
    set minute_count = 0, minute_window = now()
    where tenant_id = p_tenant_id and user_id = p_user_id;
    v_limits.minute_count := 0;
    v_limits.minute_window := now();
  end if;

  if v_limits.hour_window < now() - interval '1 hour' then
    update email_rate_limits
    set hour_count = 0, hour_window = now()
    where tenant_id = p_tenant_id and user_id = p_user_id;
    v_limits.hour_count := 0;
    v_limits.hour_window := now();
  end if;

  if v_limits.day_window < now() - interval '1 day' then
    update email_rate_limits
    set day_count = 0, day_window = now()
    where tenant_id = p_tenant_id and user_id = p_user_id;
    v_limits.day_count := 0;
    v_limits.day_window := now();
  end if;

  -- Check if blocked
  if v_limits.is_blocked and v_limits.blocked_until > now() then
    return query select false, 0, v_limits.blocked_until;
    return;
  end if;

  -- Check limits
  if v_limits.minute_count >= v_minute_limit then
    return query select false, 0, v_limits.minute_window + interval '1 minute';
    return;
  elsif v_limits.hour_count >= v_hour_limit then
    return query select false, 0, v_limits.hour_window + interval '1 hour';
    return;
  elsif v_limits.day_count >= v_day_limit then
    return query select false, 0, v_limits.day_window + interval '1 day';
    return;
  end if;

  -- Calculate remaining attempts (use the most restrictive limit)
  return query select
    true,
    least(
      v_minute_limit - v_limits.minute_count,
      v_hour_limit - v_limits.hour_count,
      v_day_limit - v_limits.day_count
    ),
    least(
      v_limits.minute_window + interval '1 minute',
      v_limits.hour_window + interval '1 hour',
      v_limits.day_window + interval '1 day'
    );
end;
$$ language plpgsql security definer;

-- Function to increment rate limit counters
create or replace function increment_rate_limit(
  p_tenant_id uuid,
  p_user_id uuid
)
returns void as $$
begin
  insert into email_rate_limits (tenant_id, user_id, minute_count, hour_count, day_count)
  values (p_tenant_id, p_user_id, 1, 1, 1)
  on conflict (tenant_id, user_id) do update set
    minute_count = case when email_rate_limits.minute_window >= now() - interval '1 minute'
                       then email_rate_limits.minute_count + 1 else 1 end,
    minute_window = case when email_rate_limits.minute_window >= now() - interval '1 minute'
                        then email_rate_limits.minute_window else now() end,
    hour_count = case when email_rate_limits.hour_window >= now() - interval '1 hour'
                     then email_rate_limits.hour_count + 1 else 1 end,
    hour_window = case when email_rate_limits.hour_window >= now() - interval '1 hour'
                      then email_rate_limits.hour_window else now() end,
    day_count = case when email_rate_limits.day_window >= now() - interval '1 day'
                    then email_rate_limits.day_count + 1 else 1 end,
    day_window = case when email_rate_limits.day_window >= now() - interval '1 day'
                     then email_rate_limits.day_window else now() end,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Function to get thread stats for dashboard
create or replace function get_thread_stats(p_tenant_id uuid)
returns table (
  total_threads bigint,
  active_threads bigint,
  resolved_threads bigint,
  urgent_threads bigint,
  assigned_threads bigint,
  unassigned_threads bigint,
  overdue_assignments bigint
) as $$
begin
  return query
  select
    count(*) as total_threads,
    count(*) filter (where status = 'active') as active_threads,
    count(*) filter (where status = 'resolved') as resolved_threads,
    count(*) filter (where ai_priority_score >= 0.8) as urgent_threads,
    count(distinct t.id) filter (where exists (select 1 from email_assignments a where a.thread_id = t.id and a.status = 'active')) as assigned_threads,
    count(*) filter (where not exists (select 1 from email_assignments a where a.thread_id = t.id and a.status = 'active')) as unassigned_threads,
    count(distinct a.id) filter (where a.due_at < now() and a.status = 'active') as overdue_assignments
  from email_threads t
  left join email_assignments a on a.thread_id = t.id
  where t.tenant_id = p_tenant_id;
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════════════════════
-- Update Triggers
-- ═══════════════════════════════════════════════════════════════════════════

-- Update email_messages to link to threads
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

-- Update triggers for new tables
create or replace function update_email_threads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_threads_updated_at on email_threads;
create trigger email_threads_updated_at
  before update on email_threads
  for each row
  execute function update_email_threads_updated_at();

create or replace function update_email_assignments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_assignments_updated_at on email_assignments;
create trigger email_assignments_updated_at
  before update on email_assignments
  for each row
  execute function update_email_assignments_updated_at();

create or replace function update_email_comments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_comments_updated_at on email_comments;
create trigger email_comments_updated_at
  before update on email_comments
  for each row
  execute function update_email_comments_updated_at();

create or replace function update_email_slas_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_slas_updated_at on email_slas;
create trigger email_slas_updated_at
  before update on email_slas
  for each row
  execute function update_email_slas_updated_at();

create or replace function update_email_rules_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_rules_updated_at on email_rules;
create trigger email_rules_updated_at
  before update on email_rules
  for each row
  execute function update_email_rules_updated_at();

create or replace function update_email_suggestions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_suggestions_updated_at on email_suggestions;
create trigger email_suggestions_updated_at
  before update on email_suggestions
  for each row
  execute function update_email_suggestions_updated_at();

create or replace function update_email_policies_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_policies_updated_at on email_policies;
create trigger email_policies_updated_at
  before update on email_policies
  for each row
  execute function update_email_policies_updated_at();

create or replace function update_email_audit_log_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_audit_log_updated_at on email_audit_log;
create trigger email_audit_log_updated_at
  before update on email_audit_log
  for each row
  execute function update_email_audit_log_updated_at();

create or replace function update_email_rate_limits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_rate_limits_updated_at on email_rate_limits;
create trigger email_rate_limits_updated_at
  before update on email_rate_limits
  for each row
  execute function update_email_rate_limits_updated_at();

create or replace function update_email_metrics_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_metrics_updated_at on email_metrics;
create trigger email_metrics_updated_at
  before update on email_metrics
  for each row
  execute function update_email_metrics_updated_at();

create or replace function update_email_user_activity_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists email_user_activity_updated_at on email_user_activity;
create trigger email_user_activity_updated_at
  before update on email_user_activity
  for each row
  execute function update_email_user_activity_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Additional Functions for Analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to get email usage stats for a period
create or replace function get_email_usage_stats(p_tenant_id uuid, p_period_start date)
returns table (
  messages_received bigint,
  messages_sent bigint,
  messages_inbound bigint,
  messages_outbound bigint
) as $$
begin
  return query
  select
    count(*) filter (where direction = 'inbound') as messages_received,
    count(*) filter (where direction = 'outbound') as messages_sent,
    count(*) filter (where direction = 'inbound') as messages_inbound,
    count(*) filter (where direction = 'outbound') as messages_outbound
  from email_messages
  where tenant_id = p_tenant_id
    and date_trunc('day', created_at) = p_period_start;
end;
$$ language plpgsql security definer;

-- Function to calculate response time metrics
create or replace function calculate_response_metrics(p_tenant_id uuid, p_period_start date)
returns table (
  avg_response_time_hours numeric
) as $$
begin
  return query
  select
    avg(extract(epoch from (r.created_at - m.created_at)) / 3600) as avg_response_time_hours
  from email_messages m
  join email_messages r on r.thread_id = m.thread_id
    and r.direction = 'outbound'
    and r.created_at > m.created_at
  where m.tenant_id = p_tenant_id
    and m.direction = 'inbound'
    and date_trunc('day', m.created_at) = p_period_start
    and not exists (
      select 1 from email_messages r2
      where r2.thread_id = m.thread_id
        and r2.direction = 'outbound'
        and r2.created_at > m.created_at
        and r2.created_at < r.created_at
    );
end;
$$ language plpgsql security definer;

-- Function to calculate AI usage metrics
create or replace function calculate_ai_usage_metrics(p_tenant_id uuid, p_period_start date)
returns table (
  ai_processed_messages bigint,
  ai_suggestion_usage_rate numeric,
  time_saved_hours numeric
) as $$
declare
  total_messages bigint;
  suggestions_used bigint;
begin
  -- Get AI processed messages
  select count(*) into ai_processed_messages
  from email_ai_queue
  where tenant_id = p_tenant_id
    and date_trunc('day', completed_at) = p_period_start
    and status = 'completed';

  -- Get suggestion usage
  select count(*) into suggestions_used
  from email_suggestions
  where tenant_id = p_tenant_id
    and date_trunc('day', used_at) = p_period_start
    and used_at is not null;

  -- Get total messages for rate calculation
  select count(*) into total_messages
  from email_messages
  where tenant_id = p_tenant_id
    and direction = 'inbound'
    and date_trunc('day', created_at) = p_period_start;

  -- Estimate time saved (rough calculation: 2 minutes saved per AI suggestion used)
  time_saved_hours := (suggestions_used * 2.0) / 60.0;

  return query select
    ai_processed_messages,
    case when total_messages > 0 then (suggestions_used::numeric / total_messages::numeric) * 100 else 0 end,
    time_saved_hours;
end;
$$ language plpgsql security definer;

-- Function to get active email users
create or replace function get_active_email_users(p_tenant_id uuid, p_period_start date)
returns table (active_users bigint) as $$
begin
  return query
  select count(distinct user_id) as active_users
  from email_user_activity
  where tenant_id = p_tenant_id
    and period_start = p_period_start
    and (
      messages_read > 0 or
      messages_sent > 0 or
      assignments_taken > 0 or
      comments_added > 0
    );
end;
$$ language plpgsql security definer;

-- Function to calculate SLA metrics
create or replace function calculate_sla_metrics(p_tenant_id uuid, p_period_start date)
returns table (
  sla_hit_rate numeric,
  resolution_rate numeric,
  assignments_completed bigint
) as $$
declare
  total_assignments bigint;
  completed_assignments bigint;
  on_time_assignments bigint;
begin
  select
    count(*) as total,
    count(*) filter (where status = 'completed') as completed,
    count(*) filter (
      where status = 'completed'
      and due_at is not null
      and due_at >= created_at
    ) as on_time
  into total_assignments, completed_assignments, on_time_assignments
  from email_assignments
  where tenant_id = p_tenant_id
    and date_trunc('day', created_at) = p_period_start;

  return query select
    case when completed_assignments > 0 then (on_time_assignments::numeric / completed_assignments::numeric) * 100 else 0 end,
    case when total_assignments > 0 then (completed_assignments::numeric / total_assignments::numeric) * 100 else 0 end,
    completed_assignments;
end;
$$ language plpgsql security definer;

-- Function to calculate user email activity
create or replace function calculate_user_email_activity(p_tenant_id uuid, p_user_id uuid, p_period_start date)
returns table (
  messages_read bigint,
  messages_sent bigint,
  assignments_taken bigint,
  assignments_completed bigint,
  comments_added bigint,
  time_spent_minutes bigint,
  ai_suggestions_used bigint
) as $$
begin
  return query
  select
    coalesce(sum(eua.messages_read), 0)::bigint,
    coalesce(sum(eua.messages_sent), 0)::bigint,
    coalesce(sum(eua.assignments_taken), 0)::bigint,
    coalesce(sum(eua.assignments_completed), 0)::bigint,
    coalesce(sum(eua.comments_added), 0)::bigint,
    coalesce(sum(eua.time_spent_minutes), 0)::bigint,
    coalesce(sum(eua.ai_suggestions_used), 0)::bigint
  from email_user_activity eua
  where eua.tenant_id = p_tenant_id
    and eua.user_id = p_user_id
    and eua.period_start = p_period_start;
end;
$$ language plpgsql security definer;

-- Function to get tenants with email activity
create or replace function get_tenants_with_email_activity(p_date date)
returns table (tenant_id uuid) as $$
begin
  return query
  select distinct m.tenant_id
  from email_messages m
  where date_trunc('day', m.created_at) = p_date;
end;
$$ language plpgsql security definer;

-- Function to get tenant active email users
create or replace function get_tenant_active_email_users(p_tenant_id uuid, p_date date)
returns table (user_id uuid) as $$
begin
  return query
  select distinct eua.user_id
  from email_user_activity eua
  where eua.tenant_id = p_tenant_id
    and eua.period_start = p_date
    and (
      eua.messages_read > 0 or
      eua.messages_sent > 0 or
      eua.assignments_taken > 0 or
      eua.comments_added > 0
    );
end;
$$ language plpgsql security definer;

-- Function to get SLA performance summary
create or replace function get_sla_performance_summary(p_tenant_id uuid, p_days integer)
returns table (
  priority text,
  target_response_hours integer,
  actual_avg_response_hours numeric,
  hit_rate numeric,
  total_assignments bigint
) as $$
begin
  return query
  select
    s.priority,
    s.response_time_hours,
    avg(extract(epoch from (a.due_at - a.created_at)) / 3600) as actual_avg_response_hours,
    case
      when count(a.id) > 0
      then (count(*) filter (where a.status = 'completed' and a.due_at >= a.created_at)::numeric / count(a.id)::numeric) * 100
      else 0
    end as hit_rate,
    count(a.id) as total_assignments
  from email_slas s
  left join email_assignments a on a.tenant_id = s.tenant_id
    and date_trunc('day', a.created_at) >= (current_date - p_days)
  where s.tenant_id = p_tenant_id
    and s.is_active = true
  group by s.priority, s.response_time_hours;
end;
$$ language plpgsql security definer;

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed Data
-- ═══════════════════════════════════════════════════════════════════════════

-- Insert default system labels
insert into email_labels (tenant_id, name, color, is_system) values
  ('00000000-0000-0000-0000-000000000000', 'urgent', '#EF4444', true),
  ('00000000-0000-0000-0000-000000000000', 'important', '#F59E0B', true),
  ('00000000-0000-0000-0000-000000000000', 'follow-up', '#10B981', true),
  ('00000000-0000-0000-0000-000000000000', 'waiting', '#6B7280', true),
  ('00000000-0000-0000-0000-000000000000', 'spam', '#DC2626', true)
on conflict (tenant_id, name) do nothing;

-- Insert default SLA policies
insert into email_slas (tenant_id, name, description, priority, response_time_hours, resolution_time_hours) values
  ('00000000-0000-0000-0000-000000000000', 'Urgent Response', 'Critical issues requiring immediate attention', 'urgent', 1, 4),
  ('00000000-0000-0000-0000-000000000000', 'High Priority', 'Important business matters', 'high', 4, 24),
  ('00000000-0000-0000-0000-000000000000', 'Normal Priority', 'Standard business communications', 'normal', 24, 72),
  ('00000000-0000-0000-0000-000000000000', 'Low Priority', 'Non-urgent matters', 'low', 72, 168)
on conflict (tenant_id, priority) do nothing;