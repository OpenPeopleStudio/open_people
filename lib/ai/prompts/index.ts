/* ═══════════════════════════════════════════════════════════════════════════
   AI Prompts Module Index

   Each worker module has its own prompt builders and type definitions.
   Import directly from the specific module for full access:

   - Chief of Staff: import from "@/lib/ai/prompts/chiefOfStaff"
   - Ops Worker: import from "@/lib/ai/prompts/opsWorker"
   - Researcher: import from "@/lib/ai/prompts/researcher"
   - Writer: import from "@/lib/ai/prompts/writer"
   - Inbox Triage: import from "@/lib/ai/prompts/inboxTriage"
   - Analyst: import from "@/lib/ai/prompts/analyst"
   - Sales Desk: import from "@/lib/ai/prompts/salesDesk"
   ═══════════════════════════════════════════════════════════════════════════ */

// Export key types from Chief of Staff
export type {
  WeekPlanRequest,
  WeekPlanResponse,
  PlanProposal,
} from "./chiefOfStaff";

// Export key types from Ops Worker
export type {
  Decision,
  DecisionSource,
  OpsProposal,
  OpsProposeRequest,
  OpsProposeResponse,
} from "./opsWorker";

// Export key types from Sales Desk
export type {
  SalesPrepRequest,
  SalesPrepResponse,
} from "./salesDesk";
