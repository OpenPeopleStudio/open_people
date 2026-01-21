-- ════════════════════════════════════════════════════════════════════════════
-- Policy Tooling Schema
-- Tables for policy simulation, linting, and impact preview
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- POLICY SIMULATION RUNS TABLE
-- Stores test bench, preview, and lint runs for auditing
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type of simulation
  simulation_type TEXT NOT NULL CHECK (simulation_type IN ('test', 'preview', 'lint')),
  
  -- Input data (JSON)
  input_data JSONB NOT NULL DEFAULT '{}',
  
  -- Result data (JSON)
  result_data JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  
  -- Performance
  duration_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_policy_simulation_runs_tenant 
  ON policy_simulation_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_simulation_runs_user 
  ON policy_simulation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_policy_simulation_runs_type 
  ON policy_simulation_runs(simulation_type);
CREATE INDEX IF NOT EXISTS idx_policy_simulation_runs_created 
  ON policy_simulation_runs(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- RISK PROFILES TABLE
-- Configurable risk aggregation weights and thresholds per tenant
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  
  -- Signal weights (0-1 for each signal type)
  signal_weights JSONB NOT NULL DEFAULT '{
    "moderation": 0.2,
    "pii": 0.15,
    "guardrails": 0.15,
    "quality": 0.1,
    "hallucination": 0.1,
    "drift": 0.05,
    "model_safety": 0.15,
    "rate_limit": 0.05,
    "policy_violation": 0.05,
    "anomaly": 0.0,
    "custom": 0.0
  }',
  
  -- Score thresholds for risk levels
  thresholds JSONB NOT NULL DEFAULT '{
    "low_max": 25,
    "medium_max": 50,
    "high_max": 75
  }',
  
  -- Escalation rules
  escalation_rules JSONB NOT NULL DEFAULT '{
    "min_risk_level": "high",
    "min_risk_score": null,
    "signal_triggers": []
  }',
  
  -- Action mappings per risk level
  action_mappings JSONB NOT NULL DEFAULT '{
    "low": "allow",
    "medium": "warn",
    "high": "escalate",
    "critical": "block"
  }',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one default profile per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_risk_profiles_default 
  ON risk_profiles(tenant_id) 
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_risk_profiles_tenant 
  ON risk_profiles(tenant_id);

-- ────────────────────────────────────────────────────────────────────────────
-- RISK EVALUATIONS TABLE
-- Stores risk evaluation results for audit and analysis
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS risk_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Request reference
  request_id VARCHAR(255) NOT NULL,
  
  -- Results
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Contributing signals
  signals JSONB NOT NULL DEFAULT '[]',
  
  -- Recommendation
  recommended_action TEXT NOT NULL CHECK (recommended_action IN ('allow', 'warn', 'block', 'escalate', 'require_approval')),
  reasons JSONB NOT NULL DEFAULT '[]',
  
  -- Escalation
  should_escalate BOOLEAN NOT NULL DEFAULT false,
  escalation_reasons JSONB DEFAULT '[]',
  
  -- Profile used
  profile_id UUID REFERENCES risk_profiles(id) ON DELETE SET NULL,
  
  -- Performance
  evaluation_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_risk_evaluations_tenant 
  ON risk_evaluations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_risk_evaluations_request 
  ON risk_evaluations(request_id);
CREATE INDEX IF NOT EXISTS idx_risk_evaluations_level 
  ON risk_evaluations(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_evaluations_escalate 
  ON risk_evaluations(should_escalate) 
  WHERE should_escalate = true;
CREATE INDEX IF NOT EXISTS idx_risk_evaluations_created 
  ON risk_evaluations(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- POLICY LINT RESULTS TABLE (Optional - for persistent lint history)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_lint_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Which policies were linted
  policy_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Results
  issues JSONB NOT NULL DEFAULT '[]',
  errors_count INTEGER NOT NULL DEFAULT 0,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  info_count INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT true,
  
  -- Triggered by
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'save', 'deploy', 'scheduled')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_lint_results_tenant 
  ON policy_lint_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_lint_results_created 
  ON policy_lint_results(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER FOR RISK PROFILES
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_risk_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS risk_profiles_updated_at ON risk_profiles;

CREATE TRIGGER risk_profiles_updated_at
  BEFORE UPDATE ON risk_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_profiles_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE policy_simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_lint_results ENABLE ROW LEVEL SECURITY;

-- Make policies idempotent
DROP POLICY IF EXISTS "Users can view own simulation runs" ON policy_simulation_runs;
DROP POLICY IF EXISTS "Users can insert own simulation runs" ON policy_simulation_runs;
DROP POLICY IF EXISTS "Users can view tenant risk profiles" ON risk_profiles;
DROP POLICY IF EXISTS "Admins can manage risk profiles" ON risk_profiles;
DROP POLICY IF EXISTS "Users can view tenant risk evaluations" ON risk_evaluations;
DROP POLICY IF EXISTS "Service role can insert risk evaluations" ON risk_evaluations;
DROP POLICY IF EXISTS "Users can view tenant lint results" ON policy_lint_results;
DROP POLICY IF EXISTS "Admins can manage lint results" ON policy_lint_results;
DROP POLICY IF EXISTS "Service role full access to simulation runs" ON policy_simulation_runs;
DROP POLICY IF EXISTS "Service role full access to risk profiles" ON risk_profiles;
DROP POLICY IF EXISTS "Service role full access to risk evaluations" ON risk_evaluations;
DROP POLICY IF EXISTS "Service role full access to lint results" ON policy_lint_results;

-- Policy Simulation Runs: Users can view their own runs, admins can view all in tenant
CREATE POLICY "Users can view own simulation runs"
  ON policy_simulation_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulation runs"
  ON policy_simulation_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Risk Profiles: Admins can manage, users can view
CREATE POLICY "Users can view tenant risk profiles"
  ON risk_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tenant_id = risk_profiles.tenant_id
    )
  );

CREATE POLICY "Admins can manage risk profiles"
  ON risk_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tenant_id = risk_profiles.tenant_id
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Risk Evaluations: Users can view tenant evaluations
CREATE POLICY "Users can view tenant risk evaluations"
  ON risk_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tenant_id = risk_evaluations.tenant_id
    )
  );

CREATE POLICY "Service role can insert risk evaluations"
  ON risk_evaluations FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy Lint Results: Users can view tenant lint results
CREATE POLICY "Users can view tenant lint results"
  ON policy_lint_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tenant_id = policy_lint_results.tenant_id
    )
  );

CREATE POLICY "Admins can manage lint results"
  ON policy_lint_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.tenant_id = policy_lint_results.tenant_id
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access to simulation runs"
  ON policy_simulation_runs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to risk profiles"
  ON risk_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to risk evaluations"
  ON risk_evaluations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to lint results"
  ON policy_lint_results FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE policy_simulation_runs IS 'Audit log of policy test bench, preview, and lint operations';
COMMENT ON TABLE risk_profiles IS 'Configurable risk aggregation profiles per tenant';
COMMENT ON TABLE risk_evaluations IS 'Stored risk evaluation results for analysis and audit';
COMMENT ON TABLE policy_lint_results IS 'Historical policy lint results for tracking quality over time';

COMMENT ON COLUMN risk_profiles.signal_weights IS 'Weights (0-1) for each risk signal type in aggregation';
COMMENT ON COLUMN risk_profiles.thresholds IS 'Score boundaries for low/medium/high risk levels';
COMMENT ON COLUMN risk_profiles.escalation_rules IS 'Rules that trigger HITL escalation';
COMMENT ON COLUMN risk_profiles.action_mappings IS 'Recommended action for each risk level';
