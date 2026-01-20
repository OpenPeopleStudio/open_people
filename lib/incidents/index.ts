/* ═══════════════════════════════════════════════════════════════════════════
   Incidents Module
   Quick actions for incident-driven improvements
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  // Types
  type IncidentQuickActionType,
  type IncidentDetails,
  type QuickActionResult,
  // Functions
  generateEvalTestsFromIncident,
  addGuardrailPatternFromIncident,
  createPolicyExceptionReviewFromIncident,
  executeQuickAction,
  getAvailableActionsForIncident,
} from "./quick-actions";
