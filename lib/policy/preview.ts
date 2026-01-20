/* ═══════════════════════════════════════════════════════════════════════════
   Policy Impact Preview
   Replay historical decisions to preview impact of policy changes
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  PolicyWithRelations,
  PolicyChange,
  RequestContext,
  ImpactPreviewRequest,
  ImpactPreviewResponse,
  FlippedDecision,
  PolicyDecision,
} from "@/types/policy";
import { loadPolicies, evaluatePolicies } from "./evaluator";

// ─────────────────────────────────────────────────────────────────────────────
// Load Historical Decisions
// ─────────────────────────────────────────────────────────────────────────────

type HistoricalDecision = {
  id: string;
  request_id: string;
  decision: PolicyDecision;
  context: RequestContext;
  created_at: string;
};

async function loadHistoricalDecisions(
  tenantId: string,
  days: number,
  limit: number
): Promise<HistoricalDecision[]> {
  const supabase = await createSupabaseAdmin();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const { data, error } = await supabase
    .from("policy_decisions")
    .select("id, request_id, decision, policies_evaluated, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit * 2); // Fetch more to allow for filtering

  if (error) {
    console.error("Error loading historical decisions:", error);
    return [];
  }

  // Transform to our format - extract context from the stored data
  // In a real implementation, you'd store the full context in policy_decisions
  return (data || []).slice(0, limit).map((row) => ({
    id: row.id,
    request_id: row.request_id || row.id,
    decision: row.decision as PolicyDecision,
    context: extractContextFromDecision(row),
    created_at: row.created_at,
  }));
}

function extractContextFromDecision(decision: Record<string, unknown>): RequestContext {
  // Extract context from the policies_evaluated field or reconstruct it
  const evaluated = decision.policies_evaluated as Array<{
    context?: RequestContext;
  }> | null;
  
  if (evaluated && evaluated.length > 0 && evaluated[0].context) {
    return evaluated[0].context;
  }

  // Return minimal context if not stored
  return {
    request_id: (decision.request_id as string) || (decision.id as string),
    timestamp: decision.created_at as string,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply Policy Changes (in memory)
// ─────────────────────────────────────────────────────────────────────────────

function applyPolicyChanges(
  existingPolicies: PolicyWithRelations[],
  changes: PolicyChange[]
): PolicyWithRelations[] {
  let policies = [...existingPolicies];

  for (const change of changes) {
    switch (change.type) {
      case "create":
        if (change.policy) {
          // Generate a temporary ID for new policy
          const newPolicy: PolicyWithRelations = {
            id: `temp-${crypto.randomUUID()}`,
            tenant_id: change.policy.tenant_id || "",
            name: change.policy.name || "New Policy",
            description: change.policy.description || null,
            policy_type: change.policy.policy_type || "access",
            effect: change.policy.effect || "allow",
            priority: change.policy.priority || 0,
            is_active: change.policy.is_active ?? true,
            valid_from: change.policy.valid_from || new Date().toISOString(),
            valid_until: change.policy.valid_until || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: null,
            subjects: change.policy.subjects || [],
            resources: change.policy.resources || [],
            conditions: change.policy.conditions || [],
            actions: change.policy.actions || [],
          };
          policies.push(newPolicy);
        }
        break;

      case "update":
        if (change.policy_id && change.policy) {
          policies = policies.map((p) => {
            if (p.id === change.policy_id) {
              return {
                ...p,
                ...change.policy,
                subjects: change.policy!.subjects || p.subjects,
                resources: change.policy!.resources || p.resources,
                conditions: change.policy!.conditions || p.conditions,
                actions: change.policy!.actions || p.actions,
              };
            }
            return p;
          });
        }
        break;

      case "delete":
        if (change.policy_id) {
          policies = policies.filter((p) => p.id !== change.policy_id);
        }
        break;
    }
  }

  return policies;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluate with Modified Policies
// ─────────────────────────────────────────────────────────────────────────────

async function evaluateWithPolicies(
  policies: PolicyWithRelations[],
  context: RequestContext
): Promise<PolicyDecision> {
  // Simplified in-memory evaluation
  // Sort by priority descending
  const sorted = [...policies].sort((a, b) => b.priority - a.priority);

  for (const policy of sorted) {
    // Check if policy applies
    const subjectMatches = matchSubjectSimple(policy, context);
    const resourceMatches = matchResourceSimple(policy, context);
    const conditionsMatch = matchConditionsSimple(policy, context);

    if (subjectMatches && resourceMatches && conditionsMatch) {
      // Check for approval conditions
      const hasApproval = policy.conditions.some(
        (c) => c.condition_type === "approval"
      );
      if (hasApproval) {
        return "require_approval";
      }
      return policy.effect === "deny" ? "deny" : "allow";
    }
  }

  return "allow"; // Default
}

function matchSubjectSimple(
  policy: PolicyWithRelations,
  context: RequestContext
): boolean {
  if (!policy.subjects || policy.subjects.length === 0) return true;

  for (const subject of policy.subjects) {
    if (subject.subject_type === "all" && subject.include) return true;
    if (subject.subject_type === "user" && subject.include) {
      if (context.user_id === subject.subject_value) return true;
    }
    if (subject.subject_type === "role" && subject.include) {
      if (context.user_roles?.includes(subject.subject_value || "")) return true;
    }
    if (subject.subject_type === "team" && subject.include) {
      if (context.user_teams?.includes(subject.subject_value || "")) return true;
    }
  }

  const hasIncludes = policy.subjects.some((s) => s.include);
  return !hasIncludes; // No include rules means allow all
}

function matchResourceSimple(
  policy: PolicyWithRelations,
  context: RequestContext
): boolean {
  if (!policy.resources || policy.resources.length === 0) return true;

  for (const resource of policy.resources) {
    if (resource.resource_type === "all" && resource.include) return true;
    if (resource.resource_type === "model" && resource.include) {
      if (
        context.model &&
        resource.resource_values?.includes(context.model)
      )
        return true;
    }
    if (resource.resource_type === "application" && resource.include) {
      if (
        context.application_id &&
        resource.resource_values?.includes(context.application_id)
      )
        return true;
    }
  }

  const hasIncludes = policy.resources.some((r) => r.include);
  return !hasIncludes;
}

function matchConditionsSimple(
  policy: PolicyWithRelations,
  context: RequestContext
): boolean {
  if (!policy.conditions || policy.conditions.length === 0) return true;

  for (const condition of policy.conditions) {
    const config = condition.condition_config as Record<string, unknown>;

    switch (condition.condition_type) {
      case "data":
        if (config.no_pii && context.contains_pii) return false;
        break;
      case "risk":
        if (config.max_risk_score !== undefined && context.risk_score !== undefined) {
          if (context.risk_score > (config.max_risk_score as number)) return false;
        }
        break;
      case "topic":
        if (config.blocked_topics && context.detected_topics) {
          const blocked = config.blocked_topics as string[];
          if (context.detected_topics.some((t) => blocked.includes(t))) return false;
        }
        break;
      // Other conditions would need similar handling
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Preview Function
// ─────────────────────────────────────────────────────────────────────────────

export async function previewPolicyChanges(
  tenantId: string,
  request: ImpactPreviewRequest
): Promise<ImpactPreviewResponse> {
  const daysToAnalyze = request.days_to_analyze || 7;
  const maxSamples = request.max_samples || 100;

  // Load current policies
  const currentPolicies = await loadPolicies(tenantId);

  // Apply proposed changes
  const proposedPolicies = applyPolicyChanges(currentPolicies, request.changes);

  // Load historical decisions
  const historicalDecisions = await loadHistoricalDecisions(
    tenantId,
    daysToAnalyze,
    maxSamples * 10 // Load more to find flipped ones
  );

  // Re-evaluate each decision with proposed policies
  const flippedDecisions: FlippedDecision[] = [];
  let allowToDeny = 0;
  let denyToAllow = 0;

  for (const historical of historicalDecisions) {
    // Get original decision
    const originalDecision = historical.decision;

    // Evaluate with proposed policies
    const newDecision = await evaluateWithPolicies(
      proposedPolicies,
      historical.context
    );

    // Check if flipped
    if (originalDecision !== newDecision) {
      if (originalDecision === "allow" && newDecision === "deny") {
        allowToDeny++;
      } else if (originalDecision === "deny" && newDecision === "allow") {
        denyToAllow++;
      }

      if (flippedDecisions.length < maxSamples) {
        flippedDecisions.push({
          original_decision_id: historical.id,
          original_decision: originalDecision,
          new_decision: newDecision,
          request_context: historical.context,
          timestamp: historical.created_at,
          reason: `Decision changed from ${originalDecision} to ${newDecision}`,
        });
      }
    }
  }

  const totalFlipped = allowToDeny + denyToAllow;
  const impactPercentage =
    historicalDecisions.length > 0
      ? (totalFlipped / historicalDecisions.length) * 100
      : 0;

  // Determine risk level
  let riskLevel: "low" | "medium" | "high" | "critical";
  let riskReason: string;

  if (impactPercentage > 20 || allowToDeny > 50) {
    riskLevel = "critical";
    riskReason = `High impact: ${impactPercentage.toFixed(1)}% of decisions would change, ${allowToDeny} allow→deny`;
  } else if (impactPercentage > 10 || allowToDeny > 20) {
    riskLevel = "high";
    riskReason = `Significant impact: ${impactPercentage.toFixed(1)}% of decisions would change`;
  } else if (impactPercentage > 5 || totalFlipped > 10) {
    riskLevel = "medium";
    riskReason = `Moderate impact: ${totalFlipped} decisions would change`;
  } else {
    riskLevel = "low";
    riskReason = `Low impact: ${totalFlipped} decisions would change`;
  }

  return {
    changes_analyzed: request.changes.length,
    decisions_replayed: historicalDecisions.length,
    flipped_decisions: flippedDecisions,
    summary: {
      allow_to_deny: allowToDeny,
      deny_to_allow: denyToAllow,
      total_flipped: totalFlipped,
      impact_percentage: impactPercentage,
    },
    risk_assessment: {
      level: riskLevel,
      reason: riskReason,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview Single Policy Change (convenience wrapper)
// ─────────────────────────────────────────────────────────────────────────────

export async function previewSinglePolicyChange(
  tenantId: string,
  policyId: string,
  changes: Partial<PolicyWithRelations>,
  options?: {
    days?: number;
    maxSamples?: number;
  }
): Promise<ImpactPreviewResponse> {
  return previewPolicyChanges(tenantId, {
    changes: [
      {
        type: "update",
        policy_id: policyId,
        policy: changes,
      },
    ],
    days_to_analyze: options?.days || 7,
    max_samples: options?.maxSamples || 100,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Flipped Request IDs
// ─────────────────────────────────────────────────────────────────────────────

export function exportFlippedRequestIds(
  preview: ImpactPreviewResponse
): string[] {
  return preview.flipped_decisions.map((d) => d.original_decision_id);
}
