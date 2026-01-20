/* ═══════════════════════════════════════════════════════════════════════════
   Policy Linter
   Detect conflicts, shadowed rules, unreachable conditions, and other issues
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  PolicyWithRelations,
  LintIssue,
  LintResponse,
  LintSeverity,
  LintRuleType,
} from "@/types/policy";
import { loadPolicies } from "./evaluator";

// ─────────────────────────────────────────────────────────────────────────────
// Lint Rule: Conflicting Policies
// Policies with same priority, subjects, and resources but opposite effects
// ─────────────────────────────────────────────────────────────────────────────

function detectConflicts(policies: PolicyWithRelations[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (let i = 0; i < policies.length; i++) {
    for (let j = i + 1; j < policies.length; j++) {
      const p1 = policies[i];
      const p2 = policies[j];

      // Same priority and opposite effects
      if (p1.priority === p2.priority && p1.effect !== p2.effect) {
        // Check for overlapping subjects
        const subjectsOverlap = checkSubjectsOverlap(p1, p2);
        const resourcesOverlap = checkResourcesOverlap(p1, p2);

        if (subjectsOverlap && resourcesOverlap) {
          issues.push({
            rule: "conflict",
            severity: "error",
            message: `Conflicting policies at same priority (${p1.priority}): "${p1.name}" (${p1.effect}) and "${p2.name}" (${p2.effect})`,
            policy_ids: [p1.id, p2.id],
            policy_names: [p1.name, p2.name],
            details: {
              priority: p1.priority,
              p1_effect: p1.effect,
              p2_effect: p2.effect,
            },
            suggestion:
              "Adjust the priority of one policy or make their subjects/resources non-overlapping",
          });
        }
      }
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lint Rule: Shadowed Policies
// Lower priority policies that will never be evaluated
// ─────────────────────────────────────────────────────────────────────────────

function detectShadowed(policies: PolicyWithRelations[]): LintIssue[] {
  const issues: LintIssue[] = [];

  // Sort by priority descending
  const sorted = [...policies].sort((a, b) => b.priority - a.priority);

  for (let i = 0; i < sorted.length; i++) {
    const higherPolicy = sorted[i];

    for (let j = i + 1; j < sorted.length; j++) {
      const lowerPolicy = sorted[j];

      // Skip if same priority
      if (higherPolicy.priority === lowerPolicy.priority) continue;

      // Check if higher policy completely shadows lower
      const subjectsSubsumed = checkSubjectsSubsumed(higherPolicy, lowerPolicy);
      const resourcesSubsumed = checkResourcesSubsumed(higherPolicy, lowerPolicy);
      const conditionsSubsumed = checkConditionsSubsumed(higherPolicy, lowerPolicy);

      if (subjectsSubsumed && resourcesSubsumed && conditionsSubsumed) {
        issues.push({
          rule: "shadowed",
          severity: "warning",
          message: `Policy "${lowerPolicy.name}" (priority ${lowerPolicy.priority}) is shadowed by "${higherPolicy.name}" (priority ${higherPolicy.priority})`,
          policy_ids: [higherPolicy.id, lowerPolicy.id],
          policy_names: [higherPolicy.name, lowerPolicy.name],
          details: {
            shadowing_policy: higherPolicy.name,
            shadowed_policy: lowerPolicy.name,
            priority_diff: higherPolicy.priority - lowerPolicy.priority,
          },
          suggestion:
            "Consider removing the shadowed policy or adjusting its subjects/conditions to not overlap",
        });
      }
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lint Rule: Unreachable Conditions
// Conditions that can never be true given other conditions
// ─────────────────────────────────────────────────────────────────────────────

function detectUnreachable(policies: PolicyWithRelations[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const policy of policies) {
    // Check for contradictory time conditions
    const timeConditions = policy.conditions.filter(
      (c) => c.condition_type === "time"
    );
    if (timeConditions.length > 1) {
      // Check if any time conditions contradict
      for (let i = 0; i < timeConditions.length; i++) {
        for (let j = i + 1; j < timeConditions.length; j++) {
          const c1 = timeConditions[i].condition_config as Record<string, unknown>;
          const c2 = timeConditions[j].condition_config as Record<string, unknown>;

          // Check business_hours contradiction
          if (
            c1.business_hours !== undefined &&
            c2.business_hours !== undefined &&
            c1.business_hours !== c2.business_hours
          ) {
            issues.push({
              rule: "unreachable",
              severity: "error",
              message: `Policy "${policy.name}" has contradictory business hours conditions`,
              policy_ids: [policy.id],
              policy_names: [policy.name],
              details: {
                condition1: c1,
                condition2: c2,
              },
              suggestion: "Remove one of the contradictory time conditions",
            });
          }
        }
      }
    }

    // Check for contradictory location conditions
    const locationConditions = policy.conditions.filter(
      (c) => c.condition_type === "location"
    );
    for (const cond of locationConditions) {
      const config = cond.condition_config as Record<string, unknown>;
      const allowedCountries = config.allowed_countries as string[] | undefined;
      const deniedCountries = config.denied_countries as string[] | undefined;

      if (allowedCountries && deniedCountries) {
        const overlap = allowedCountries.filter((c) => deniedCountries.includes(c));
        if (overlap.length > 0) {
          issues.push({
            rule: "unreachable",
            severity: "error",
            message: `Policy "${policy.name}" has countries in both allowed and denied lists: ${overlap.join(", ")}`,
            policy_ids: [policy.id],
            policy_names: [policy.name],
            details: {
              overlapping_countries: overlap,
            },
            suggestion:
              "Remove overlapping countries from either allowed or denied list",
          });
        }
      }
    }

    // Check for impossible rate limits
    const rateConditions = policy.conditions.filter(
      (c) => c.condition_type === "rate"
    );
    for (const cond of rateConditions) {
      const config = cond.condition_config as Record<string, unknown>;
      if ((config.max_requests as number) === 0 || (config.max_tokens as number) === 0) {
        issues.push({
          rule: "unreachable",
          severity: "warning",
          message: `Policy "${policy.name}" has a rate limit of 0, which blocks all requests`,
          policy_ids: [policy.id],
          policy_names: [policy.name],
          details: config,
          suggestion:
            "Use a deny policy effect instead of a 0 rate limit, or increase the limit",
        });
      }
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lint Rule: Duplicate Priorities
// Multiple policies with same priority (order becomes non-deterministic)
// ─────────────────────────────────────────────────────────────────────────────

function detectDuplicatePriorities(policies: PolicyWithRelations[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const priorityGroups = new Map<number, PolicyWithRelations[]>();

  for (const policy of policies) {
    const existing = priorityGroups.get(policy.priority) || [];
    existing.push(policy);
    priorityGroups.set(policy.priority, existing);
  }

  for (const [priority, group] of priorityGroups) {
    if (group.length > 1) {
      // Check if they have overlapping scope
      let hasOverlap = false;
      for (let i = 0; i < group.length && !hasOverlap; i++) {
        for (let j = i + 1; j < group.length && !hasOverlap; j++) {
          if (
            checkSubjectsOverlap(group[i], group[j]) &&
            checkResourcesOverlap(group[i], group[j])
          ) {
            hasOverlap = true;
          }
        }
      }

      if (hasOverlap) {
        issues.push({
          rule: "duplicate_priority",
          severity: "warning",
          message: `${group.length} policies share priority ${priority} with overlapping scope: ${group.map((p) => p.name).join(", ")}`,
          policy_ids: group.map((p) => p.id),
          policy_names: group.map((p) => p.name),
          details: {
            priority,
            count: group.length,
          },
          suggestion:
            "Assign unique priorities to these policies to ensure deterministic evaluation order",
        });
      }
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lint Rule: Empty Policies
// Policies with no subjects, resources, or conditions
// ─────────────────────────────────────────────────────────────────────────────

function detectEmptyPolicies(policies: PolicyWithRelations[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const policy of policies) {
    // Check for missing subjects (applies to all - might be intentional)
    if (policy.subjects.length === 0) {
      issues.push({
        rule: "missing_subject",
        severity: "info",
        message: `Policy "${policy.name}" has no subjects defined (applies to all users)`,
        policy_ids: [policy.id],
        policy_names: [policy.name],
        suggestion:
          "Verify this policy should apply to all users, or add specific subjects",
      });
    }

    // Check for missing resources (applies to all - might be intentional)
    if (policy.resources.length === 0) {
      issues.push({
        rule: "missing_resource",
        severity: "info",
        message: `Policy "${policy.name}" has no resources defined (applies to all resources)`,
        policy_ids: [policy.id],
        policy_names: [policy.name],
        suggestion:
          "Verify this policy should apply to all resources, or add specific resources",
      });
    }

    // Empty policy (no conditions, effect only)
    if (
      policy.conditions.length === 0 &&
      policy.subjects.length === 0 &&
      policy.resources.length === 0
    ) {
      issues.push({
        rule: "empty_policy",
        severity: "warning",
        message: `Policy "${policy.name}" has no subjects, resources, or conditions - it ${policy.effect}s everything`,
        policy_ids: [policy.id],
        policy_names: [policy.name],
        suggestion:
          policy.effect === "deny"
            ? "This policy denies all AI access - is this intentional?"
            : "Consider adding constraints to make this policy more specific",
      });
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lint Rule: Invalid Conditions
// Conditions with invalid or suspicious configurations
// ─────────────────────────────────────────────────────────────────────────────

function detectInvalidConditions(policies: PolicyWithRelations[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const policy of policies) {
    for (const condition of policy.conditions) {
      const config = condition.condition_config as Record<string, unknown>;

      switch (condition.condition_type) {
        case "time":
          // Check for invalid days
          if (config.days) {
            const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
            const days = config.days as string[];
            const invalidDays = days.filter(
              (d) => !validDays.includes(d.toLowerCase())
            );
            if (invalidDays.length > 0) {
              issues.push({
                rule: "invalid_condition",
                severity: "error",
                message: `Policy "${policy.name}" has invalid days: ${invalidDays.join(", ")}`,
                policy_ids: [policy.id],
                policy_names: [policy.name],
                details: { invalid_days: invalidDays, valid_days: validDays },
                suggestion: `Use valid day abbreviations: ${validDays.join(", ")}`,
              });
            }
          }
          break;

        case "rate":
          // Check for negative limits
          if ((config.max_requests as number) < 0) {
            issues.push({
              rule: "invalid_condition",
              severity: "error",
              message: `Policy "${policy.name}" has negative max_requests`,
              policy_ids: [policy.id],
              policy_names: [policy.name],
              suggestion: "Set max_requests to a positive number or 0",
            });
          }
          if ((config.max_tokens as number) < 0) {
            issues.push({
              rule: "invalid_condition",
              severity: "error",
              message: `Policy "${policy.name}" has negative max_tokens`,
              policy_ids: [policy.id],
              policy_names: [policy.name],
              suggestion: "Set max_tokens to a positive number or 0",
            });
          }
          break;

        case "risk":
          // Check for invalid risk score range
          if (config.max_risk_score !== undefined) {
            const score = config.max_risk_score as number;
            if (score < 0 || score > 100) {
              issues.push({
                rule: "invalid_condition",
                severity: "error",
                message: `Policy "${policy.name}" has invalid max_risk_score: ${score}`,
                policy_ids: [policy.id],
                policy_names: [policy.name],
                details: { score },
                suggestion: "Risk score must be between 0 and 100",
              });
            }
          }
          break;
      }
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function checkSubjectsOverlap(
  p1: PolicyWithRelations,
  p2: PolicyWithRelations
): boolean {
  // If either has no subjects, they apply to all and overlap
  if (p1.subjects.length === 0 || p2.subjects.length === 0) return true;

  // Check for "all" subject type
  if (p1.subjects.some((s) => s.subject_type === "all" && s.include)) return true;
  if (p2.subjects.some((s) => s.subject_type === "all" && s.include)) return true;

  // Check for actual overlap in include rules
  for (const s1 of p1.subjects.filter((s) => s.include)) {
    for (const s2 of p2.subjects.filter((s) => s.include)) {
      if (
        s1.subject_type === s2.subject_type &&
        s1.subject_value === s2.subject_value
      ) {
        return true;
      }
    }
  }

  return false;
}

function checkResourcesOverlap(
  p1: PolicyWithRelations,
  p2: PolicyWithRelations
): boolean {
  if (p1.resources.length === 0 || p2.resources.length === 0) return true;
  if (p1.resources.some((r) => r.resource_type === "all" && r.include)) return true;
  if (p2.resources.some((r) => r.resource_type === "all" && r.include)) return true;

  for (const r1 of p1.resources.filter((r) => r.include)) {
    for (const r2 of p2.resources.filter((r) => r.include)) {
      if (r1.resource_type === r2.resource_type) {
        if (!r1.resource_values || !r2.resource_values) return true;
        const overlap = r1.resource_values.filter((v) =>
          r2.resource_values!.includes(v)
        );
        if (overlap.length > 0) return true;
      }
    }
  }

  return false;
}

function checkSubjectsSubsumed(
  broader: PolicyWithRelations,
  narrower: PolicyWithRelations
): boolean {
  // If broader has no subjects (applies to all), it subsumes everything
  if (broader.subjects.length === 0) return true;
  if (broader.subjects.some((s) => s.subject_type === "all" && s.include)) return true;

  // For now, simple check - could be more sophisticated
  return checkSubjectsOverlap(broader, narrower);
}

function checkResourcesSubsumed(
  broader: PolicyWithRelations,
  narrower: PolicyWithRelations
): boolean {
  if (broader.resources.length === 0) return true;
  if (broader.resources.some((r) => r.resource_type === "all" && r.include)) return true;

  return checkResourcesOverlap(broader, narrower);
}

function checkConditionsSubsumed(
  broader: PolicyWithRelations,
  narrower: PolicyWithRelations
): boolean {
  // If broader has no conditions, it always triggers
  if (broader.conditions.length === 0) return true;

  // If narrower has all of broader's conditions, broader subsumes narrower
  // This is a simplification - proper subset checking would be more complex
  return broader.conditions.length <= narrower.conditions.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Lint Function
// ─────────────────────────────────────────────────────────────────────────────

export async function lintPolicies(
  tenantId: string,
  options?: {
    policyIds?: string[];
    includeInactive?: boolean;
  }
): Promise<LintResponse> {
  // Load policies
  const policies = await loadPolicies(tenantId, {
    policyIds: options?.policyIds,
    includeInactive: options?.includeInactive,
  });

  // Run all lint rules
  const allIssues: LintIssue[] = [
    ...detectConflicts(policies),
    ...detectShadowed(policies),
    ...detectUnreachable(policies),
    ...detectDuplicatePriorities(policies),
    ...detectEmptyPolicies(policies),
    ...detectInvalidConditions(policies),
  ];

  // Count by severity
  const errors = allIssues.filter((i) => i.severity === "error").length;
  const warnings = allIssues.filter((i) => i.severity === "warning").length;
  const info = allIssues.filter((i) => i.severity === "info").length;

  return {
    issues: allIssues,
    summary: {
      errors,
      warnings,
      info,
      policies_analyzed: policies.length,
    },
    passed: errors === 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lint Single Policy (for editor validation)
// ─────────────────────────────────────────────────────────────────────────────

export async function lintSinglePolicy(
  tenantId: string,
  policy: PolicyWithRelations
): Promise<LintIssue[]> {
  // Load other active policies to check against
  const otherPolicies = await loadPolicies(tenantId);

  // Filter out the policy being edited (if it already exists)
  const existingPolicies = otherPolicies.filter((p) => p.id !== policy.id);

  // Create combined list for comparison
  const allPolicies = [...existingPolicies, policy];

  // Run lint rules focused on the single policy
  const issues: LintIssue[] = [];

  // Check conflicts with existing policies
  for (const existing of existingPolicies) {
    if (existing.priority === policy.priority && existing.effect !== policy.effect) {
      if (
        checkSubjectsOverlap(existing, policy) &&
        checkResourcesOverlap(existing, policy)
      ) {
        issues.push({
          rule: "conflict",
          severity: "error",
          message: `Conflicts with existing policy "${existing.name}" at same priority`,
          policy_ids: [existing.id, policy.id],
          policy_names: [existing.name, policy.name],
          suggestion: "Change priority or adjust scope",
        });
      }
    }
  }

  // Check if this policy shadows or is shadowed
  const shadowIssues = detectShadowed([...existingPolicies, policy]).filter(
    (i) => i.policy_ids.includes(policy.id)
  );
  issues.push(...shadowIssues);

  // Check internal issues (unreachable, invalid)
  const internalIssues = [
    ...detectUnreachable([policy]),
    ...detectInvalidConditions([policy]),
    ...detectEmptyPolicies([policy]),
  ];
  issues.push(...internalIssues);

  return issues;
}
