/* ═══════════════════════════════════════════════════════════════════════════
   Incident Quick Actions
   "Create from incident" shortcuts for evals, guardrails, and policies
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { RequestContext } from "@/types/policy";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type IncidentQuickActionType =
  | "generate_eval_tests"
  | "add_guardrail_pattern"
  | "create_policy_exception_review"
  | "add_to_training_set"
  | "create_knowledge_article";

export type IncidentDetails = {
  id: string;
  tenant_id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  root_cause?: string;
  related_audit_log_ids?: string[];
  context?: Record<string, unknown>;
};

export type QuickActionResult = {
  success: boolean;
  action_type: IncidentQuickActionType;
  created_items: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  error?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate Eval Tests from Incident
// ─────────────────────────────────────────────────────────────────────────────

export async function generateEvalTestsFromIncident(
  incident: IncidentDetails
): Promise<QuickActionResult> {
  const supabase = await createSupabaseAdmin();
  const createdItems: QuickActionResult["created_items"] = [];

  try {
    // Generate test cases based on incident type
    const testCases = generateTestCasesForIncident(incident);

    for (const testCase of testCases) {
      const { data, error } = await supabase
        .from("eval_test_cases")
        .insert({
          tenant_id: incident.tenant_id,
          name: testCase.name,
          description: `Auto-generated from incident ${incident.id}`,
          input: testCase.input,
          expected_output: testCase.expected_output,
          category: testCase.category,
          tags: ["incident_derived", incident.category],
          source_incident_id: incident.id,
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        createdItems.push({
          type: "eval_test_case",
          id: data.id,
          name: testCase.name,
        });
      }
    }

    // Log the action
    await supabase.from("activity_ledger").insert({
      tenant_id: incident.tenant_id,
      actor_type: "system",
      action: "eval_tests_generated_from_incident",
      action_category: "ai",
      resource_type: "incident",
      resource_id: incident.id,
      context: {
        tests_created: createdItems.length,
      },
      success: true,
    });

    return {
      success: true,
      action_type: "generate_eval_tests",
      created_items: createdItems,
    };
  } catch (error) {
    return {
      success: false,
      action_type: "generate_eval_tests",
      created_items: createdItems,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function generateTestCasesForIncident(
  incident: IncidentDetails
): Array<{
  name: string;
  input: string;
  expected_output: string;
  category: string;
}> {
  const testCases: Array<{
    name: string;
    input: string;
    expected_output: string;
    category: string;
  }> = [];

  switch (incident.category) {
    case "safety":
      testCases.push({
        name: `Safety regression test - ${incident.title}`,
        input: `Test input that previously caused safety issue: ${incident.description}`,
        expected_output: "Response should be safe and appropriate",
        category: "safety",
      });
      break;

    case "quality":
      testCases.push({
        name: `Quality regression test - ${incident.title}`,
        input: `Test for quality issue: ${incident.description}`,
        expected_output: "Response should be accurate and high quality",
        category: "quality",
      });
      break;

    case "privacy":
      testCases.push({
        name: `Privacy protection test - ${incident.title}`,
        input: `Test for privacy issue: ${incident.description}`,
        expected_output: "Response should not expose private information",
        category: "privacy",
      });
      break;

    default:
      testCases.push({
        name: `Regression test - ${incident.title}`,
        input: `General test based on: ${incident.description}`,
        expected_output: "Response should avoid the previously identified issue",
        category: incident.category,
      });
  }

  return testCases;
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Guardrail Pattern from Incident
// ─────────────────────────────────────────────────────────────────────────────

export async function addGuardrailPatternFromIncident(
  incident: IncidentDetails,
  pattern: string,
  options?: {
    guardrail_type?: "input" | "output" | "both";
    action?: "block" | "warn" | "log";
  }
): Promise<QuickActionResult> {
  const supabase = await createSupabaseAdmin();
  const createdItems: QuickActionResult["created_items"] = [];

  try {
    const { data, error } = await supabase
      .from("guardrail_patterns")
      .insert({
        tenant_id: incident.tenant_id,
        name: `Pattern from incident ${incident.id.slice(0, 8)}`,
        description: `Auto-generated from incident: ${incident.title}`,
        pattern: pattern,
        pattern_type: "regex",
        guardrail_type: options?.guardrail_type || "output",
        action: options?.action || "block",
        source_incident_id: incident.id,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      createdItems.push({
        type: "guardrail_pattern",
        id: data.id,
        name: data.name,
      });
    }

    await supabase.from("activity_ledger").insert({
      tenant_id: incident.tenant_id,
      actor_type: "system",
      action: "guardrail_pattern_added_from_incident",
      action_category: "ai",
      resource_type: "incident",
      resource_id: incident.id,
      context: {
        pattern: pattern,
        guardrail_id: data?.id,
      },
      success: !error,
    });

    return {
      success: !error,
      action_type: "add_guardrail_pattern",
      created_items: createdItems,
      error: error?.message,
    };
  } catch (error) {
    return {
      success: false,
      action_type: "add_guardrail_pattern",
      created_items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Policy Exception Review from Incident
// ─────────────────────────────────────────────────────────────────────────────

export async function createPolicyExceptionReviewFromIncident(
  incident: IncidentDetails,
  context: RequestContext
): Promise<QuickActionResult> {
  const supabase = await createSupabaseAdmin();
  const createdItems: QuickActionResult["created_items"] = [];

  try {
    // Create a policy exception review item
    const { data, error } = await supabase
      .from("policy_exception_reviews")
      .insert({
        tenant_id: incident.tenant_id,
        source_incident_id: incident.id,
        request_context: context,
        status: "pending",
        priority: incident.severity === "critical" ? "high" : "normal",
        title: `Exception review from incident: ${incident.title}`,
        description: `
This policy exception review was automatically created from incident ${incident.id}.

**Incident Details:**
- Category: ${incident.category}
- Severity: ${incident.severity}
- Description: ${incident.description}
${incident.root_cause ? `- Root Cause: ${incident.root_cause}` : ""}

**Request Context:**
${JSON.stringify(context, null, 2)}

Please review and determine if a policy exception or modification is needed.
        `.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      createdItems.push({
        type: "policy_exception_review",
        id: data.id,
        name: data.title,
      });
    }

    await supabase.from("activity_ledger").insert({
      tenant_id: incident.tenant_id,
      actor_type: "system",
      action: "policy_exception_review_created_from_incident",
      action_category: "admin",
      resource_type: "incident",
      resource_id: incident.id,
      context: {
        review_id: data?.id,
      },
      success: !error,
    });

    return {
      success: !error,
      action_type: "create_policy_exception_review",
      created_items: createdItems,
      error: error?.message,
    };
  } catch (error) {
    return {
      success: false,
      action_type: "create_policy_exception_review",
      created_items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute Quick Action
// ─────────────────────────────────────────────────────────────────────────────

export async function executeQuickAction(
  actionType: IncidentQuickActionType,
  incidentId: string,
  additionalParams?: Record<string, unknown>
): Promise<QuickActionResult> {
  const supabase = await createSupabaseAdmin();

  // Load incident
  const { data: incident, error } = await supabase
    .from("ai_incidents")
    .select("*")
    .eq("id", incidentId)
    .single();

  if (error || !incident) {
    return {
      success: false,
      action_type: actionType,
      created_items: [],
      error: "Incident not found",
    };
  }

  const incidentDetails: IncidentDetails = {
    id: incident.id,
    tenant_id: incident.tenant_id,
    category: incident.category,
    severity: incident.severity,
    title: incident.title,
    description: incident.description,
    root_cause: incident.root_cause,
    related_audit_log_ids: incident.related_audit_log_ids,
    context: incident.context,
  };

  switch (actionType) {
    case "generate_eval_tests":
      return generateEvalTestsFromIncident(incidentDetails);

    case "add_guardrail_pattern":
      const pattern = additionalParams?.pattern as string;
      if (!pattern) {
        return {
          success: false,
          action_type: actionType,
          created_items: [],
          error: "Pattern is required for add_guardrail_pattern action",
        };
      }
      return addGuardrailPatternFromIncident(incidentDetails, pattern, {
        guardrail_type: additionalParams?.guardrail_type as "input" | "output" | "both",
        action: additionalParams?.action as "block" | "warn" | "log",
      });

    case "create_policy_exception_review":
      const context = additionalParams?.context as RequestContext;
      if (!context) {
        return {
          success: false,
          action_type: actionType,
          created_items: [],
          error: "Context is required for create_policy_exception_review action",
        };
      }
      return createPolicyExceptionReviewFromIncident(incidentDetails, context);

    default:
      return {
        success: false,
        action_type: actionType,
        created_items: [],
        error: `Unknown action type: ${actionType}`,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Available Actions for Incident
// ─────────────────────────────────────────────────────────────────────────────

export function getAvailableActionsForIncident(
  incident: IncidentDetails
): Array<{
  action_type: IncidentQuickActionType;
  label: string;
  description: string;
  requires_input: boolean;
}> {
  const actions: Array<{
    action_type: IncidentQuickActionType;
    label: string;
    description: string;
    requires_input: boolean;
  }> = [
    {
      action_type: "generate_eval_tests",
      label: "Generate Eval Tests",
      description: "Create evaluation test cases to prevent regression",
      requires_input: false,
    },
  ];

  // Add guardrail action for safety/content issues
  if (["safety", "content", "quality"].includes(incident.category)) {
    actions.push({
      action_type: "add_guardrail_pattern",
      label: "Add Guardrail Pattern",
      description: "Create a new guardrail pattern to detect similar issues",
      requires_input: true,
    });
  }

  // Add policy exception review for policy-related incidents
  if (["compliance", "security", "privacy"].includes(incident.category)) {
    actions.push({
      action_type: "create_policy_exception_review",
      label: "Create Policy Exception Review",
      description: "Request a review of related policies",
      requires_input: true,
    });
  }

  return actions;
}
