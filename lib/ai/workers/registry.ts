/* ═══════════════════════════════════════════════════════════════════════════
   AI Worker Registry
   Single source of truth for all AI workers in the system.
   Powers the AI Team roster, routing, and feature flags.
   ═══════════════════════════════════════════════════════════════════════════ */

export type WorkerStatus = "active" | "beta" | "planned" | "deprecated";

export type ArtifactType = 
  | "task"
  | "note"
  | "knowledge_doc"
  | "fact"
  | "email_draft"
  | "email_template"
  | "checklist"
  | "decision"
  | "call_prep_brief"
  | "follow_up_draft"
  | "objection_script";

export interface WorkerDefinition {
  /** Unique identifier (used in URLs and feature flags) */
  id: string;
  /** Display name */
  name: string;
  /** Brief description (1-2 sentences) */
  description: string;
  /** Longer description for the detail page */
  longDescription?: string;
  /** Current status */
  status: WorkerStatus;
  /** Feature flag key (for tenant settings) */
  featureFlag: string;
  /** Icon path (SVG d attribute for heroicon-style paths) */
  icon: string;
  /** Gradient colors for the worker card */
  gradient: { from: string; to: string };
  /** Primary artifact types this worker produces */
  outputTypes: ArtifactType[];
  /** Whether this worker supports cheap/fast mode */
  supportsCheapMode: boolean;
  /** Route to the worker UI (relative to /admin/ai/team/) */
  route: string;
  /** Legacy route that should redirect here (if any) */
  legacyRoute?: string;
  /** API endpoints this worker uses */
  apiEndpoints: string[];
  /** Version string */
  version: string;
}

// ════════════════════════════════════════════════════════════════════════════
// WORKER DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

export const AI_WORKERS: WorkerDefinition[] = [
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    description: "AI-powered weekly planning aligned to your goals",
    longDescription: "Reviews your goals, tasks, and notes to propose a focused 7-day plan. Creates outcomes, suggests new tasks, and recommends updates to existing work.",
    status: "active",
    featureFlag: "chief_of_staff",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    gradient: { from: "var(--electric-cyan)", to: "var(--electric-lime)" },
    outputTypes: ["task", "note"],
    supportsCheapMode: false,
    route: "chief-of-staff",
    legacyRoute: "/admin/chief-of-staff",
    apiEndpoints: ["/api/ai/plan/week"],
    version: "1.0.0",
  },
  {
    id: "ops",
    name: "Ops Worker",
    description: "Turn decisions into actionable tasks with AI",
    longDescription: "Analyzes meeting notes, emails, and decisions to extract action items. Creates structured tasks with checklists, priorities, and due dates.",
    status: "active",
    featureFlag: "ops_worker",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    gradient: { from: "var(--electric-lime)", to: "var(--electric-cyan)" },
    outputTypes: ["task", "checklist", "decision"],
    supportsCheapMode: true,
    route: "ops",
    legacyRoute: "/admin/ops",
    apiEndpoints: ["/api/ops/ingest", "/api/ops/propose", "/api/ops/commit"],
    version: "1.0.0",
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Generate briefs and capture knowledge from questions",
    longDescription: "Turn questions into structured research briefs with executive summaries, key points, and next actions. Saves findings to your knowledge base.",
    status: "beta",
    featureFlag: "researcher_worker",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    gradient: { from: "#8B5CF6", to: "var(--electric-cyan)" },
    outputTypes: ["knowledge_doc", "fact", "note", "task"],
    supportsCheapMode: true,
    route: "researcher",
    apiEndpoints: ["/api/ai/research"],
    version: "0.1.0",
  },
  {
    id: "writer",
    name: "Writer",
    description: "Draft content, emails, and marketing copy",
    longDescription: "Generate multiple content variants with headlines, CTAs, and copy. Supports emails, landing pages, social posts, and more.",
    status: "beta",
    featureFlag: "writer_worker",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    gradient: { from: "#F59E0B", to: "#EF4444" },
    outputTypes: ["note", "email_draft", "email_template"],
    supportsCheapMode: true,
    route: "writer",
    apiEndpoints: ["/api/ai/write"],
    version: "0.1.0",
  },
  {
    id: "inbox-triage",
    name: "Inbox Triage",
    description: "Summarize emails and draft replies with follow-up tasks",
    longDescription: "Select email threads to get AI summaries, proposed replies, and automatically extracted follow-up tasks.",
    status: "planned",
    featureFlag: "inbox_triage_worker",
    icon: "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859",
    gradient: { from: "#10B981", to: "#3B82F6" },
    outputTypes: ["email_draft", "task", "checklist"],
    supportsCheapMode: true,
    route: "inbox-triage",
    apiEndpoints: ["/api/ai/inbox/triage"],
    version: "0.0.1",
  },
  {
    id: "analyst",
    name: "Analyst",
    description: "Weekly reviews with metrics, reflections, and decisions",
    longDescription: "Summarize your activity, task completion, and AI spend. Generate decisions for the Ops worker to turn into next actions.",
    status: "planned",
    featureFlag: "analyst_worker",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    gradient: { from: "#EC4899", to: "#8B5CF6" },
    outputTypes: ["note", "decision"],
    supportsCheapMode: true,
    route: "analyst",
    apiEndpoints: ["/api/ai/analyze/weekly"],
    version: "0.0.1",
  },
  {
    id: "sales-desk",
    name: "Sales Desk",
    description: "Prepare for calls, draft follow-ups, and handle objections",
    longDescription: "Input lead or opportunity context and get AI-generated call prep briefs, objection-handling scripts, tailored follow-up email drafts, and suggested next-step tasks.",
    status: "beta",
    featureFlag: "sales_desk_worker",
    icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
    gradient: { from: "#6366F1", to: "#22D3EE" },
    outputTypes: ["call_prep_brief", "follow_up_draft", "objection_script", "task"],
    supportsCheapMode: true,
    route: "sales-desk",
    apiEndpoints: ["/api/ai/jobs"],
    version: "0.1.0",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Get a worker by ID
 */
export function getWorkerById(id: string): WorkerDefinition | undefined {
  return AI_WORKERS.find(w => w.id === id);
}

/**
 * Get all workers by status
 */
export function getWorkersByStatus(status: WorkerStatus): WorkerDefinition[] {
  return AI_WORKERS.filter(w => w.status === status);
}

/**
 * Get workers visible to a user based on their tenant features
 */
export function getVisibleWorkers(features: Record<string, boolean>): WorkerDefinition[] {
  return AI_WORKERS.filter(worker => {
    // Always show active workers if feature not explicitly disabled
    if (worker.status === "active") {
      return features[worker.featureFlag] !== false;
    }
    // Show beta/planned only if explicitly enabled
    return features[worker.featureFlag] === true;
  });
}

/**
 * Check if a worker is enabled for a tenant
 */
export function isWorkerEnabled(workerId: string, features: Record<string, boolean>): boolean {
  const worker = getWorkerById(workerId);
  if (!worker) return false;
  
  if (worker.status === "active") {
    return features[worker.featureFlag] !== false;
  }
  return features[worker.featureFlag] === true;
}

/**
 * Get legacy route mappings for redirects
 */
export function getLegacyRouteMappings(): Map<string, string> {
  const mappings = new Map<string, string>();
  for (const worker of AI_WORKERS) {
    if (worker.legacyRoute) {
      mappings.set(worker.legacyRoute, `/admin/ai/team/${worker.route}`);
    }
  }
  return mappings;
}

/**
 * Status badge styling
 */
export const STATUS_STYLES: Record<WorkerStatus, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-[var(--success)]/10", text: "text-[var(--success)]", label: "Active" },
  beta: { bg: "bg-[var(--warning)]/10", text: "text-[var(--warning)]", label: "Beta" },
  planned: { bg: "bg-[var(--text-muted)]/10", text: "text-[var(--text-muted)]", label: "Planned" },
  deprecated: { bg: "bg-[var(--error)]/10", text: "text-[var(--error)]", label: "Deprecated" },
};
