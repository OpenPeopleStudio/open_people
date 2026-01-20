/* ═══════════════════════════════════════════════════════════════════════════
   Policy Evaluator
   Core policy evaluation engine with full decision tracing
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  Policy,
  PolicyWithRelations,
  PolicySubject,
  PolicyResource,
  PolicyCondition,
  RequestContext,
  PolicyDecision,
  PolicyEvaluation,
  ConditionEvaluation,
  EvaluationTrace,
  ConditionType,
  TimeConditionConfig,
  LocationConditionConfig,
  DataConditionConfig,
  TopicConditionConfig,
  RateConditionConfig,
  RiskConditionConfig,
  ActionType,
} from "@/types/policy";

// ─────────────────────────────────────────────────────────────────────────────
// Load Policies
// ─────────────────────────────────────────────────────────────────────────────

export async function loadPolicies(
  tenantId: string,
  options?: {
    policyIds?: string[];
    includeInactive?: boolean;
  }
): Promise<PolicyWithRelations[]> {
  const supabase = await createSupabaseAdmin();

  // Build base query
  let query = supabase
    .from("policies")
    .select(`
      *,
      subjects:policy_subjects(*),
      resources:policy_resources(*),
      conditions:policy_conditions(*),
      actions:policy_actions(*)
    `)
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false });

  // Filter by specific policy IDs if provided
  if (options?.policyIds && options.policyIds.length > 0) {
    query = query.in("id", options.policyIds);
  }

  // Filter active policies unless includeInactive is true
  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  // Filter by validity period
  const now = new Date().toISOString();
  query = query
    .lte("valid_from", now)
    .or(`valid_until.is.null,valid_until.gt.${now}`);

  const { data, error } = await query;

  if (error) {
    console.error("Error loading policies:", error);
    return [];
  }

  return (data as PolicyWithRelations[]) || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Subject Matching
// ─────────────────────────────────────────────────────────────────────────────

function matchSubject(
  subjects: PolicySubject[],
  context: RequestContext
): { matched: boolean; reason: string } {
  // If no subjects defined, policy applies to all
  if (!subjects || subjects.length === 0) {
    return { matched: true, reason: "No subject restrictions (applies to all)" };
  }

  // Check each subject rule
  for (const subject of subjects) {
    let subjectMatches = false;
    let matchReason = "";

    switch (subject.subject_type) {
      case "all":
        subjectMatches = true;
        matchReason = "Subject type 'all' matches everyone";
        break;

      case "user":
        if (subject.subject_value && context.user_id) {
          subjectMatches = context.user_id === subject.subject_value;
          matchReason = subjectMatches
            ? `User ID matches: ${subject.subject_value}`
            : `User ID ${context.user_id} does not match ${subject.subject_value}`;
        }
        break;

      case "role":
        if (subject.subject_value && context.user_roles) {
          subjectMatches = context.user_roles.includes(subject.subject_value);
          matchReason = subjectMatches
            ? `User has role: ${subject.subject_value}`
            : `User lacks role: ${subject.subject_value}`;
        }
        break;

      case "team":
        if (subject.subject_value && context.user_teams) {
          subjectMatches = context.user_teams.includes(subject.subject_value);
          matchReason = subjectMatches
            ? `User is in team: ${subject.subject_value}`
            : `User not in team: ${subject.subject_value}`;
        }
        break;

      case "group":
        if (subject.subject_value && context.user_groups) {
          subjectMatches = context.user_groups.includes(subject.subject_value);
          matchReason = subjectMatches
            ? `User is in group: ${subject.subject_value}`
            : `User not in group: ${subject.subject_value}`;
        }
        break;
    }

    // Handle include/exclude logic
    if (subject.include) {
      if (subjectMatches) {
        return { matched: true, reason: matchReason };
      }
    } else {
      // Exclude rule
      if (subjectMatches) {
        return { matched: false, reason: `Excluded: ${matchReason}` };
      }
    }
  }

  // No include rules matched
  const hasIncludeRules = subjects.some((s) => s.include);
  if (hasIncludeRules) {
    return { matched: false, reason: "No include subject rules matched" };
  }

  // Only exclude rules and none matched - allow
  return { matched: true, reason: "No exclude rules triggered" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Matching
// ─────────────────────────────────────────────────────────────────────────────

function matchResource(
  resources: PolicyResource[],
  context: RequestContext
): { matched: boolean; reason: string } {
  // If no resources defined, policy applies to all resources
  if (!resources || resources.length === 0) {
    return { matched: true, reason: "No resource restrictions (applies to all)" };
  }

  for (const resource of resources) {
    let resourceMatches = false;
    let matchReason = "";

    switch (resource.resource_type) {
      case "all":
        resourceMatches = true;
        matchReason = "Resource type 'all' matches everything";
        break;

      case "model":
        if (context.model && resource.resource_values) {
          resourceMatches = resource.resource_values.includes(context.model);
          matchReason = resourceMatches
            ? `Model ${context.model} is in allowed list`
            : `Model ${context.model} not in list: ${resource.resource_values.join(", ")}`;
        }
        break;

      case "application":
        if (context.application_id && resource.resource_values) {
          resourceMatches = resource.resource_values.includes(context.application_id);
          matchReason = resourceMatches
            ? `Application ${context.application_id} is in allowed list`
            : `Application ${context.application_id} not in list`;
        }
        break;

      case "prompt":
        if (context.prompt_id && resource.resource_values) {
          resourceMatches = resource.resource_values.includes(context.prompt_id);
          matchReason = resourceMatches
            ? `Prompt ${context.prompt_id} is in allowed list`
            : `Prompt ${context.prompt_id} not in list`;
        }
        break;

      case "feature":
        if (context.feature && resource.resource_values) {
          resourceMatches = resource.resource_values.includes(context.feature);
          matchReason = resourceMatches
            ? `Feature ${context.feature} is in allowed list`
            : `Feature ${context.feature} not in list`;
        }
        break;
    }

    // Handle include/exclude logic
    if (resource.include) {
      if (resourceMatches) {
        return { matched: true, reason: matchReason };
      }
    } else {
      if (resourceMatches) {
        return { matched: false, reason: `Excluded: ${matchReason}` };
      }
    }
  }

  const hasIncludeRules = resources.some((r) => r.include);
  if (hasIncludeRules) {
    return { matched: false, reason: "No include resource rules matched" };
  }

  return { matched: true, reason: "No exclude rules triggered" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Condition Evaluation
// ─────────────────────────────────────────────────────────────────────────────

function evaluateTimeCondition(
  config: TimeConditionConfig,
  context: RequestContext
): { matched: boolean; reason: string } {
  const now = context.timestamp ? new Date(context.timestamp) : new Date();
  const timezone = config.timezone || "UTC";

  // Check business hours
  if (config.business_hours !== undefined) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(formatter.format(now));
    const isBusinessHours = hour >= 9 && hour < 17;

    if (config.business_hours && !isBusinessHours) {
      return { matched: false, reason: `Outside business hours (current hour: ${hour})` };
    }
    if (!config.business_hours && isBusinessHours) {
      return { matched: false, reason: "Within business hours (restricted)" };
    }
  }

  // Check day of week
  if (config.days && config.days.length > 0) {
    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const currentDay = dayFormatter.format(now).toLowerCase();
    if (!config.days.map((d) => d.toLowerCase()).includes(currentDay)) {
      return { matched: false, reason: `Day ${currentDay} not in allowed days: ${config.days.join(", ")}` };
    }
  }

  return { matched: true, reason: "Time conditions met" };
}

function evaluateLocationCondition(
  config: LocationConditionConfig,
  context: RequestContext
): { matched: boolean; reason: string } {
  // Check country
  if (config.allowed_countries && config.allowed_countries.length > 0) {
    if (!context.country_code) {
      return { matched: false, reason: "Country not provided but country restriction exists" };
    }
    if (!config.allowed_countries.includes(context.country_code)) {
      return {
        matched: false,
        reason: `Country ${context.country_code} not in allowed: ${config.allowed_countries.join(", ")}`,
      };
    }
  }

  if (config.denied_countries && config.denied_countries.length > 0) {
    if (context.country_code && config.denied_countries.includes(context.country_code)) {
      return { matched: false, reason: `Country ${context.country_code} is denied` };
    }
  }

  // Check IP
  if (config.denied_ips && config.denied_ips.length > 0) {
    if (context.ip_address && config.denied_ips.includes(context.ip_address)) {
      return { matched: false, reason: `IP ${context.ip_address} is denied` };
    }
  }

  if (config.allowed_ips && config.allowed_ips.length > 0) {
    if (!context.ip_address) {
      return { matched: false, reason: "IP not provided but IP restriction exists" };
    }
    if (!config.allowed_ips.includes(context.ip_address)) {
      return { matched: false, reason: `IP ${context.ip_address} not in allowed list` };
    }
  }

  return { matched: true, reason: "Location conditions met" };
}

function evaluateDataCondition(
  config: DataConditionConfig,
  context: RequestContext
): { matched: boolean; reason: string } {
  // Check PII
  if (config.no_pii && context.contains_pii) {
    return {
      matched: false,
      reason: `PII detected: ${context.pii_types?.join(", ") || "unknown types"}`,
    };
  }

  // Check data classification
  if (config.allowed_classifications && config.allowed_classifications.length > 0) {
    if (context.data_classification) {
      if (!config.allowed_classifications.includes(context.data_classification)) {
        return {
          matched: false,
          reason: `Data classification '${context.data_classification}' not in allowed: ${config.allowed_classifications.join(", ")}`,
        };
      }
    }
  }

  // Check token limits
  if (config.max_tokens !== undefined) {
    const totalTokens = (context.input_tokens || 0) + (context.output_tokens || 0);
    if (totalTokens > config.max_tokens) {
      return {
        matched: false,
        reason: `Token count ${totalTokens} exceeds max ${config.max_tokens}`,
      };
    }
  }

  return { matched: true, reason: "Data conditions met" };
}

function evaluateTopicCondition(
  config: TopicConditionConfig,
  context: RequestContext
): { matched: boolean; reason: string } {
  const detectedTopics = context.detected_topics || [];

  // Check blocked topics
  if (config.blocked_topics && config.blocked_topics.length > 0) {
    const blockedFound = detectedTopics.filter((t) =>
      config.blocked_topics!.includes(t)
    );
    if (blockedFound.length > 0) {
      return {
        matched: false,
        reason: `Blocked topics detected: ${blockedFound.join(", ")}`,
      };
    }
  }

  // Check allowed topics (if specified, only these are allowed)
  if (config.allowed_topics && config.allowed_topics.length > 0) {
    const disallowed = detectedTopics.filter(
      (t) => !config.allowed_topics!.includes(t)
    );
    if (disallowed.length > 0) {
      return {
        matched: false,
        reason: `Topics not in allowed list: ${disallowed.join(", ")}`,
      };
    }
  }

  return { matched: true, reason: "Topic conditions met" };
}

function evaluateRateCondition(
  config: RateConditionConfig,
  context: RequestContext
): { matched: boolean; reason: string } {
  // Check request rate
  if (config.max_requests !== undefined && context.requests_in_period !== undefined) {
    if (context.requests_in_period >= config.max_requests) {
      return {
        matched: false,
        reason: `Request rate ${context.requests_in_period}/${config.max_requests} exceeded for period ${config.period || "day"}`,
      };
    }
  }

  // Check token rate
  if (config.max_tokens !== undefined && context.tokens_in_period !== undefined) {
    if (context.tokens_in_period >= config.max_tokens) {
      return {
        matched: false,
        reason: `Token rate ${context.tokens_in_period}/${config.max_tokens} exceeded for period ${config.period || "day"}`,
      };
    }
  }

  return { matched: true, reason: "Rate conditions met" };
}

function evaluateRiskCondition(
  config: RiskConditionConfig,
  context: RequestContext
): { matched: boolean; reason: string } {
  // Check risk score
  if (config.max_risk_score !== undefined && context.risk_score !== undefined) {
    if (context.risk_score > config.max_risk_score) {
      return {
        matched: false,
        reason: `Risk score ${context.risk_score} exceeds max ${config.max_risk_score}`,
      };
    }
  }

  // Check risk level
  if (config.max_risk_level !== undefined && context.risk_level !== undefined) {
    const levelOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const contextLevel = levelOrder[context.risk_level];
    const maxLevel = levelOrder[config.max_risk_level];
    if (contextLevel > maxLevel) {
      return {
        matched: false,
        reason: `Risk level '${context.risk_level}' exceeds max '${config.max_risk_level}'`,
      };
    }
  }

  // Check individual signal thresholds
  if (config.signal_thresholds && context.risk_signals) {
    for (const [signalType, threshold] of Object.entries(config.signal_thresholds)) {
      const signal = context.risk_signals.find((s) => s.type === signalType);
      if (signal && signal.score > threshold) {
        return {
          matched: false,
          reason: `Signal '${signalType}' score ${signal.score} exceeds threshold ${threshold}`,
        };
      }
    }
  }

  return { matched: true, reason: "Risk conditions met" };
}

function evaluateCondition(
  condition: PolicyCondition,
  context: RequestContext
): ConditionEvaluation {
  const { condition_type, condition_config } = condition;
  let result: { matched: boolean; reason: string };

  switch (condition_type) {
    case "time":
      result = evaluateTimeCondition(condition_config as TimeConditionConfig, context);
      break;
    case "location":
      result = evaluateLocationCondition(condition_config as LocationConditionConfig, context);
      break;
    case "data":
      result = evaluateDataCondition(condition_config as DataConditionConfig, context);
      break;
    case "topic":
      result = evaluateTopicCondition(condition_config as TopicConditionConfig, context);
      break;
    case "rate":
      result = evaluateRateCondition(condition_config as RateConditionConfig, context);
      break;
    case "risk":
      result = evaluateRiskCondition(condition_config as RiskConditionConfig, context);
      break;
    case "approval":
      // Approval conditions always "pass" but trigger approval action
      result = { matched: true, reason: "Approval required" };
      break;
    case "custom":
      // Custom conditions would need custom evaluation logic
      result = { matched: true, reason: "Custom condition (default pass)" };
      break;
    default:
      result = { matched: true, reason: `Unknown condition type: ${condition_type}` };
  }

  return {
    condition_id: condition.id,
    condition_type: condition_type as ConditionType,
    matched: result.matched,
    reason: result.reason,
    details: condition_config as Record<string, unknown>,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy Evaluation
// ─────────────────────────────────────────────────────────────────────────────

function evaluatePolicy(
  policy: PolicyWithRelations,
  context: RequestContext
): PolicyEvaluation {
  // Check subjects
  const subjectResult = matchSubject(policy.subjects, context);
  if (!subjectResult.matched) {
    return {
      policy_id: policy.id,
      policy_name: policy.name,
      policy_type: policy.policy_type,
      effect: policy.effect,
      priority: policy.priority,
      matched: false,
      subject_matched: false,
      resource_matched: false,
      conditions_matched: false,
      condition_evaluations: [],
      reason: subjectResult.reason,
    };
  }

  // Check resources
  const resourceResult = matchResource(policy.resources, context);
  if (!resourceResult.matched) {
    return {
      policy_id: policy.id,
      policy_name: policy.name,
      policy_type: policy.policy_type,
      effect: policy.effect,
      priority: policy.priority,
      matched: false,
      subject_matched: true,
      resource_matched: false,
      conditions_matched: false,
      condition_evaluations: [],
      reason: resourceResult.reason,
    };
  }

  // Evaluate all conditions
  const conditionEvaluations = policy.conditions.map((c) =>
    evaluateCondition(c, context)
  );

  // All conditions must be met
  const allConditionsMet = conditionEvaluations.every((e) => e.matched);
  const failedConditions = conditionEvaluations.filter((e) => !e.matched);

  return {
    policy_id: policy.id,
    policy_name: policy.name,
    policy_type: policy.policy_type,
    effect: policy.effect,
    priority: policy.priority,
    matched: allConditionsMet,
    subject_matched: true,
    resource_matched: true,
    conditions_matched: allConditionsMet,
    condition_evaluations: conditionEvaluations,
    reason: allConditionsMet
      ? `Policy matched: ${policy.name}`
      : `Conditions not met: ${failedConditions.map((c) => c.reason).join("; ")}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Evaluation Function
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluatePolicies(
  tenantId: string,
  context: RequestContext,
  options?: {
    policyIds?: string[];
    includeInactive?: boolean;
    includeTrace?: boolean;
  }
): Promise<EvaluationTrace> {
  const startTime = Date.now();
  const requestId = context.request_id || crypto.randomUUID();

  // Load policies
  const policies = await loadPolicies(tenantId, {
    policyIds: options?.policyIds,
    includeInactive: options?.includeInactive,
  });

  // Evaluate each policy
  const evaluations: PolicyEvaluation[] = policies.map((policy) =>
    evaluatePolicy(policy, context)
  );

  // Find matching policies
  const matchedPolicies = evaluations.filter((e) => e.matched);

  // Determine final decision based on highest priority matching policy
  // Policies are already sorted by priority descending
  let decision: PolicyDecision = "allow"; // Default to allow if no policies match
  let decidingPolicyId: string | null = null;
  let decidingPolicyName: string | null = null;
  const reasons: string[] = [];
  const triggeredActions: ActionType[] = [];

  if (matchedPolicies.length > 0) {
    const decidingPolicy = matchedPolicies[0]; // Highest priority
    decidingPolicyId = decidingPolicy.policy_id;
    decidingPolicyName = decidingPolicy.policy_name;

    // Check if any matched policy requires approval
    const approvalPolicy = matchedPolicies.find((p) => {
      const policy = policies.find((pol) => pol.id === p.policy_id);
      return policy?.conditions.some((c) => c.condition_type === "approval");
    });

    if (approvalPolicy) {
      decision = "require_approval";
      reasons.push(`Approval required by policy: ${approvalPolicy.policy_name}`);
      triggeredActions.push("require_approval");
    } else if (decidingPolicy.effect === "deny") {
      decision = "deny";
      reasons.push(`Denied by policy: ${decidingPolicy.policy_name}`);
      triggeredActions.push("block");
    } else {
      decision = "allow";
      reasons.push(`Allowed by policy: ${decidingPolicy.policy_name}`);
      triggeredActions.push("allow");
    }

    // Collect actions from all matched policies
    for (const eval_ of matchedPolicies) {
      const policy = policies.find((p) => p.id === eval_.policy_id);
      if (policy?.actions) {
        for (const action of policy.actions) {
          if (!triggeredActions.includes(action.action_type)) {
            triggeredActions.push(action.action_type);
          }
        }
      }
    }
  } else {
    reasons.push("No policies matched - default allow");
  }

  const evaluationTimeMs = Date.now() - startTime;

  return {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    context,
    decision,
    deciding_policy_id: decidingPolicyId,
    deciding_policy_name: decidingPolicyName,
    policies_evaluated: evaluations,
    triggered_actions: triggeredActions,
    reasons,
    evaluation_time_ms: evaluationTimeMs,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Evaluate (no trace)
// ─────────────────────────────────────────────────────────────────────────────

export async function quickEvaluate(
  tenantId: string,
  context: RequestContext
): Promise<{ decision: PolicyDecision; reasons: string[] }> {
  const trace = await evaluatePolicies(tenantId, context);
  return {
    decision: trace.decision,
    reasons: trace.reasons,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Regression Gate Integration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate deployment against regression gates
 * Used when deploying prompts or changing models
 */
export async function evaluateDeploymentGates(
  tenantId: string,
  deployment: {
    type: "prompt_deploy" | "model_change";
    promptId?: string;
    promptVersion?: number;
    modelName?: string;
    applicationId?: string;
    deployedBy?: string;
  }
): Promise<{
  canProceed: boolean;
  decision: "allow" | "block" | "warn";
  blockingGates: Array<{ gate_id: string; failure_reasons: string[] }>;
  warningGates: Array<{ gate_id: string; failure_reasons: string[] }>;
  reasons: string[];
}> {
  // Import dynamically to avoid circular dependency
  const { checkDeploymentGates } = await import("@/lib/observability/quality");
  
  const result = await checkDeploymentGates(tenantId, deployment);
  
  const reasons: string[] = [];
  
  if (result.blockingGates.length > 0) {
    reasons.push(
      `Blocked by ${result.blockingGates.length} gate(s): ` +
      result.blockingGates.flatMap(g => g.failure_reasons).join("; ")
    );
  }
  
  if (result.warningGates.length > 0) {
    reasons.push(
      `Warnings from ${result.warningGates.length} gate(s): ` +
      result.warningGates.flatMap(g => g.failure_reasons).join("; ")
    );
  }
  
  if (result.passedGates.length > 0) {
    reasons.push(`Passed ${result.passedGates.length} gate(s)`);
  }
  
  return {
    canProceed: result.canProceed,
    decision: result.canProceed
      ? result.warningGates.length > 0
        ? "warn"
        : "allow"
      : "block",
    blockingGates: result.blockingGates.map(g => ({
      gate_id: g.gate_id,
      failure_reasons: g.failure_reasons,
    })),
    warningGates: result.warningGates.map(g => ({
      gate_id: g.gate_id,
      failure_reasons: g.failure_reasons,
    })),
    reasons,
  };
}
