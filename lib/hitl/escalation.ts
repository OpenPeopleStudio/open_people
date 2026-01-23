/* ═══════════════════════════════════════════════════════════════════════════
   HITL Escalation Service
   Handles escalation of items to human review queues
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { RiskEvaluation, RiskLevel, RiskSignalType } from "@/types/policy";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TriggerType =
  | "confidence"
  | "content_flag"
  | "amount"
  | "random_sample"
  | "risk_level"
  | "risk_score"
  | "risk_signal"
  | "policy_violation"
  | "user_request"
  | "model_disagreement";

export type TriggerConfig = {
  type: TriggerType;
  priority?: "low" | "medium" | "high" | "urgent";
  // Type-specific fields
  threshold?: number;
  min_level?: RiskLevel;
  min_score?: number;
  signal_type?: RiskSignalType;
  categories?: string[];
  percentage?: number;
  field?: string;
};

export type HITLPolicy = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  application_ids: string[] | null;
  triggers: TriggerConfig[];
  queue_id: string | null;
  auto_assign: boolean;
  is_active: boolean;
};

export type EscalationRequest = {
  source_type: "ai_response" | "moderation" | "classification" | "chat" | "email" | "custom";
  source_id?: string;
  audit_log_id?: string;
  application_id?: string;
  
  // Content for review
  input: string;
  output: string;
  context?: Record<string, unknown>;
  ai_decision?: string;
  confidence?: number;
  
  // Risk info
  risk_evaluation?: RiskEvaluation;
  
  // Additional context
  policy_triggers?: string[];
  kb_sources?: Array<{ id: string; title: string; excerpt?: string }>;
  user_metadata?: Record<string, unknown>;
  
  // Override
  force_queue_id?: string;
  force_priority?: "low" | "medium" | "high" | "urgent";
};

export type EscalationResult = {
  escalated: boolean;
  item_id?: string;
  queue_id?: string;
  policy_id?: string;
  trigger_type?: TriggerType;
  priority?: string;
  reason?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Load Active Policies
// ─────────────────────────────────────────────────────────────────────────────

async function loadActivePolicies(
  tenantId: string,
  applicationId?: string
): Promise<HITLPolicy[]> {
  const supabase = await createSupabaseAdmin();

  const query = supabase
    .from("hitl_policies")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { data, error } = await query;

  if (error) {
    console.error("Error loading HITL policies:", error);
    return [];
  }

  // Filter by application if specified
  let policies = (data || []) as HITLPolicy[];
  
  if (applicationId) {
    policies = policies.filter(
      (p) => !p.application_ids || p.application_ids.includes(applicationId)
    );
  }

  return policies;
}

// ─────────────────────────────────────────────────────────────────────────────
// Check Triggers
// ─────────────────────────────────────────────────────────────────────────────

function checkTrigger(
  trigger: TriggerConfig,
  request: EscalationRequest
): { matched: boolean; reason: string } {
  switch (trigger.type) {
    case "confidence":
      if (request.confidence !== undefined && trigger.threshold !== undefined) {
        if (request.confidence < trigger.threshold) {
          return {
            matched: true,
            reason: `Confidence ${request.confidence} below threshold ${trigger.threshold}`,
          };
        }
      }
      break;

    case "content_flag":
      if (trigger.categories && request.policy_triggers) {
        const matched = trigger.categories.filter((c) =>
          request.policy_triggers!.includes(c)
        );
        if (matched.length > 0) {
          return {
            matched: true,
            reason: `Content flags triggered: ${matched.join(", ")}`,
          };
        }
      }
      break;

    case "risk_level":
      if (request.risk_evaluation && trigger.min_level) {
        const levelOrder: Record<RiskLevel, number> = {
          low: 0,
          medium: 1,
          high: 2,
          critical: 3,
        };
        const currentLevel = levelOrder[request.risk_evaluation.risk_level];
        const minLevel = levelOrder[trigger.min_level];
        if (currentLevel >= minLevel) {
          return {
            matched: true,
            reason: `Risk level ${request.risk_evaluation.risk_level} meets threshold ${trigger.min_level}`,
          };
        }
      }
      break;

    case "risk_score":
      if (request.risk_evaluation && trigger.min_score !== undefined) {
        if (request.risk_evaluation.risk_score >= trigger.min_score) {
          return {
            matched: true,
            reason: `Risk score ${request.risk_evaluation.risk_score} exceeds ${trigger.min_score}`,
          };
        }
      }
      break;

    case "risk_signal":
      if (request.risk_evaluation && trigger.signal_type && trigger.min_score !== undefined) {
        const signal = request.risk_evaluation.signals.find(
          (s) => s.type === trigger.signal_type
        );
        if (signal && signal.score >= trigger.min_score) {
          return {
            matched: true,
            reason: `Signal '${trigger.signal_type}' score ${signal.score} exceeds ${trigger.min_score}`,
          };
        }
      }
      break;

    case "random_sample":
      if (trigger.percentage !== undefined) {
        const random = Math.random() * 100;
        if (random < trigger.percentage) {
          return {
            matched: true,
            reason: `Random sample (${trigger.percentage}% sampling rate)`,
          };
        }
      }
      break;

    case "policy_violation":
      if (request.policy_triggers && request.policy_triggers.length > 0) {
        return {
          matched: true,
          reason: `Policy violations: ${request.policy_triggers.join(", ")}`,
        };
      }
      break;

    case "user_request":
      // This would be set explicitly in the request
      if (request.context?.user_requested_review) {
        return {
          matched: true,
          reason: "User requested human review",
        };
      }
      break;
  }

  return { matched: false, reason: "" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create HITL Item
// ─────────────────────────────────────────────────────────────────────────────

async function createHITLItem(
  tenantId: string,
  request: EscalationRequest,
  policyId: string | null,
  queueId: string,
  triggerType: TriggerType,
  triggerDetails: Record<string, unknown>,
  priority: "low" | "medium" | "high" | "urgent"
): Promise<string | null> {
  const supabase = await createSupabaseAdmin();

  // Get queue SLA for due_at calculation
  const { data: queue } = await supabase
    .from("hitl_queues")
    .select("sla_minutes")
    .eq("id", queueId)
    .single();

  const dueAt = queue?.sla_minutes
    ? new Date(Date.now() + queue.sla_minutes * 60 * 1000).toISOString()
    : null;

  // Build review content
  const reviewContent = {
    input: request.input,
    output: request.output,
    context: request.context || {},
    ai_decision: request.ai_decision,
    confidence: request.confidence,
    risk_score: request.risk_evaluation?.risk_score,
    risk_level: request.risk_evaluation?.risk_level,
    risk_signals: request.risk_evaluation?.signals,
    policy_triggers: request.policy_triggers || [],
    kb_sources: request.kb_sources || [],
    user_metadata: request.user_metadata || {},
  };

  const { data, error } = await supabase
    .from("hitl_items")
    .insert({
      tenant_id: tenantId,
      policy_id: policyId,
      queue_id: queueId,
      audit_log_id: request.audit_log_id,
      source_type: request.source_type,
      source_id: request.source_id,
      trigger_type: triggerType,
      trigger_details: triggerDetails,
      priority,
      review_content: reviewContent,
      risk_evaluation_id: request.risk_evaluation?.id,
      status: "pending",
      due_at: dueAt,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating HITL item:", error);
    return null;
  }

  return data.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Escalation Function
// ─────────────────────────────────────────────────────────────────────────────

export async function escalateToHITL(
  tenantId: string,
  request: EscalationRequest
): Promise<EscalationResult> {
  // Check if risk evaluation already recommends escalation
  if (request.risk_evaluation?.should_escalate && !request.force_queue_id) {
    // Still need to find a queue
    const policies = await loadActivePolicies(tenantId, request.application_id);
    
    // Find first policy with a queue
    const policyWithQueue = policies.find((p) => p.queue_id);
    
    if (policyWithQueue?.queue_id) {
      const itemId = await createHITLItem(
        tenantId,
        request,
        policyWithQueue.id,
        policyWithQueue.queue_id,
        "risk_level",
        {
          risk_score: request.risk_evaluation.risk_score,
          risk_level: request.risk_evaluation.risk_level,
          escalation_reasons: request.risk_evaluation.escalation_reasons,
        },
        request.force_priority || "high"
      );

      if (itemId) {
        return {
          escalated: true,
          item_id: itemId,
          queue_id: policyWithQueue.queue_id,
          policy_id: policyWithQueue.id,
          trigger_type: "risk_level",
          priority: request.force_priority || "high",
          reason: `Risk evaluation recommended escalation: ${request.risk_evaluation.escalation_reasons?.join(", ")}`,
        };
      }
    }
  }

  // Load and check policies
  const policies = await loadActivePolicies(tenantId, request.application_id);

  for (const policy of policies) {
    if (!policy.triggers || policy.triggers.length === 0) continue;
    if (!policy.queue_id && !request.force_queue_id) continue;

    for (const trigger of policy.triggers) {
      const result = checkTrigger(trigger, request);

      if (result.matched) {
        const queueId = request.force_queue_id || policy.queue_id!;
        const priority = request.force_priority || trigger.priority || "medium";

        const itemId = await createHITLItem(
          tenantId,
          request,
          policy.id,
          queueId,
          trigger.type,
          { trigger_config: trigger, match_reason: result.reason },
          priority
        );

        if (itemId) {
          return {
            escalated: true,
            item_id: itemId,
            queue_id: queueId,
            policy_id: policy.id,
            trigger_type: trigger.type,
            priority,
            reason: result.reason,
          };
        }
      }
    }
  }

  // No escalation needed
  return {
    escalated: false,
    reason: "No escalation triggers matched",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Force Escalation (for manual escalation)
// ─────────────────────────────────────────────────────────────────────────────

export async function forceEscalate(
  tenantId: string,
  queueId: string,
  request: EscalationRequest,
  reason: string
): Promise<EscalationResult> {
  const itemId = await createHITLItem(
    tenantId,
    request,
    null, // No policy
    queueId,
    "user_request",
    { manual_reason: reason },
    request.force_priority || "medium"
  );

  if (itemId) {
    return {
      escalated: true,
      item_id: itemId,
      queue_id: queueId,
      trigger_type: "user_request",
      priority: request.force_priority || "medium",
      reason,
    };
  }

  return {
    escalated: false,
    reason: "Failed to create escalation item",
  };
}
