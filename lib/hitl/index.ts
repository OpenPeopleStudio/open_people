/* ═══════════════════════════════════════════════════════════════════════════
   HITL (Human-in-the-Loop) Library
   Export all HITL-related functionality
   ═══════════════════════════════════════════════════════════════════════════ */

// Escalation
export {
  escalateToHITL,
  forceEscalate,
  type TriggerType,
  type TriggerConfig,
  type HITLPolicy,
  type EscalationRequest,
  type EscalationResult,
} from "./escalation";

// QA Sampling
export {
  selectDecisionsForQA,
  calculateDisagreementMetrics,
  getQAQueue,
  submitQAReview,
  type SamplingStrategy,
  type SamplingConfig,
  type QAQueueItem,
  type DisagreementMetrics,
} from "./qa-sampling";
