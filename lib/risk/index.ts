/* ═══════════════════════════════════════════════════════════════════════════
   Risk Aggregation Library
   Export all risk-related functionality
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  evaluateRisk,
  storeRiskEvaluation,
  evaluateAndStoreRisk,
  quickRiskCheck,
} from "./aggregator";

// Re-export types
export type {
  RiskSignal,
  RiskSignalType,
  RiskLevel,
  RiskEvaluation,
  RiskProfile,
  RecommendedAction,
  RiskEvaluateRequest,
  RiskEvaluateResponse,
} from "@/types/policy";
