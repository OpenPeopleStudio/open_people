/* ═══════════════════════════════════════════════════════════════════════════
   Policy-Aware Gateway Router
   Routes AI requests to appropriate providers based on policy evaluation,
   PII detection, risk levels, and budget constraints.
   ═══════════════════════════════════════════════════════════════════════════ */

import { evaluatePolicies, loadPolicies } from "@/lib/policy/evaluator";
import type {
  RequestContext,
  PolicyDecision,
  RoutingDecision,
  GatewayEvaluationResult,
  BudgetContext,
  RoutingConditionConfig,
  PolicyWithRelations,
} from "@/types/policy";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Gateway Provider Configuration
// ─────────────────────────────────────────────────────────────────────────────

export type GatewayProviderConfig = {
  id: string;
  provider_name: string;
  display_name: string;
  base_url: string;
  available_models: string[];
  rate_limit_rpm?: number;
  rate_limit_tpm?: number;
  is_healthy: boolean;
  is_active: boolean;
  priority: number;
  // Security & compliance flags
  pii_approved: boolean;
  hipaa_compliant: boolean;
  data_residency?: string; // e.g., "US", "EU"
  // Cost info
  cost_per_1k_input: number;
  cost_per_1k_output: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Load Gateway Providers
// ─────────────────────────────────────────────────────────────────────────────

export async function loadGatewayProviders(
  tenantId: string
): Promise<GatewayProviderConfig[]> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("gateway_providers")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error loading gateway providers:", error);
    // Return default OpenAI provider if table doesn't exist or error
    return [
      {
        id: "default-openai",
        provider_name: "openai",
        display_name: "OpenAI",
        base_url: "https://api.openai.com/v1",
        available_models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
        is_healthy: true,
        is_active: true,
        priority: 100,
        pii_approved: true, // OpenAI has DPA options
        hipaa_compliant: false,
        cost_per_1k_input: 0.005,
        cost_per_1k_output: 0.015,
      },
    ];
  }

  return (data || []).map((p) => ({
    id: p.id,
    provider_name: p.provider_name,
    display_name: p.display_name || p.provider_name,
    base_url: p.base_url,
    available_models: p.available_models || [],
    rate_limit_rpm: p.rate_limit_rpm,
    rate_limit_tpm: p.rate_limit_tpm,
    is_healthy: p.is_healthy ?? true,
    is_active: p.is_active ?? true,
    priority: p.priority ?? 0,
    pii_approved: p.pii_approved ?? false,
    hipaa_compliant: p.hipaa_compliant ?? false,
    data_residency: p.data_residency,
    cost_per_1k_input: p.cost_per_1k_input ?? 0,
    cost_per_1k_output: p.cost_per_1k_output ?? 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Budget Context
// ─────────────────────────────────────────────────────────────────────────────

export async function loadBudgetContext(
  tenantId: string
): Promise<BudgetContext> {
  const supabase = await createSupabaseAdmin();

  // Get tenant budget settings
  const { data: settings } = await supabase
    .from("tenant_rate_limits")
    .select("*")
    .eq("tenant_id", tenantId)
    .single();

  if (!settings) {
    return {}; // No budget constraints
  }

  // Get current spend from ai_runs
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const { data: dailySpend } = await supabase
    .from("ai_runs")
    .select("estimated_cost_usd")
    .eq("tenant_id", tenantId)
    .gte("created_at", startOfDay);

  const { data: monthlySpend } = await supabase
    .from("ai_runs")
    .select("estimated_cost_usd")
    .eq("tenant_id", tenantId)
    .gte("created_at", startOfMonth);

  const dailySpentUsd = (dailySpend || []).reduce(
    (sum, r) => sum + (r.estimated_cost_usd || 0),
    0
  );
  const monthlySpentUsd = (monthlySpend || []).reduce(
    (sum, r) => sum + (r.estimated_cost_usd || 0),
    0
  );

  return {
    daily_budget_usd: settings.cost_per_day,
    daily_spent_usd: dailySpentUsd,
    monthly_budget_usd: settings.cost_per_month,
    monthly_spent_usd: monthlySpentUsd,
    is_over_daily_budget:
      settings.cost_per_day != null && dailySpentUsd >= settings.cost_per_day,
    is_over_monthly_budget:
      settings.cost_per_month != null && monthlySpentUsd >= settings.cost_per_month,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluate Routing Conditions
// ─────────────────────────────────────────────────────────────────────────────

function evaluateRoutingConditions(
  policies: PolicyWithRelations[],
  context: RequestContext,
  providers: GatewayProviderConfig[],
  budget: BudgetContext
): RoutingDecision {
  const routingReasons: string[] = [];
  let selectedProviderId: string | undefined;
  let selectedModel: string | undefined;
  let systemPromptPrefix: string | undefined;
  let modifiedTemperature: number | undefined;
  let routingPolicyId: string | undefined;
  let routingPolicyName: string | undefined;

  // Find policies with routing conditions
  for (const policy of policies) {
    if (!policy.is_active) continue;

    for (const condition of policy.conditions) {
      if (condition.condition_type !== "routing") continue;

      const config = condition.condition_config as RoutingConditionConfig;

      // PII-based routing
      if (config.pii_detected && context.contains_pii) {
        const approvedProviders = config.pii_detected.route_to_providers;
        if (approvedProviders && approvedProviders.length > 0) {
          // Find a healthy, approved provider
          const piiProvider = providers.find(
            (p) =>
              approvedProviders.includes(p.id) && p.is_healthy && p.pii_approved
          );
          if (piiProvider) {
            selectedProviderId = piiProvider.id;
            routingReasons.push(
              `PII detected (${context.pii_types?.join(", ") || "unknown"}): routing to PII-approved provider "${piiProvider.display_name}"`
            );
            routingPolicyId = policy.id;
            routingPolicyName = policy.name;
          } else if (config.pii_detected.block_if_no_approved_provider) {
            routingReasons.push(
              "PII detected but no approved provider available - request should be blocked"
            );
          }
        }
      }

      // Risk-based routing
      if (
        config.risk_level_high &&
        (context.risk_level === "high" || context.risk_level === "critical")
      ) {
        if (config.risk_level_high.prefer_provider) {
          const safeProvider = providers.find(
            (p) => p.id === config.risk_level_high!.prefer_provider && p.is_healthy
          );
          if (safeProvider) {
            selectedProviderId = safeProvider.id;
            routingReasons.push(
              `High risk level (${context.risk_level}): routing to safer provider "${safeProvider.display_name}"`
            );
            routingPolicyId = policy.id;
            routingPolicyName = policy.name;
          }
        }
        if (config.risk_level_high.prefer_model) {
          selectedModel = config.risk_level_high.prefer_model;
          routingReasons.push(
            `High risk level: using safer model "${selectedModel}"`
          );
        }
        if (config.risk_level_high.add_safety_prompt) {
          systemPromptPrefix =
            "IMPORTANT: This request has been flagged as potentially high-risk. " +
            "Please be extra careful with your response, avoid speculation, " +
            "and err on the side of caution.";
          routingReasons.push("Added safety system prompt prefix");
        }
      }

      // Budget-based routing
      if (
        config.budget_exceeded &&
        (budget.is_over_daily_budget || budget.is_over_monthly_budget)
      ) {
        if (config.budget_exceeded.fallback_provider) {
          const cheapProvider = providers.find(
            (p) =>
              p.id === config.budget_exceeded!.fallback_provider && p.is_healthy
          );
          if (cheapProvider) {
            selectedProviderId = cheapProvider.id;
            routingReasons.push(
              `Budget exceeded: routing to cheaper provider "${cheapProvider.display_name}"`
            );
            routingPolicyId = policy.id;
            routingPolicyName = policy.name;
          }
        }
        if (config.budget_exceeded.fallback_model) {
          selectedModel = config.budget_exceeded.fallback_model;
          routingReasons.push(
            `Budget exceeded: using cheaper model "${selectedModel}"`
          );
        }
        if (
          config.budget_exceeded.block_if_no_fallback &&
          !selectedProviderId &&
          !selectedModel
        ) {
          routingReasons.push(
            "Budget exceeded and no fallback configured - request should be blocked"
          );
        }
      }

      // Data classification routing
      if (config.data_classification && context.data_classification) {
        const classConfig = config.data_classification[context.data_classification];
        if (classConfig) {
          if (classConfig.allowed_providers && classConfig.allowed_providers.length > 0) {
            const allowedProvider = providers.find(
              (p) =>
                classConfig.allowed_providers!.includes(p.id) && p.is_healthy
            );
            if (allowedProvider) {
              selectedProviderId = allowedProvider.id;
              routingReasons.push(
                `Data classification "${context.data_classification}": routing to allowed provider "${allowedProvider.display_name}"`
              );
              routingPolicyId = policy.id;
              routingPolicyName = policy.name;
            }
          }
          if (classConfig.preferred_model) {
            selectedModel = classConfig.preferred_model;
            routingReasons.push(
              `Data classification "${context.data_classification}": using model "${selectedModel}"`
            );
          }
        }
      }
    }
  }

  // If no specific routing, use default (highest priority healthy provider)
  if (!selectedProviderId) {
    const defaultProvider = providers.find((p) => p.is_healthy);
    if (defaultProvider) {
      selectedProviderId = defaultProvider.id;
      if (routingReasons.length === 0) {
        routingReasons.push(
          `Using default provider "${defaultProvider.display_name}"`
        );
      }
    }
  }

  const modifiedRequest =
    systemPromptPrefix || modifiedTemperature !== undefined
      ? {
          ...(systemPromptPrefix ? { system_prompt_prefix: systemPromptPrefix } : {}),
          ...(modifiedTemperature !== undefined ? { temperature: modifiedTemperature } : {}),
        }
      : undefined;

  return {
    routing_reasons: routingReasons,
    ...(selectedProviderId ? { provider_id: selectedProviderId } : {}),
    ...(selectedModel ? { model: selectedModel } : {}),
    ...(modifiedRequest ? { modified_request: modifiedRequest } : {}),
    ...(routingPolicyId ? { routing_policy_id: routingPolicyId } : {}),
    ...(routingPolicyName ? { routing_policy_name: routingPolicyName } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Gateway Evaluation Function
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateGatewayRequest(
  tenantId: string,
  context: RequestContext,
  options?: {
    includeBudget?: boolean;
    includeTrace?: boolean;
  }
): Promise<GatewayEvaluationResult> {
  const startTime = Date.now();
  const requestId = context.request_id || crypto.randomUUID();

  // Load providers, policies, and optionally budget in parallel
  const [providers, policies, budget] = await Promise.all([
    loadGatewayProviders(tenantId),
    loadPolicies(tenantId),
    options?.includeBudget !== false
      ? loadBudgetContext(tenantId)
      : Promise.resolve({} as BudgetContext),
  ]);

  // Evaluate access policies
  const policyOptions: { includeTrace?: boolean } = {};
  if (options?.includeTrace !== undefined) {
    policyOptions.includeTrace = options.includeTrace;
  }
  const policyTrace = await evaluatePolicies(tenantId, context, policyOptions);

  // Evaluate routing conditions
  const routing = evaluateRoutingConditions(policies, context, providers, budget);

  // Add budget info to routing reasons if relevant
  if (budget.is_over_daily_budget) {
    routing.routing_reasons.push(
      `Daily budget: $${budget.daily_spent_usd?.toFixed(2)}/$${budget.daily_budget_usd?.toFixed(2)} (exceeded)`
    );
  }
  if (budget.is_over_monthly_budget) {
    routing.routing_reasons.push(
      `Monthly budget: $${budget.monthly_spent_usd?.toFixed(2)}/$${budget.monthly_budget_usd?.toFixed(2)} (exceeded)`
    );
  }

  const evaluationTimeMs = Date.now() - startTime;

  const evaluationResult: GatewayEvaluationResult = {
    policy_decision: policyTrace.decision,
    policy_reasons: policyTrace.reasons,
    routing,
    request_id: requestId,
    tenant_id: tenantId,
    evaluation_time_ms: evaluationTimeMs,
  };
  if (options?.includeTrace) {
    evaluationResult.policy_trace = policyTrace;
  }

  return evaluationResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Gateway Evaluation (minimal overhead)
// ─────────────────────────────────────────────────────────────────────────────

export async function quickGatewayEvaluate(
  tenantId: string,
  context: RequestContext
): Promise<{
  decision: PolicyDecision;
  provider_id?: string;
  model?: string;
  reasons: string[];
}> {
  const result = await evaluateGatewayRequest(tenantId, context, {
    includeBudget: true,
    includeTrace: false,
  });

  const quickResult: {
    decision: PolicyDecision;
    provider_id?: string;
    model?: string;
    reasons: string[];
  } = {
    decision: result.policy_decision,
    reasons: [...result.policy_reasons, ...result.routing.routing_reasons],
  };
  if (result.routing.provider_id) {
    quickResult.provider_id = result.routing.provider_id;
  }
  if (result.routing.model) {
    quickResult.model = result.routing.model;
  }

  return quickResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Provider Config by ID
// ─────────────────────────────────────────────────────────────────────────────

export async function getProviderConfig(
  tenantId: string,
  providerId: string
): Promise<GatewayProviderConfig | null> {
  const providers = await loadGatewayProviders(tenantId);
  return providers.find((p) => p.id === providerId) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Select Best Provider (with fallback chain)
// ─────────────────────────────────────────────────────────────────────────────

export async function selectBestProvider(
  tenantId: string,
  options: {
    requiresPiiApproval?: boolean;
    requiresHipaaCompliance?: boolean;
    dataResidency?: string;
    preferCheap?: boolean;
    requestedModel?: string;
  } = {}
): Promise<GatewayProviderConfig | null> {
  const providers = await loadGatewayProviders(tenantId);

  let candidates = providers.filter((p) => p.is_healthy && p.is_active);

  // Filter by PII approval
  if (options.requiresPiiApproval) {
    candidates = candidates.filter((p) => p.pii_approved);
  }

  // Filter by HIPAA compliance
  if (options.requiresHipaaCompliance) {
    candidates = candidates.filter((p) => p.hipaa_compliant);
  }

  // Filter by data residency
  if (options.dataResidency) {
    candidates = candidates.filter(
      (p) => !p.data_residency || p.data_residency === options.dataResidency
    );
  }

  // Filter by model availability
  if (options.requestedModel) {
    candidates = candidates.filter((p) =>
      p.available_models.includes(options.requestedModel!)
    );
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by preference
  if (options.preferCheap) {
    candidates.sort(
      (a, b) =>
        a.cost_per_1k_input +
        a.cost_per_1k_output -
        (b.cost_per_1k_input + b.cost_per_1k_output)
    );
  } else {
    // Sort by priority (highest first)
    candidates.sort((a, b) => b.priority - a.priority);
  }

  return candidates[0];
}
