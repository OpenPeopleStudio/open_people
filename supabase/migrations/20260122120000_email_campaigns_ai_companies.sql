-- ═══════════════════════════════════════════════════════════════════════════
-- AI Companies + Email Campaign Drafts (Super Admin)
-- Draft-only mass email orchestration with curated companies and AI groups
-- ═══════════════════════════════════════════════════════════════════════════

-- Companies we like (platform-level; tenant_id optional for future multi-tenancy)
create table if not exists ai_companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,

  name text not null,
  website text,
  contact_email text,
  contact_name text,
  description text,
  tags text[] default '{}',
  category text,
  notes text,

  created_via_ai boolean default false,
  source_prompt text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(name)
);

create index if not exists ai_companies_tags_idx on ai_companies using gin (tags);

-- AI-created groupings of companies (e.g., “open-source friendly”, “cheap APIs”)
create table if not exists ai_company_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,

  name text not null,
  description text,
  tags text[] default '{}',
  strategy text,           -- short rationale for why the grouping exists
  created_via_ai boolean default false,
  source_prompt text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(name)
);

create index if not exists ai_company_groups_tags_idx on ai_company_groups using gin (tags);

-- Junction table: which companies belong to which groups
create table if not exists ai_company_group_members (
  group_id uuid references ai_company_groups(id) on delete cascade not null,
  company_id uuid references ai_companies(id) on delete cascade not null,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (group_id, company_id)
);

-- Campaign drafts (never send from here; compose handoff handles delivery)
create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  name text not null,
  subject text,
  body_text text,
  body_html text,
  status text not null default 'draft' check (status in ('draft')),
  audience_description text,
  generated_via_ai boolean default false,
  generation_prompt text,
  sender_account_id uuid references email_accounts(id) on delete set null,
  total_recipients integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists email_campaigns_status_idx on email_campaigns(status);

-- Campaign recipients (draft targets)
create table if not exists email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references email_campaigns(id) on delete cascade not null,
  company_id uuid references ai_companies(id) on delete set null,
  to_email text not null,
  to_name text,
  status text not null default 'draft' check (status in ('draft', 'excluded')),
  reason text,
  created_at timestamptz default now(),
  unique (campaign_id, to_email)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- AI Companies + Email Campaign Drafts (Super Admin)
-- Draft-only mass email orchestration with curated companies and AI groups
-- ═══════════════════════════════════════════════════════════════════════════

-- Companies we like (platform-level; tenant_id optional for future multi-tenancy)
create table if not exists ai_companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,

  name text not null,
  website text,
  contact_email text,
  contact_name text,
  description text,
  tags text[] default '{}',
  category text,
  notes text,

  created_via_ai boolean default false,
  source_prompt text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(name)
);

create index if not exists ai_companies_tags_idx on ai_companies using gin (tags);

-- AI-created groupings of companies (e.g., “open-source friendly”, “cheap APIs”)
create table if not exists ai_company_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,

  name text not null,
  description text,
  tags text[] default '{}',
  strategy text,           -- short rationale for why the grouping exists
  created_via_ai boolean default false,
  source_prompt text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(name)
);

create index if not exists ai_company_groups_tags_idx on ai_company_groups using gin (tags);

-- Junction table: which companies belong to which groups
create table if not exists ai_company_group_members (
  group_id uuid references ai_company_groups(id) on delete cascade not null,
  company_id uuid references ai_companies(id) on delete cascade not null,
  role text default 'member',
  created_at timestamptz default now(),
  primary key (group_id, company_id)
);

-- Campaign drafts (never send from here; compose handoff handles delivery)
create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  name text not null,
  subject text,
  body_text text,
  body_html text,
  status text not null default 'draft' check (status in ('draft')),
  audience_description text,
  generated_via_ai boolean default false,
  generation_prompt text,
  sender_account_id uuid references email_accounts(id) on delete set null,
  total_recipients integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists email_campaigns_status_idx on email_campaigns(status);

-- Campaign recipients (draft targets)
create table if not exists email_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references email_campaigns(id) on delete cascade not null,
  company_id uuid references ai_companies(id) on delete set null,
  to_email text not null,
  to_name text,
  status text not null default 'draft' check (status in ('draft', 'excluded')),
  reason text,
  created_at timestamptz default now(),
  unique (campaign_id, to_email)
);

