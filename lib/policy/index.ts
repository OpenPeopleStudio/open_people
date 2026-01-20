/* ═══════════════════════════════════════════════════════════════════════════
   Policy Engine Library
   Export all policy-related functionality
   ═══════════════════════════════════════════════════════════════════════════ */

// Core evaluator
export {
  loadPolicies,
  evaluatePolicies,
  quickEvaluate,
} from "./evaluator";

// Linting
export {
  lintPolicies,
  lintSinglePolicy,
} from "./lint";

// Impact preview
export {
  previewPolicyChanges,
  previewSinglePolicyChange,
  exportFlippedRequestIds,
} from "./preview";

// Re-export types
export type {
  Policy,
  PolicyWithRelations,
  PolicySubject,
  PolicyResource,
  PolicyCondition,
  PolicyAction,
  PolicyEffect,
  PolicyType,
  SubjectType,
  ResourceType,
  ConditionType,
  ActionType,
  RequestContext,
  PolicyDecision,
  PolicyEvaluation,
  ConditionEvaluation,
  EvaluationTrace,
  TestBenchRequest,
  TestBenchResponse,
  ImpactPreviewRequest,
  ImpactPreviewResponse,
  FlippedDecision,
  PolicyChange,
  LintIssue,
  LintRequest,
  LintResponse,
  LintSeverity,
  LintRuleType,
} from "@/types/policy";
