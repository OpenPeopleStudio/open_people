/* ═══════════════════════════════════════════════════════════════════════════
   Demo Module
   Scenario packs and demo data seeding
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  // Types
  type ScenarioPackId,
  type GuardrailConfig,
  type EvalTestCase,
  type DashboardPreset,
  type ConversationSeed,
  type ScenarioPack,
  // Packs
  SUPPORT_DESK_PACK,
  HEALTHCARE_ASSISTANT_PACK,
  INTERNAL_KB_BOT_PACK,
  SCENARIO_PACKS,
  // Functions
  applyScenarioPack,
  listScenarioPacks,
} from "./scenario-packs";
