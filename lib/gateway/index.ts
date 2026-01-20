/* ═══════════════════════════════════════════════════════════════════════════
   API Gateway Module
   Unified gateway for AI requests with policy-aware routing
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  // Router functions
  evaluateGatewayRequest,
  quickGatewayEvaluate,
  loadGatewayProviders,
  loadBudgetContext,
  getProviderConfig,
  selectBestProvider,
  // Types
  type GatewayProviderConfig,
} from "./router";
