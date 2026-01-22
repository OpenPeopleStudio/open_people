/* ═══════════════════════════════════════════════════════════════════════════
   Risk Aggregator
   Combine multiple risk signals into a unified risk score and recommendation
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  RiskSignal,
  RiskSignalType,
  RiskLevel,
  RiskEvaluation,
  RiskProfile,
  RecommendedAction,
  RiskEvaluateRequest,
  RequestContext,
} from "@/types/policy";

// ─────────────────────────────────────────────────────────────────────────────
// Default Risk Profile
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SIGNAL_WEIGHTS: Record<RiskSignalType, number> = {
  moderation: 0.2,
  pii: 0.15,
  guardrails: 0.15,
  quality: 0.1,
  hallucination: 0.1,
  drift: 0.05,
  model_safety: 0.15,
  rate_limit: 0.05,
  policy_violation: 0.05,
  anomaly: 0.0,
  custom: 0.0,
};

const DEFAULT_THRESHOLDS = {
  low_max: 25,
  medium_max: 50,
  high_max: 75,
};

const DEFAULT_ACTION_MAPPINGS: Record<RiskLevel, RecommendedAction> = {
  low: "allow",
  medium: "warn",
  high: "escalate",
  critical: "block",
};

const DEFAULT_ESCALATION_RULES: RiskProfile["escalation_rules"] = {
  min_risk_level: "high" as RiskLevel,
  signal_triggers: [] as { type: RiskSignalType; min_score: number }[],
};

// ─────────────────────────────────────────────────────────────────────────────
// Load Risk Profile
// ─────────────────────────────────────────────────────────────────────────────

async function loadRiskProfile(
  tenantId: string,
  profileId?: string
): Promise<RiskProfile | null> {
  const supabase = await createSupabaseAdmin();

  let query = supabase
    .from("risk_profiles")
    .select("*")
    .eq("tenant_id", tenantId);

  if (profileId) {
    query = query.eq("id", profileId);
  } else {
    query = query.eq("is_default", true);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return data as RiskProfile;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Default Profile (if none exists)
// ─────────────────────────────────────────────────────────────────────────────

async function ensureDefaultProfile(tenantId: string): Promise<RiskProfile> {
  const supabase = await createSupabaseAdmin();

  // Check if default exists
  const { data: existing } = await supabase
    .from("risk_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .single();

  if (existing) {
    return existing as RiskProfile;
  }

  // Create default profile
  const { data: created, error } = await supabase
    .from("risk_profiles")
    .insert({
      tenant_id: tenantId,
      name: "Default Risk Profile",
      description: "Automatically created default risk profile",
      is_default: true,
      signal_weights: DEFAULT_SIGNAL_WEIGHTS,
      thresholds: DEFAULT_THRESHOLDS,
      escalation_rules: DEFAULT_ESCALATION_RULES,
      action_mappings: DEFAULT_ACTION_MAPPINGS,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating default risk profile:", error);
    // Return a synthetic default
    return {
      id: "default",
      tenant_id: tenantId,
      name: "Default",
      description: null,
      is_default: true,
      signal_weights: DEFAULT_SIGNAL_WEIGHTS,
      thresholds: DEFAULT_THRESHOLDS,
      escalation_rules: DEFAULT_ESCALATION_RULES,
      action_mappings: DEFAULT_ACTION_MAPPINGS,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return created as RiskProfile;
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculate Risk Score
// ─────────────────────────────────────────────────────────────────────────────

function calculateRiskScore(
  signals: RiskSignal[],
  weights: Record<RiskSignalType, number>
): number {
  if (signals.length === 0) {
    return 0;
  }

  // Calculate weighted sum
  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const weight = signal.weight !== undefined ? signal.weight : (weights[signal.type] || 0);
    totalWeight += weight;
    weightedSum += signal.score * weight;
  }

  // Normalize if we have weights
  if (totalWeight === 0) {
    // Equal weighting fallback
    return Math.round(signals.reduce((sum, s) => sum + s.score, 0) / signals.length);
  }

  return Math.round(weightedSum / totalWeight);
}

// ─────────────────────────────────────────────────────────────────────────────
// Determine Risk Level
// ─────────────────────────────────────────────────────────────────────────────

function determineRiskLevel(
  score: number,
  thresholds: { low_max: number; medium_max: number; high_max: number }
): RiskLevel {
  if (score <= thresholds.low_max) {
    return "low";
  }
  if (score <= thresholds.medium_max) {
    return "medium";
  }
  if (score <= thresholds.high_max) {
    return "high";
  }
  return "critical";
}

// ─────────────────────────────────────────────────────────────────────────────
// Check Escalation Rules
// ─────────────────────────────────────────────────────────────────────────────

function checkEscalation(
  score: number,
  level: RiskLevel,
  signals: RiskSignal[],
  rules: typeof DEFAULT_ESCALATION_RULES
): { shouldEscalate: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let shouldEscalate = false;

  // Check risk level threshold
  if (rules.min_risk_level) {
    const levelOrder: Record<RiskLevel, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };
    if (levelOrder[level] >= levelOrder[rules.min_risk_level]) {
      shouldEscalate = true;
      reasons.push(`Risk level ${level} meets escalation threshold (${rules.min_risk_level})`);
    }
  }

  // Check risk score threshold
  if (rules.min_risk_score != null && score >= rules.min_risk_score) {
    shouldEscalate = true;
    reasons.push(`Risk score ${score} exceeds threshold (${rules.min_risk_score})`);
  }

  // Check signal triggers
  if (rules.signal_triggers && rules.signal_triggers.length > 0) {
    for (const trigger of rules.signal_triggers) {
      const signal = signals.find((s) => s.type === trigger.type);
      if (signal && signal.score >= trigger.min_score) {
        shouldEscalate = true;
        reasons.push(
          `Signal '${trigger.type}' score ${signal.score} exceeds trigger threshold (${trigger.min_score})`
        );
      }
    }
  }

  return { shouldEscalate, reasons };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Reasons
// ─────────────────────────────────────────────────────────────────────────────

function generateReasons(signals: RiskSignal[], level: RiskLevel): string[] {
  const reasons: string[] = [];

  // Add level-based reason
  switch (level) {
    case "critical":
      reasons.push("Critical risk level detected - immediate action required");
      break;
    case "high":
      reasons.push("High risk level - human review recommended");
      break;
    case "medium":
      reasons.push("Elevated risk level - proceed with caution");
      break;
    case "low":
      reasons.push("Low risk level - normal processing");
      break;
  }

  // Add top contributing signals
  const sortedSignals = [...signals].sort((a, b) => b.score - a.score);
  const topSignals = sortedSignals.slice(0, 3).filter((s) => s.score > 0);

  for (const signal of topSignals) {
    reasons.push(`${signal.type}: ${signal.reason} (score: ${signal.score})`);
  }

  return reasons;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extract Additional Signals from Context
// ─────────────────────────────────────────────────────────────────────────────

function extractContextSignals(context?: RequestContext): RiskSignal[] {
  if (!context) return [];

  const signals: RiskSignal[] = [];

  // PII signal
  if (context.contains_pii) {
    signals.push({
      type: "pii",
      score: context.pii_types && context.pii_types.length > 2 ? 80 : 50,
      weight: DEFAULT_SIGNAL_WEIGHTS.pii,
      reason: `PII detected: ${context.pii_types?.join(", ") || "unknown types"}`,
      source: "context",
    });
  }

  // Topic-based moderation
  if (context.content_flags && context.content_flags.length > 0) {
    signals.push({
      type: "moderation",
      score: Math.min(context.content_flags.length * 25, 100),
      weight: DEFAULT_SIGNAL_WEIGHTS.moderation,
      reason: `Content flags: ${context.content_flags.join(", ")}`,
      source: "context",
    });
  }

  // Rate limit signal
  if (context.requests_in_period !== undefined) {
    const rateScore = Math.min(context.requests_in_period / 10, 100);
    if (rateScore > 50) {
      signals.push({
        type: "rate_limit",
        score: rateScore,
        weight: DEFAULT_SIGNAL_WEIGHTS.rate_limit,
        reason: `High request rate: ${context.requests_in_period} requests`,
        source: "context",
      });
    }
  }

  return signals;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Evaluation Function
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateRisk(
  tenantId: string,
  request: RiskEvaluateRequest
): Promise<RiskEvaluation> {
  const startTime = Date.now();
  const requestId = request.request_id || crypto.randomUUID();

  // Load or create profile
  let profile = await loadRiskProfile(tenantId, request.profile_id);
  if (!profile) {
    profile = await ensureDefaultProfile(tenantId);
  }

  // Combine explicit signals with context-extracted signals
  const contextSignals = extractContextSignals(request.context);
  const allSignals = [...request.signals, ...contextSignals];

  // Deduplicate by type (explicit signals take priority)
  const signalMap = new Map<RiskSignalType, RiskSignal>();
  for (const signal of allSignals) {
    if (!signalMap.has(signal.type)) {
      signalMap.set(signal.type, signal);
    }
  }
  const deduplicatedSignals = Array.from(signalMap.values());

  // Calculate score
  const riskScore = calculateRiskScore(
    deduplicatedSignals,
    profile.signal_weights as Record<RiskSignalType, number>
  );

  // Determine level
  const thresholds = profile.thresholds as typeof DEFAULT_THRESHOLDS;
  const riskLevel = determineRiskLevel(riskScore, thresholds);

  // Get recommended action
  const actionMappings = profile.action_mappings as Record<RiskLevel, RecommendedAction>;
  const recommendedAction = actionMappings[riskLevel];

  // Check escalation
  const escalationRules = profile.escalation_rules as typeof DEFAULT_ESCALATION_RULES;
  const { shouldEscalate, reasons: escalationReasons } = checkEscalation(
    riskScore,
    riskLevel,
    deduplicatedSignals,
    escalationRules
  );

  // Generate reasons
  const reasons = generateReasons(deduplicatedSignals, riskLevel);

  const evaluationTimeMs = Date.now() - startTime;

  const evaluation: RiskEvaluation = {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    risk_score: riskScore,
    risk_level: riskLevel,
    signals: deduplicatedSignals,
    recommended_action: recommendedAction,
    reasons,
    should_escalate: shouldEscalate,
    profile_id: profile.id,
    evaluation_time_ms: evaluationTimeMs,
  };

  if (escalationReasons.length > 0) {
    evaluation.escalation_reasons = escalationReasons;
  }

  return evaluation;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Evaluation Result
// ─────────────────────────────────────────────────────────────────────────────

export async function storeRiskEvaluation(
  tenantId: string,
  evaluation: RiskEvaluation
): Promise<string | null> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("risk_evaluations")
    .insert({
      tenant_id: tenantId,
      request_id: evaluation.request_id,
      risk_score: evaluation.risk_score,
      risk_level: evaluation.risk_level,
      signals: evaluation.signals,
      recommended_action: evaluation.recommended_action,
      reasons: evaluation.reasons,
      should_escalate: evaluation.should_escalate,
      escalation_reasons: evaluation.escalation_reasons || [],
      profile_id: evaluation.profile_id,
      evaluation_time_ms: evaluation.evaluation_time_ms,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error storing risk evaluation:", error);
    return null;
  }

  return data.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience: Evaluate and Store
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateAndStoreRisk(
  tenantId: string,
  request: RiskEvaluateRequest
): Promise<RiskEvaluation & { stored_id?: string }> {
  const evaluation = await evaluateRisk(tenantId, request);
  const storedId = await storeRiskEvaluation(tenantId, evaluation);

  const result: RiskEvaluation & { stored_id?: string } = { ...evaluation };
  if (storedId) {
    result.id = storedId;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Risk Check (lightweight, no storage)
// ─────────────────────────────────────────────────────────────────────────────

export function quickRiskCheck(signals: RiskSignal[]): {
  score: number;
  level: RiskLevel;
  action: RecommendedAction;
} {
  const score = calculateRiskScore(signals, DEFAULT_SIGNAL_WEIGHTS);
  const level = determineRiskLevel(score, DEFAULT_THRESHOLDS);
  const action = DEFAULT_ACTION_MAPPINGS[level];

  return { score, level, action };
}
