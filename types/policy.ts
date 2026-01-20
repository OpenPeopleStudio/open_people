/* ═══════════════════════════════════════════════════════════════════════════
   Policy Engine Types
   Type definitions for policy evaluation, simulation, and linting
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// Policy Definition Types
// ─────────────────────────────────────────────────────────────────────────────

export type PolicyEffect = "allow" | "deny";

export type PolicyType =
  | "access"
  | "usage"
  | "data"
  | "content"
  | "approval"
  | "time"
  | "rate";

export type SubjectType = "user" | "role" | "team" | "group" | "all";

export type ResourceType =
  | "model"
  | "application"
  | "prompt"
  | "feature"
  | "all";

export type ConditionType =
  | "time"
  | "location"
  | "data"
  | "topic"
  | "rate"
  | "approval"
  | "risk"
  | "custom"
  | "routing";

export type ActionType =
  | "block"
  | "allow"
  | "log"
  | "notify"
  | "require_approval"
  | "escalate"
  | "route"; // Route to specific provider/model

// ─────────────────────────────────────────────────────────────────────────────
// Policy Structure
// ─────────────────────────────────────────────────────────────────────────────

export type Policy = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  policy_type: PolicyType;
  effect: PolicyEffect;
  priority: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type PolicySubject = {
  id: string;
  policy_id: string;
  subject_type: SubjectType;
  subject_value: string | null;
  include: boolean;
};

export type PolicyResource = {
  id: string;
  policy_id: string;
  resource_type: ResourceType;
  resource_values: string[] | null;
  include: boolean;
};

export type PolicyCondition = {
  id: string;
  policy_id: string;
  condition_type: ConditionType;
  condition_config: ConditionConfig;
};

export type PolicyAction = {
  id: string;
  policy_id: string;
  action_type: ActionType;
  action_config: Record<string, unknown> | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Condition Configurations
// ─────────────────────────────────────────────────────────────────────────────

export type TimeConditionConfig = {
  business_hours?: boolean;
  days?: string[];
  timezone?: string;
  start_time?: string;
  end_time?: string;
};

export type LocationConditionConfig = {
  allowed_countries?: string[];
  denied_countries?: string[];
  allowed_ips?: string[];
  denied_ips?: string[];
};

export type DataConditionConfig = {
  no_pii?: boolean;
  allowed_classifications?: string[];
  max_tokens?: number;
};

export type TopicConditionConfig = {
  blocked_topics?: string[];
  allowed_topics?: string[];
};

export type RateConditionConfig = {
  max_requests?: number;
  max_tokens?: number;
  period?: "minute" | "hour" | "day" | "week" | "month";
};

export type ApprovalConditionConfig = {
  required_for?: string[];
  approvers?: string[];
  timeout_hours?: number;
};

export type RiskConditionConfig = {
  max_risk_score?: number;
  max_risk_level?: RiskLevel;
  signal_thresholds?: Record<string, number>;
};

export type CustomConditionConfig = {
  expression?: string;
  parameters?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Routing Condition Configuration (for policy-aware gateway routing)
// ─────────────────────────────────────────────────────────────────────────────

export type RoutingConditionConfig = {
  // Route PII-containing requests to approved providers only
  pii_detected?: {
    route_to_providers?: string[]; // Provider IDs that can handle PII
    block_if_no_approved_provider?: boolean;
  };
  // Route high-risk requests to safer/slower models
  risk_level_high?: {
    prefer_model?: string; // Model to prefer for high-risk
    prefer_provider?: string; // Provider to prefer
    add_safety_prompt?: boolean;
  };
  // Handle budget constraints
  budget_exceeded?: {
    fallback_model?: string; // Cheaper model to fall back to
    fallback_provider?: string; // Cheaper provider
    block_if_no_fallback?: boolean;
  };
  // Route based on data classification
  data_classification?: {
    [classification: string]: {
      allowed_providers?: string[];
      preferred_model?: string;
    };
  };
};

export type ConditionConfig =
  | TimeConditionConfig
  | LocationConditionConfig
  | DataConditionConfig
  | TopicConditionConfig
  | RateConditionConfig
  | ApprovalConditionConfig
  | RiskConditionConfig
  | CustomConditionConfig
  | RoutingConditionConfig;

// ─────────────────────────────────────────────────────────────────────────────
// Policy with Relations (full loaded policy)
// ─────────────────────────────────────────────────────────────────────────────

export type PolicyWithRelations = Policy & {
  subjects: PolicySubject[];
  resources: PolicyResource[];
  conditions: PolicyCondition[];
  actions: PolicyAction[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Request Context (input to policy evaluation)
// ─────────────────────────────────────────────────────────────────────────────

export type RequestContext = {
  // Subject info
  user_id?: string;
  user_email?: string;
  user_roles?: string[];
  user_teams?: string[];
  user_groups?: string[];

  // Resource info
  model?: string;
  application_id?: string;
  prompt_id?: string;
  feature?: string;

  // Request details
  request_id?: string;
  input_text?: string;
  input_tokens?: number;
  output_text?: string;
  output_tokens?: number;

  // Context
  timestamp?: string;
  ip_address?: string;
  country_code?: string;
  user_agent?: string;

  // Data classification
  contains_pii?: boolean;
  pii_types?: string[];
  data_classification?: string;

  // Topic/Content
  detected_topics?: string[];
  content_flags?: string[];

  // Rate limiting context
  requests_in_period?: number;
  tokens_in_period?: number;

  // Risk signals (from aggregator)
  risk_score?: number;
  risk_level?: RiskLevel;
  risk_signals?: RiskSignal[];

  // Custom attributes
  custom?: Record<string, unknown>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation Result Types
// ─────────────────────────────────────────────────────────────────────────────

export type PolicyDecision = "allow" | "deny" | "require_approval";

export type ConditionEvaluation = {
  condition_id: string;
  condition_type: ConditionType;
  matched: boolean;
  reason: string;
  details?: Record<string, unknown>;
};

export type PolicyEvaluation = {
  policy_id: string;
  policy_name: string;
  policy_type: PolicyType;
  effect: PolicyEffect;
  priority: number;
  matched: boolean;
  subject_matched: boolean;
  resource_matched: boolean;
  conditions_matched: boolean;
  condition_evaluations: ConditionEvaluation[];
  reason: string;
};

export type EvaluationTrace = {
  request_id: string;
  timestamp: string;
  context: RequestContext;
  decision: PolicyDecision;
  deciding_policy_id: string | null;
  deciding_policy_name: string | null;
  policies_evaluated: PolicyEvaluation[];
  triggered_actions: ActionType[];
  reasons: string[];
  evaluation_time_ms: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Test Bench Types
// ─────────────────────────────────────────────────────────────────────────────

export type TestBenchRequest = {
  context: RequestContext;
  policy_ids?: string[]; // Optional: test specific policies only
  include_inactive?: boolean; // Include inactive policies in evaluation
};

export type TestBenchResponse = {
  trace: EvaluationTrace;
  summary: {
    decision: PolicyDecision;
    primary_reason: string;
    policies_matched: number;
    policies_evaluated: number;
    risk_score?: number;
    risk_level?: RiskLevel;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Impact Preview Types
// ─────────────────────────────────────────────────────────────────────────────

export type PolicyChange = {
  type: "create" | "update" | "delete";
  policy_id?: string; // For update/delete
  policy?: Partial<PolicyWithRelations>; // The new/updated policy definition
};

export type FlippedDecision = {
  original_decision_id: string;
  original_decision: PolicyDecision;
  new_decision: PolicyDecision;
  request_context: RequestContext;
  timestamp: string;
  reason: string;
};

export type ImpactPreviewRequest = {
  changes: PolicyChange[];
  days_to_analyze?: number; // Default 7
  max_samples?: number; // Max flipped decisions to return
};

export type ImpactPreviewResponse = {
  changes_analyzed: number;
  decisions_replayed: number;
  flipped_decisions: FlippedDecision[];
  summary: {
    allow_to_deny: number;
    deny_to_allow: number;
    total_flipped: number;
    impact_percentage: number;
  };
  risk_assessment: {
    level: "low" | "medium" | "high" | "critical";
    reason: string;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Policy Lint Types
// ─────────────────────────────────────────────────────────────────────────────

export type LintSeverity = "error" | "warning" | "info";

export type LintRuleType =
  | "conflict"
  | "shadowed"
  | "unreachable"
  | "duplicate_priority"
  | "missing_subject"
  | "missing_resource"
  | "invalid_condition"
  | "circular_dependency"
  | "empty_policy";

export type LintIssue = {
  rule: LintRuleType;
  severity: LintSeverity;
  message: string;
  policy_ids: string[];
  policy_names: string[];
  details?: Record<string, unknown>;
  suggestion?: string;
};

export type LintRequest = {
  policy_ids?: string[]; // Lint specific policies, or all if not provided
  include_inactive?: boolean;
};

export type LintResponse = {
  issues: LintIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    policies_analyzed: number;
  };
  passed: boolean; // No blocking errors
};

// ─────────────────────────────────────────────────────────────────────────────
// Risk Aggregator Types
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskSignalType =
  | "moderation"
  | "pii"
  | "guardrails"
  | "quality"
  | "hallucination"
  | "drift"
  | "model_safety"
  | "rate_limit"
  | "policy_violation"
  | "anomaly"
  | "custom";

export type RiskSignal = {
  type: RiskSignalType;
  score: number; // 0-100
  weight: number; // 0-1, how much this signal contributes
  reason: string;
  details?: Record<string, unknown>;
  source?: string; // Which system generated this signal
};

export type RecommendedAction =
  | "allow"
  | "warn"
  | "block"
  | "escalate"
  | "require_approval";

export type RiskEvaluation = {
  id?: string;
  request_id: string;
  timestamp: string;
  
  // Aggregated score
  risk_score: number; // 0-100
  risk_level: RiskLevel;
  
  // Contributing signals
  signals: RiskSignal[];
  
  // Recommendation
  recommended_action: RecommendedAction;
  reasons: string[];
  
  // Escalation
  should_escalate: boolean;
  escalation_reasons?: string[];
  
  // Metadata
  profile_id?: string; // Which risk profile was used
  evaluation_time_ms?: number;
};

export type RiskProfile = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  
  // Signal weights
  signal_weights: Record<RiskSignalType, number>;
  
  // Thresholds
  thresholds: {
    low_max: number; // 0-25 default
    medium_max: number; // 26-50 default
    high_max: number; // 51-75 default
    // critical: 76-100
  };
  
  // Escalation rules
  escalation_rules: {
    min_risk_level?: RiskLevel;
    min_risk_score?: number;
    signal_triggers?: {
      type: RiskSignalType;
      min_score: number;
    }[];
  };
  
  // Action mappings
  action_mappings: {
    low: RecommendedAction;
    medium: RecommendedAction;
    high: RecommendedAction;
    critical: RecommendedAction;
  };
  
  created_at: string;
  updated_at: string;
};

export type RiskEvaluateRequest = {
  request_id?: string;
  signals: RiskSignal[];
  profile_id?: string; // Use specific profile, or tenant default
  context?: RequestContext; // Optional context for additional signals
};

export type RiskEvaluateResponse = {
  evaluation: RiskEvaluation;
  profile_used: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Simulation/Audit Storage Types
// ─────────────────────────────────────────────────────────────────────────────

export type PolicySimulationRun = {
  id: string;
  tenant_id: string;
  user_id: string;
  
  // Type of simulation
  simulation_type: "test" | "preview" | "lint";
  
  // Input
  input_data: Record<string, unknown>;
  
  // Results
  result_data: Record<string, unknown>;
  
  // Status
  status: "pending" | "completed" | "failed";
  error_message?: string;
  
  // Performance
  duration_ms?: number;
  
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// API Request/Response Types
// ─────────────────────────────────────────────────────────────────────────────

export type PolicyEvaluateRequest = {
  context: RequestContext;
};

export type PolicyEvaluateResponse = {
  decision: PolicyDecision;
  deciding_policy_id: string | null;
  reasons: string[];
  trace?: EvaluationTrace;
};

// ─────────────────────────────────────────────────────────────────────────────
// Gateway Routing Types (for policy-aware provider/model selection)
// ─────────────────────────────────────────────────────────────────────────────

export type RoutingActionConfig = {
  provider_id?: string;
  model?: string;
  add_system_prompt?: string;
  modify_temperature?: number;
  reason: string;
};

export type RoutingDecision = {
  provider_id?: string;
  model?: string;
  modified_request?: {
    system_prompt_prefix?: string;
    temperature?: number;
  };
  routing_reasons: string[];
  routing_policy_id?: string;
  routing_policy_name?: string;
};

export type GatewayEvaluationResult = {
  // Policy decision (allow/deny/require_approval)
  policy_decision: PolicyDecision;
  policy_reasons: string[];
  policy_trace?: EvaluationTrace;
  
  // Routing decision (which provider/model to use)
  routing: RoutingDecision;
  
  // Combined metadata
  request_id: string;
  tenant_id: string;
  evaluation_time_ms: number;
};

// Budget context for routing decisions
export type BudgetContext = {
  daily_budget_usd?: number;
  daily_spent_usd?: number;
  monthly_budget_usd?: number;
  monthly_spent_usd?: number;
  is_over_daily_budget?: boolean;
  is_over_monthly_budget?: boolean;
};
