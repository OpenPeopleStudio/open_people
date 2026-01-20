-- ════════════════════════════════════════════════════════════════════════════
-- HITL (Human-in-the-Loop) Workflow Schema
-- Tables for escalation queues and human review workflows
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- HITL QUEUES TABLE
-- Review queues for organizing escalated items
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- SLA configuration
  sla_minutes INTEGER, -- Target response time
  warning_threshold_minutes INTEGER, -- When to warn
  
  -- Assignment strategy
  assignment_strategy VARCHAR(50) DEFAULT 'round_robin' 
    CHECK (assignment_strategy IN ('round_robin', 'load_balanced', 'skill_based', 'manual')),
  
  -- Reviewers
  reviewer_user_ids JSONB DEFAULT '[]',
  reviewer_team_id UUID,
  
  -- Settings
  max_concurrent_per_reviewer INTEGER DEFAULT 10,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hitl_queues_tenant ON hitl_queues(tenant_id);

-- ────────────────────────────────────────────────────────────────────────────
-- HITL POLICIES TABLE
-- Escalation rules that determine when items go to human review
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Scope
  application_ids JSONB, -- NULL = all applications
  
  -- Trigger configuration (extended with risk triggers)
  triggers JSONB NOT NULL DEFAULT '[]',
  -- [
  --   {type: 'confidence', threshold: 0.7, priority: 'medium'},
  --   {type: 'content_flag', categories: ['violence'], priority: 'high'},
  --   {type: 'amount', field: 'transaction_amount', threshold: 10000, priority: 'high'},
  --   {type: 'random_sample', percentage: 5, priority: 'low'},
  --   {type: 'risk_level', min_level: 'high', priority: 'high'},
  --   {type: 'risk_score', min_score: 75, priority: 'high'},
  --   {type: 'risk_signal', signal_type: 'pii', min_score: 50, priority: 'medium'}
  -- ]
  
  -- Behavior
  queue_id UUID REFERENCES hitl_queues(id) ON DELETE SET NULL,
  auto_assign BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hitl_policies_tenant ON hitl_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hitl_policies_active ON hitl_policies(tenant_id) WHERE is_active = true;

-- ────────────────────────────────────────────────────────────────────────────
-- HITL ITEMS TABLE
-- Escalated items awaiting human review
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES hitl_policies(id) ON DELETE SET NULL,
  queue_id UUID NOT NULL REFERENCES hitl_queues(id) ON DELETE CASCADE,
  
  -- Source reference
  audit_log_id UUID, -- Reference to ai_audit_logs if exists
  source_type VARCHAR(50) NOT NULL 
    CHECK (source_type IN ('ai_response', 'moderation', 'classification', 'chat', 'email', 'custom')),
  source_id VARCHAR(255), -- External reference
  
  -- Escalation reason
  trigger_type VARCHAR(50) NOT NULL,
  trigger_details JSONB,
  
  -- Priority
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Content for review (denormalized for reviewer access)
  review_content JSONB NOT NULL,
  -- {
  --   input: "user query",
  --   output: "ai response",
  --   context: {...},
  --   ai_decision: "approve",
  --   confidence: 0.65,
  --   risk_score: 72,
  --   risk_level: "high",
  --   policy_triggers: [...],
  --   kb_sources: [...],
  --   user_metadata: {...} -- safe subset
  -- }
  
  -- Risk snapshot
  risk_evaluation_id UUID REFERENCES risk_evaluations(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'assigned', 'in_review', 'completed', 'expired', 'cancelled')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- SLA tracking
  due_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hitl_items_queue ON hitl_items(queue_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_hitl_items_assigned ON hitl_items(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_hitl_items_status ON hitl_items(status) WHERE status IN ('pending', 'assigned', 'in_review');
CREATE INDEX IF NOT EXISTS idx_hitl_items_sla ON hitl_items(due_at) WHERE status IN ('pending', 'assigned', 'in_review');
CREATE INDEX IF NOT EXISTS idx_hitl_items_tenant ON hitl_items(tenant_id);

-- ────────────────────────────────────────────────────────────────────────────
-- HITL DECISIONS TABLE
-- Records of reviewer decisions on items
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES hitl_items(id) ON DELETE CASCADE,
  
  -- Reviewer
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Decision
  decision VARCHAR(50) NOT NULL 
    CHECK (decision IN ('approve', 'reject', 'modify', 'escalate_further', 'create_rule', 'open_incident')),
  
  -- For modifications
  modified_output TEXT,
  
  -- Reasoning
  decision_reason TEXT,
  decision_tags JSONB DEFAULT '[]', -- ['low_quality', 'incorrect_info', ...]
  
  -- Feedback for AI improvement
  ai_was_correct BOOLEAN, -- For feedback loop
  
  -- Actions taken
  actions_taken JSONB DEFAULT '[]',
  -- [
  --   {type: 'create_guardrail', guardrail_id: '...'},
  --   {type: 'create_eval_case', eval_id: '...'},
  --   {type: 'open_incident', incident_id: '...'}
  -- ]
  
  -- Timing
  review_started_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_duration_seconds INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hitl_decisions_item ON hitl_decisions(item_id);
CREATE INDEX IF NOT EXISTS idx_hitl_decisions_reviewer ON hitl_decisions(reviewer_id, created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- HITL DECISION OPTIONS TABLE
-- Configurable decision options per queue
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES hitl_queues(id) ON DELETE CASCADE,
  
  decision_value VARCHAR(50) NOT NULL,
  display_label VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- UI hints
  keyboard_shortcut VARCHAR(10),
  color VARCHAR(20),
  icon VARCHAR(50),
  
  -- Behavior
  requires_reason BOOLEAN DEFAULT false,
  requires_modification BOOLEAN DEFAULT false,
  
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hitl_decision_options_queue ON hitl_decision_options(queue_id);

-- ────────────────────────────────────────────────────────────────────────────
-- HITL REVIEWER METRICS TABLE
-- Performance tracking for reviewers
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_reviewer_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time bucket
  bucket_timestamp TIMESTAMPTZ NOT NULL,
  bucket_interval VARCHAR(20) NOT NULL CHECK (bucket_interval IN ('day', 'week', 'month')),
  
  -- Volume
  items_reviewed INTEGER DEFAULT 0,
  
  -- Speed
  avg_review_seconds INTEGER,
  median_review_seconds INTEGER,
  
  -- Quality (from QA sampling)
  qa_sampled INTEGER DEFAULT 0,
  qa_correct INTEGER DEFAULT 0,
  
  -- Decisions breakdown
  decision_distribution JSONB DEFAULT '{}', -- {approve: 50, reject: 30, modify: 20}
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, reviewer_id, bucket_timestamp, bucket_interval)
);

CREATE INDEX IF NOT EXISTS idx_hitl_reviewer_metrics ON hitl_reviewer_metrics(reviewer_id, bucket_timestamp DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- HITL QA REVIEWS TABLE
-- QA sampling and calibration reviews
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_qa_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES hitl_decisions(id) ON DELETE CASCADE,
  
  qa_reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assessment
  was_correct BOOLEAN NOT NULL,
  feedback TEXT,
  
  -- If incorrect, what should it have been
  correct_decision VARCHAR(50),
  disagreement_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hitl_qa_reviews_decision ON hitl_qa_reviews(decision_id);
CREATE INDEX IF NOT EXISTS idx_hitl_qa_reviews_qa_reviewer ON hitl_qa_reviews(qa_reviewer_id);

-- ────────────────────────────────────────────────────────────────────────────
-- HITL QUEUE METRICS TABLE
-- Aggregated metrics for queue health
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_queue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES hitl_queues(id) ON DELETE CASCADE,
  
  -- Time bucket
  bucket_timestamp TIMESTAMPTZ NOT NULL,
  bucket_interval VARCHAR(20) NOT NULL CHECK (bucket_interval IN ('hour', 'day', 'week')),
  
  -- Volume
  items_created INTEGER DEFAULT 0,
  items_completed INTEGER DEFAULT 0,
  
  -- Queue health
  avg_queue_depth INTEGER,
  max_queue_depth INTEGER,
  
  -- SLA
  sla_met_count INTEGER DEFAULT 0,
  sla_breached_count INTEGER DEFAULT 0,
  
  -- Timing
  avg_wait_seconds INTEGER,
  avg_review_seconds INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(queue_id, bucket_timestamp, bucket_interval)
);

CREATE INDEX IF NOT EXISTS idx_hitl_queue_metrics ON hitl_queue_metrics(queue_id, bucket_timestamp DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_hitl_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hitl_queues_updated_at
  BEFORE UPDATE ON hitl_queues
  FOR EACH ROW EXECUTE FUNCTION update_hitl_updated_at();

CREATE TRIGGER hitl_policies_updated_at
  BEFORE UPDATE ON hitl_policies
  FOR EACH ROW EXECUTE FUNCTION update_hitl_updated_at();

CREATE TRIGGER hitl_items_updated_at
  BEFORE UPDATE ON hitl_items
  FOR EACH ROW EXECUTE FUNCTION update_hitl_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE hitl_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_decision_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_reviewer_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_qa_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_queue_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view tenant queues/policies
CREATE POLICY "Users can view tenant hitl queues"
  ON hitl_queues FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.tenant_id = hitl_queues.tenant_id
  ));

CREATE POLICY "Users can view tenant hitl policies"
  ON hitl_policies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.tenant_id = hitl_policies.tenant_id
  ));

-- Reviewers can view assigned items
CREATE POLICY "Reviewers can view assigned items"
  ON hitl_items FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tenant_id = hitl_items.tenant_id
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Reviewers can update items they're assigned to
CREATE POLICY "Reviewers can update assigned items"
  ON hitl_items FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Reviewers can create decisions for their items
CREATE POLICY "Reviewers can create decisions"
  ON hitl_decisions FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can view tenant decisions"
  ON hitl_decisions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM hitl_items i
    JOIN profiles p ON p.id = auth.uid() AND p.tenant_id = i.tenant_id
    WHERE i.id = hitl_decisions.item_id
  ));

-- Admins full access
CREATE POLICY "Admins manage hitl queues"
  ON hitl_queues FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.tenant_id = hitl_queues.tenant_id AND p.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins manage hitl policies"
  ON hitl_policies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.tenant_id = hitl_policies.tenant_id AND p.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins manage hitl items"
  ON hitl_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.tenant_id = hitl_items.tenant_id AND p.role IN ('admin', 'super_admin')
  ));

-- Decision options viewable by tenant users
CREATE POLICY "Users can view decision options"
  ON hitl_decision_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM hitl_queues q
    JOIN profiles p ON p.id = auth.uid() AND p.tenant_id = q.tenant_id
    WHERE q.id = hitl_decision_options.queue_id
  ));

-- Metrics viewable by admins
CREATE POLICY "Admins view reviewer metrics"
  ON hitl_reviewer_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.tenant_id = hitl_reviewer_metrics.tenant_id AND p.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Admins view queue metrics"
  ON hitl_queue_metrics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM hitl_queues q
    JOIN profiles p ON p.id = auth.uid() AND p.tenant_id = q.tenant_id AND p.role IN ('admin', 'super_admin')
    WHERE q.id = hitl_queue_metrics.queue_id
  ));

-- QA reviews
CREATE POLICY "QA reviewers can create qa reviews"
  ON hitl_qa_reviews FOR INSERT
  WITH CHECK (qa_reviewer_id = auth.uid());

CREATE POLICY "Admins view qa reviews"
  ON hitl_qa_reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM hitl_decisions d
    JOIN hitl_items i ON i.id = d.item_id
    JOIN profiles p ON p.id = auth.uid() AND p.tenant_id = i.tenant_id AND p.role IN ('admin', 'super_admin')
    WHERE d.id = hitl_qa_reviews.decision_id
  ));

-- Service role bypass
CREATE POLICY "Service role hitl queues" ON hitl_queues FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role hitl policies" ON hitl_policies FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role hitl items" ON hitl_items FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role hitl decisions" ON hitl_decisions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role hitl decision options" ON hitl_decision_options FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role hitl reviewer metrics" ON hitl_reviewer_metrics FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role hitl qa reviews" ON hitl_qa_reviews FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role hitl queue metrics" ON hitl_queue_metrics FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE hitl_queues IS 'Review queues for organizing human review items';
COMMENT ON TABLE hitl_policies IS 'Escalation policies that determine when items need human review';
COMMENT ON TABLE hitl_items IS 'Items escalated for human review';
COMMENT ON TABLE hitl_decisions IS 'Decisions made by human reviewers';
COMMENT ON TABLE hitl_qa_reviews IS 'QA sampling reviews for calibration';
COMMENT ON TABLE hitl_reviewer_metrics IS 'Performance metrics per reviewer';
COMMENT ON TABLE hitl_queue_metrics IS 'Health metrics per queue';

COMMENT ON COLUMN hitl_policies.triggers IS 'JSON array of trigger configs including risk-based triggers';
COMMENT ON COLUMN hitl_items.review_content IS 'Denormalized content for efficient reviewer access';
COMMENT ON COLUMN hitl_decisions.actions_taken IS 'Actions taken as a result of this decision (guardrail, eval case, incident)';
