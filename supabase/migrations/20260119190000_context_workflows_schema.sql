-- ════════════════════════════════════════════════════════════════════════════
-- CONTEXT ASSEMBLY + WORKFLOWS + AUTOMATION + OBSERVABILITY
-- Production-ready AI platform infrastructure
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- PART 1: CONTEXT ASSEMBLY LAYER
-- Rules-based deterministic context building
-- ════════════════════════════════════════════════════════════════════════════

-- Context rules (always include X, exclude Y, conditions)
CREATE TABLE IF NOT EXISTS context_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rule identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Rule type
  rule_type VARCHAR(50) NOT NULL,  -- include, exclude, conditional
  priority INTEGER DEFAULT 100,     -- Lower = higher priority (for conflicts)
  
  -- What this rule applies to
  target_type VARCHAR(50) NOT NULL, -- file, folder, note, entity, document, fact, memory
  target_id UUID,                   -- Specific item (NULL = pattern match)
  target_pattern VARCHAR(500),      -- Pattern match (e.g., "contracts/*", tag:important)
  
  -- Conditions (when should this rule apply)
  conditions JSONB DEFAULT '{}',    -- {conversation_has_tag: "legal", time_of_day: "business_hours"}
  
  -- What to do
  action VARCHAR(50) NOT NULL,      -- always_include, always_exclude, include_if, exclude_if
  action_params JSONB DEFAULT '{}', -- Additional parameters for conditional actions
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context assemblies (saved configurations)
CREATE TABLE IF NOT EXISTS context_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assembly info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Static inclusions (always include these)
  static_notes UUID[] DEFAULT '{}',
  static_files UUID[] DEFAULT '{}',
  static_folders UUID[] DEFAULT '{}',
  static_entities UUID[] DEFAULT '{}',
  static_documents UUID[] DEFAULT '{}',
  
  -- Dynamic settings
  include_facts BOOLEAN DEFAULT true,
  include_memories BOOLEAN DEFAULT true,
  include_goals BOOLEAN DEFAULT true,
  include_profile BOOLEAN DEFAULT true,
  
  -- Filters
  fact_types TEXT[] DEFAULT '{}',
  memory_categories TEXT[] DEFAULT '{}',
  entity_types TEXT[] DEFAULT '{}',
  
  -- Rules to apply (in order)
  rule_ids UUID[] DEFAULT '{}',
  
  -- Limits
  max_tokens INTEGER DEFAULT 8000,
  max_facts INTEGER DEFAULT 20,
  max_memories INTEGER DEFAULT 15,
  max_chunks INTEGER DEFAULT 10,
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context assembly logs (what was actually assembled)
CREATE TABLE IF NOT EXISTS context_assembly_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID REFERENCES context_assemblies(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
  
  -- What was requested
  query TEXT,
  
  -- What rules were applied
  rules_applied JSONB DEFAULT '[]',  -- [{rule_id, rule_name, action, target}]
  
  -- What was included (final result)
  included_items JSONB DEFAULT '{}', -- {notes: [], files: [], facts: [], memories: [], chunks: []}
  excluded_items JSONB DEFAULT '{}', -- Items that were excluded by rules
  
  -- Stats
  total_tokens INTEGER,
  assembly_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 2: WORKFLOW & TASKS
-- Projects, tasks, routines, operating rhythms
-- ════════════════════════════════════════════════════════════════════════════

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Project info
  name VARCHAR(500) NOT NULL,
  description TEXT,
  slug VARCHAR(500),
  color VARCHAR(50),
  icon VARCHAR(100),
  
  -- Hierarchy
  parent_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, paused, completed, archived
  
  -- Dates
  start_date DATE,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Progress
  progress INTEGER DEFAULT 0,  -- 0-100
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Task info
  title VARCHAR(1000) NOT NULL,
  description TEXT,
  
  -- Hierarchy
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'todo',  -- todo, in_progress, blocked, done, cancelled
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal',  -- urgent, high, normal, low
  
  -- Dates
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Effort
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  
  -- Tags and labels
  tags TEXT[] DEFAULT '{}',
  labels JSONB DEFAULT '[]',
  
  -- Checklist (subtasks within the task)
  checklist JSONB DEFAULT '[]',  -- [{id, title, done, done_at}]
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB,  -- {frequency: 'weekly', interval: 1, days: ['mon', 'wed']}
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'finish_to_start',  -- finish_to_start, start_to_start, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Operating rhythms (weekly review, quarterly planning, etc.)
CREATE TABLE IF NOT EXISTS operating_rhythms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rhythm info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rhythm_type VARCHAR(50) NOT NULL,  -- daily, weekly, monthly, quarterly, yearly, custom
  
  -- Schedule
  schedule JSONB NOT NULL,  -- {day_of_week: 0, time: "09:00", timezone: "America/New_York"}
  
  -- Agenda/template
  agenda_template TEXT,  -- Markdown template for the session
  prompts JSONB DEFAULT '[]',  -- Reflection prompts
  
  -- Checklist items for this rhythm
  checklist_template JSONB DEFAULT '[]',  -- [{title, required}]
  
  -- What to review/include
  review_config JSONB DEFAULT '{}',  -- {include_completed_tasks: true, include_goals: true, etc.}
  
  -- Duration
  estimated_minutes INTEGER DEFAULT 30,
  
  -- Tracking
  last_completed_at TIMESTAMPTZ,
  streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Notifications
  reminder_minutes INTEGER DEFAULT 15,  -- Minutes before to remind
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rhythm completions (log of completed sessions)
CREATE TABLE IF NOT EXISTS rhythm_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rhythm_id UUID NOT NULL REFERENCES operating_rhythms(id) ON DELETE CASCADE,
  
  -- Session details
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Notes from the session
  notes TEXT,
  
  -- Checklist completion
  checklist_results JSONB DEFAULT '[]',
  
  -- Outcomes/decisions
  outcomes JSONB DEFAULT '[]',  -- [{type: 'decision', content: '...'}]
  
  -- AI summary of the session
  ai_summary TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What it's for
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Link to entity
  entity_type VARCHAR(50),  -- task, project, rhythm, custom
  entity_id UUID,
  
  -- When to remind
  remind_at TIMESTAMPTZ NOT NULL,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule JSONB,
  
  -- Delivery
  delivery_methods TEXT[] DEFAULT ARRAY['in_app'],  -- in_app, email, sms, push
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, snoozed, dismissed
  snoozed_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 3: AUTOMATION & INTEGRATIONS
-- Connectors, webhooks, job runner
-- ════════════════════════════════════════════════════════════════════════════

-- Integration connectors
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Integration type
  provider VARCHAR(100) NOT NULL,  -- google, slack, github, notion, linear, etc.
  
  -- Credentials (encrypted)
  credentials_encrypted TEXT,
  
  -- OAuth tokens
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Scopes
  scopes TEXT[] DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, expired, revoked, error
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks (incoming)
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Webhook config
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Endpoint
  endpoint_path VARCHAR(255) NOT NULL UNIQUE,  -- e.g., /api/webhooks/abc123
  secret_hash VARCHAR(255),
  
  -- What triggers it
  source VARCHAR(100),  -- github, stripe, custom, etc.
  events TEXT[] DEFAULT '{}',  -- push, pull_request, payment_success, etc.
  
  -- What to do
  action_type VARCHAR(50) NOT NULL,  -- create_task, send_notification, run_automation, custom
  action_config JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_calls INTEGER DEFAULT 0,
  last_called_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Request
  method VARCHAR(10),
  headers JSONB,
  body JSONB,
  
  -- Response
  status_code INTEGER,
  response JSONB,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  process_error TEXT,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation jobs (scheduled/triggered)
CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_type VARCHAR(50) NOT NULL,  -- schedule, webhook, event, manual
  trigger_config JSONB NOT NULL,      -- {cron: "0 9 * * 1"} or {event: "task.completed"}
  
  -- Actions (steps to execute)
  actions JSONB NOT NULL,  -- [{type: 'http', config: {...}}, {type: 'ai', config: {...}}]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job runs (execution history)
CREATE TABLE IF NOT EXISTS job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES automation_jobs(id) ON DELETE CASCADE,
  
  -- Trigger info
  triggered_by VARCHAR(50),  -- schedule, webhook, event, manual
  trigger_data JSONB,
  
  -- Execution
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(50) DEFAULT 'running',  -- running, completed, failed, cancelled
  
  -- Results
  steps_completed INTEGER DEFAULT 0,
  step_results JSONB DEFAULT '[]',
  
  -- Error
  error_message TEXT,
  error_step INTEGER,
  
  -- Logs
  logs TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 4: OBSERVABILITY & QUALITY
-- Enhanced tracing, feedback, cost tracking
-- ════════════════════════════════════════════════════════════════════════════

-- AI run tool calls (detailed trace of tool usage)
CREATE TABLE IF NOT EXISTS ai_run_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ai_runs(id) ON DELETE CASCADE,
  
  -- Tool info
  tool_name VARCHAR(255) NOT NULL,
  tool_type VARCHAR(50),  -- function, retrieval, code_interpreter, etc.
  
  -- Call details
  call_index INTEGER,  -- Order in the run
  arguments JSONB,
  
  -- Result
  result JSONB,
  result_preview TEXT,  -- First 500 chars
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed',  -- pending, completed, failed
  error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI feedback (good/bad answer)
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was rated
  run_id UUID REFERENCES ai_runs(id) ON DELETE CASCADE,
  message_id UUID REFERENCES ai_messages(id) ON DELETE CASCADE,
  
  -- Who rated
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rating
  rating VARCHAR(20) NOT NULL,  -- good, bad, neutral
  rating_score INTEGER,         -- 1-5 if more granular
  
  -- Feedback details
  feedback_type VARCHAR(50),    -- accuracy, helpfulness, tone, completeness, safety
  feedback_text TEXT,
  
  -- What was wrong (for bad ratings)
  issues TEXT[] DEFAULT '{}',   -- factual_error, incomplete, off_topic, harmful, etc.
  
  -- Corrections
  expected_answer TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI cost tracking (detailed)
CREATE TABLE IF NOT EXISTS ai_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to run
  run_id UUID REFERENCES ai_runs(id) ON DELETE CASCADE,
  
  -- Owner
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Model info
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  
  -- Usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  
  -- Costs (in USD, stored as cents for precision)
  input_cost_cents INTEGER NOT NULL DEFAULT 0,
  output_cost_cents INTEGER NOT NULL DEFAULT 0,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Additional costs
  embedding_tokens INTEGER DEFAULT 0,
  embedding_cost_cents INTEGER DEFAULT 0,
  
  -- Period for aggregation
  period_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost budgets
CREATE TABLE IF NOT EXISTS ai_cost_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Budget config
  period_type VARCHAR(20) NOT NULL,  -- daily, weekly, monthly
  budget_cents INTEGER NOT NULL,
  
  -- Current usage
  current_usage_cents INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  
  -- Alerts
  alert_threshold_percent INTEGER DEFAULT 80,
  alert_sent BOOLEAN DEFAULT false,
  
  -- What to do when exceeded
  on_exceed VARCHAR(50) DEFAULT 'warn',  -- warn, block, downgrade_model
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluation runs (for testing AI quality)
CREATE TABLE IF NOT EXISTS ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Evaluation config
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Test cases
  test_cases JSONB NOT NULL,  -- [{input, expected_output, criteria}]
  
  -- Run config
  model VARCHAR(100),
  system_prompt TEXT,
  
  -- Results
  last_run_at TIMESTAMPTZ,
  last_run_results JSONB,
  pass_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 5: SEARCH INDEX
-- Unified search across all entities
-- ════════════════════════════════════════════════════════════════════════════

-- Search index (denormalized for fast search)
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What this indexes
  entity_type VARCHAR(50) NOT NULL,  -- note, file, task, project, conversation, message, fact, memory
  entity_id UUID NOT NULL,
  
  -- Searchable content
  title TEXT,
  content TEXT,
  content_preview TEXT,  -- First 200 chars
  
  -- For semantic search
  embedding vector(1536),
  
  -- Metadata for filtering
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  status VARCHAR(50),
  
  -- Dates for filtering
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  -- Relevance boosting
  importance DECIMAL(3,2) DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Index management
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id)
);

-- Search queries log (for analytics and improving search)
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Query
  query TEXT NOT NULL,
  query_embedding vector(1536),
  
  -- Filters used
  filters JSONB DEFAULT '{}',
  
  -- Results
  result_count INTEGER,
  results_clicked JSONB DEFAULT '[]',  -- [{entity_type, entity_id, position}]
  
  -- Performance
  search_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ════════════════════════════════════════════════════════════════════════════

-- Context
CREATE INDEX idx_context_rules_owner ON context_rules(owner_id, is_active);
CREATE INDEX idx_context_assemblies_owner ON context_assemblies(owner_id);
CREATE INDEX idx_context_assembly_logs_conversation ON context_assembly_logs(conversation_id);

-- Projects & Tasks
CREATE INDEX idx_projects_owner ON projects(owner_id, status);
CREATE INDEX idx_tasks_owner ON tasks(owner_id, status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status NOT IN ('done', 'cancelled');
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE status NOT IN ('done', 'cancelled');

-- Rhythms
CREATE INDEX idx_operating_rhythms_owner ON operating_rhythms(owner_id, is_active);
CREATE INDEX idx_reminders_owner ON reminders(owner_id, status, remind_at);

-- Integrations
CREATE INDEX idx_integrations_owner ON integrations(owner_id, provider);
CREATE INDEX idx_webhooks_endpoint ON webhooks(endpoint_path);
CREATE INDEX idx_automation_jobs_owner ON automation_jobs(owner_id, is_active);
CREATE INDEX idx_job_runs_job ON job_runs(job_id, created_at DESC);

-- Observability
CREATE INDEX idx_ai_run_tool_calls_run ON ai_run_tool_calls(run_id);
CREATE INDEX idx_ai_feedback_run ON ai_feedback(run_id);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id, created_at DESC);
CREATE INDEX idx_ai_costs_owner ON ai_costs(owner_id, period_date);
CREATE INDEX idx_ai_costs_tenant ON ai_costs(tenant_id, period_date) WHERE tenant_id IS NOT NULL;

-- Search
CREATE INDEX idx_search_index_owner ON search_index(owner_id, entity_type);
CREATE INDEX idx_search_index_embedding ON search_index USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_search_index_fulltext ON search_index USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE context_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_assembly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_rhythms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rhythm_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_run_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Owner-only policies
CREATE POLICY "context_rules_owner" ON context_rules FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "context_assemblies_owner" ON context_assemblies FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "context_assembly_logs_owner" ON context_assembly_logs FOR ALL USING (
  conversation_id IN (SELECT id FROM ai_conversations WHERE owner_id = auth.uid())
);
CREATE POLICY "projects_owner" ON projects FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "tasks_owner" ON tasks FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "task_dependencies_owner" ON task_dependencies FOR ALL USING (
  task_id IN (SELECT id FROM tasks WHERE owner_id = auth.uid())
);
CREATE POLICY "operating_rhythms_owner" ON operating_rhythms FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "rhythm_completions_owner" ON rhythm_completions FOR ALL USING (
  rhythm_id IN (SELECT id FROM operating_rhythms WHERE owner_id = auth.uid())
);
CREATE POLICY "reminders_owner" ON reminders FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "integrations_owner" ON integrations FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "webhooks_owner" ON webhooks FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "webhook_logs_owner" ON webhook_logs FOR ALL USING (
  webhook_id IN (SELECT id FROM webhooks WHERE owner_id = auth.uid())
);
CREATE POLICY "automation_jobs_owner" ON automation_jobs FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "job_runs_owner" ON job_runs FOR ALL USING (
  job_id IN (SELECT id FROM automation_jobs WHERE owner_id = auth.uid())
);
CREATE POLICY "ai_run_tool_calls_owner" ON ai_run_tool_calls FOR ALL USING (
  run_id IN (SELECT id FROM ai_runs WHERE owner_id = auth.uid())
);
CREATE POLICY "ai_feedback_owner" ON ai_feedback FOR ALL USING (user_id = auth.uid());
CREATE POLICY "ai_costs_owner" ON ai_costs FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "ai_cost_budgets_owner" ON ai_cost_budgets FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "ai_evaluations_owner" ON ai_evaluations FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "search_index_owner" ON search_index FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "search_queries_owner" ON search_queries FOR ALL USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Unified search function
CREATE OR REPLACE FUNCTION unified_search(
  p_user_id UUID,
  p_query TEXT,
  p_embedding vector(1536) DEFAULT NULL,
  p_entity_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  entity_type VARCHAR(50),
  entity_id UUID,
  title TEXT,
  content_preview TEXT,
  relevance DECIMAL,
  match_type VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  WITH text_matches AS (
    SELECT 
      si.entity_type,
      si.entity_id,
      si.title,
      si.content_preview,
      ts_rank(to_tsvector('english', coalesce(si.title, '') || ' ' || coalesce(si.content, '')), 
              plainto_tsquery('english', p_query)) as rank,
      'text'::VARCHAR(20) as match_type
    FROM search_index si
    WHERE si.owner_id = p_user_id
      AND (p_entity_types IS NULL OR si.entity_type = ANY(p_entity_types))
      AND to_tsvector('english', coalesce(si.title, '') || ' ' || coalesce(si.content, '')) 
          @@ plainto_tsquery('english', p_query)
  ),
  semantic_matches AS (
    SELECT 
      si.entity_type,
      si.entity_id,
      si.title,
      si.content_preview,
      (1 - (si.embedding <=> p_embedding))::DECIMAL as rank,
      'semantic'::VARCHAR(20) as match_type
    FROM search_index si
    WHERE si.owner_id = p_user_id
      AND p_embedding IS NOT NULL
      AND si.embedding IS NOT NULL
      AND (p_entity_types IS NULL OR si.entity_type = ANY(p_entity_types))
      AND (1 - (si.embedding <=> p_embedding)) > 0.5
  ),
  combined AS (
    SELECT * FROM text_matches
    UNION ALL
    SELECT * FROM semantic_matches
  )
  SELECT 
    c.entity_type,
    c.entity_id,
    c.title,
    c.content_preview,
    MAX(c.rank) as relevance,
    (ARRAY_AGG(c.match_type ORDER BY c.rank DESC))[1] as match_type
  FROM combined c
  GROUP BY c.entity_type, c.entity_id, c.title, c.content_preview
  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update search index for an entity
CREATE OR REPLACE FUNCTION update_search_index(
  p_owner_id UUID,
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_embedding vector(1536) DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_category VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_index_id UUID;
BEGIN
  INSERT INTO search_index (
    owner_id, entity_type, entity_id, title, content, 
    content_preview, embedding, tags, category, indexed_at
  ) VALUES (
    p_owner_id, p_entity_type, p_entity_id, p_title, p_content,
    substring(p_content from 1 for 200), p_embedding, p_tags, p_category, NOW()
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    content_preview = EXCLUDED.content_preview,
    embedding = COALESCE(EXCLUDED.embedding, search_index.embedding),
    tags = COALESCE(EXCLUDED.tags, search_index.tags),
    category = COALESCE(EXCLUDED.category, search_index.category),
    updated_at = NOW(),
    indexed_at = NOW()
  RETURNING id INTO v_index_id;
  
  RETURN v_index_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate AI costs for a run
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_run_id UUID,
  p_owner_id UUID,
  p_tenant_id UUID,
  p_provider VARCHAR(50),
  p_model VARCHAR(100),
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_input_price DECIMAL;
  v_output_price DECIMAL;
  v_input_cost INTEGER;
  v_output_cost INTEGER;
  v_total_cost INTEGER;
BEGIN
  -- Get pricing (cents per 1K tokens)
  CASE p_model
    WHEN 'gpt-4o' THEN v_input_price := 0.5; v_output_price := 1.5;
    WHEN 'gpt-4o-mini' THEN v_input_price := 0.015; v_output_price := 0.06;
    WHEN 'gpt-4-turbo' THEN v_input_price := 1.0; v_output_price := 3.0;
    WHEN 'claude-3-opus' THEN v_input_price := 1.5; v_output_price := 7.5;
    WHEN 'claude-3-sonnet' THEN v_input_price := 0.3; v_output_price := 1.5;
    ELSE v_input_price := 0.5; v_output_price := 1.5;
  END CASE;
  
  v_input_cost := CEIL((p_input_tokens / 1000.0) * v_input_price);
  v_output_cost := CEIL((p_output_tokens / 1000.0) * v_output_price);
  v_total_cost := v_input_cost + v_output_cost;
  
  INSERT INTO ai_costs (
    run_id, owner_id, tenant_id, provider, model,
    input_tokens, output_tokens, total_tokens,
    input_cost_cents, output_cost_cents, total_cost_cents
  ) VALUES (
    p_run_id, p_owner_id, p_tenant_id, p_provider, p_model,
    p_input_tokens, p_output_tokens, p_input_tokens + p_output_tokens,
    v_input_cost, v_output_cost, v_total_cost
  );
  
  -- Update budget if exists
  UPDATE ai_cost_budgets
  SET current_usage_cents = current_usage_cents + v_total_cost,
      updated_at = NOW()
  WHERE owner_id = p_owner_id
    AND period_start <= CURRENT_DATE
    AND period_start + 
        CASE period_type 
          WHEN 'daily' THEN INTERVAL '1 day'
          WHEN 'weekly' THEN INTERVAL '7 days'
          WHEN 'monthly' THEN INTERVAL '1 month'
        END > CURRENT_DATE;
  
  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tasks due soon
CREATE OR REPLACE FUNCTION get_upcoming_tasks(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  due_date TIMESTAMPTZ,
  priority VARCHAR,
  project_name VARCHAR,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.due_date,
    t.priority,
    p.name as project_name,
    t.due_date < NOW() as is_overdue
  FROM tasks t
  LEFT JOIN projects p ON t.project_id = p.id
  WHERE t.owner_id = p_user_id
    AND t.status NOT IN ('done', 'cancelled')
    AND t.due_date IS NOT NULL
    AND t.due_date <= NOW() + (p_days || ' days')::INTERVAL
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
