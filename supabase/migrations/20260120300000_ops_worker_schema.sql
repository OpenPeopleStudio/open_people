-- ════════════════════════════════════════════════════════════════════════════
-- Ops Worker Schema
-- Tables for decisions, proposals, and run logs
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- DECISIONS TABLE
-- Stores raw decisions from various sources (email, meetings, notes, manual)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  
  -- Content
  raw_text TEXT NOT NULL,
  summary TEXT,
  
  -- Source metadata (JSONB for flexibility)
  source JSONB NOT NULL DEFAULT '{"type": "manual"}',
  -- source structure: { type: string, reference_id?: string, label?: string, url?: string }
  
  -- Processing
  context_assembly_id UUID REFERENCES context_assemblies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'committed', 'archived')),
  
  -- Results
  ops_run_id UUID, -- Will be set after run created
  created_task_ids UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_decisions_owner ON decisions(owner_id);
CREATE INDEX IF NOT EXISTS idx_decisions_tenant ON decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_source_type ON decisions((source->>'type'));

-- ────────────────────────────────────────────────────────────────────────────
-- OPS RUNS TABLE
-- Logs each AI proposal generation run
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ops_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  
  -- Model info
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  
  -- Proposal (stored as JSONB)
  proposal JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'committed')),
  error_message TEXT,
  
  -- Token usage
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Cost tracking
  cost_cents INTEGER,
  
  -- Performance
  duration_ms INTEGER,
  
  -- Results (after commit)
  created_task_ids UUID[] DEFAULT '{}',
  updated_task_ids UUID[] DEFAULT '{}',
  
  -- Commit tracking
  committed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  committed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ops_runs_owner ON ops_runs(owner_id);
CREATE INDEX IF NOT EXISTS idx_ops_runs_tenant ON ops_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ops_runs_decision ON ops_runs(decision_id);
CREATE INDEX IF NOT EXISTS idx_ops_runs_status ON ops_runs(status);
CREATE INDEX IF NOT EXISTS idx_ops_runs_created_at ON ops_runs(created_at DESC);

-- Add foreign key back to decisions for ops_run_id
ALTER TABLE decisions
  ADD CONSTRAINT fk_decisions_ops_run
  FOREIGN KEY (ops_run_id) REFERENCES ops_runs(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_decisions_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_runs ENABLE ROW LEVEL SECURITY;

-- Decisions: Users can manage their own decisions
CREATE POLICY "Users can view own decisions"
  ON decisions FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own decisions"
  ON decisions FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own decisions"
  ON decisions FOR DELETE
  USING (auth.uid() = owner_id);

-- Ops Runs: Users can manage their own runs
CREATE POLICY "Users can view own ops runs"
  ON ops_runs FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own ops runs"
  ON ops_runs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own ops runs"
  ON ops_runs FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own ops runs"
  ON ops_runs FOR DELETE
  USING (auth.uid() = owner_id);

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access to decisions"
  ON decisions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to ops runs"
  ON ops_runs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE decisions IS 'Stores decision inputs for the Ops Worker to process into tasks';
COMMENT ON TABLE ops_runs IS 'Logs each Ops Worker AI run with proposals, costs, and results';

COMMENT ON COLUMN decisions.source IS 'JSON object with type (email|meeting_notes|note|manual|inbox), reference_id, label, url';
COMMENT ON COLUMN decisions.status IS 'draft = not yet processed, proposed = has proposals, committed = tasks created, archived = dismissed';
COMMENT ON COLUMN ops_runs.proposal IS 'The OpsProposal JSON returned by the AI';
COMMENT ON COLUMN ops_runs.status IS 'pending = running, completed = has proposal, failed = error, committed = tasks created';
