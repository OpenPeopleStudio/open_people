/**
 * Ops Worker Service
 *
 * Shared logic for fetching context, checking budgets, deduplication,
 * and mapping proposals to task creates/updates.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { TaskStatus, TaskPriority, Task, Project } from "@/types/workflows";
import type { AIUserGoal } from "@/types/ai-profile";
import type {
  Decision,
  OpsProposal,
  ProposedActionItem,
  OpsRunLog,
  DecisionSource,
} from "@/lib/ai/prompts/opsWorker";
import { OPS_WORKER_TAG, SOURCE_TAGS, type DecisionSourceType } from "@/lib/ai/prompts/opsWorker";

// ════════════════════════════════════════════════════════════════════════════
// CONTEXT FETCHING
// ════════════════════════════════════════════════════════════════════════════

export interface OpsContext {
  goals: Array<{
    id: string;
    title: string;
    category?: string | null;
    status: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  existingTasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
    project_name?: string | null;
    tags?: string[];
  }>;
  profile?: {
    preferred_name?: string | null;
    current_focus?: string | null;
    important_context?: string | null;
  };
}

/**
 * Fetch all context needed for the Ops Worker
 */
export async function fetchOpsContext(supabase: SupabaseClient, userId: string): Promise<OpsContext> {
  const [goalsResult, projectsResult, tasksResult, profileResult] = await Promise.all([
    supabase
      .from("ai_user_goals")
      .select("id, title, category, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(20),
    supabase.from("projects").select("id, name, status").eq("owner_id", userId).eq("status", "active").limit(20),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, tags, project:projects(name)")
      .eq("owner_id", userId)
      .not("status", "in", '("done","cancelled")')
      .limit(50),
    supabase
      .from("ai_user_profiles")
      .select("preferred_name, current_focus, important_context")
      .eq("user_id", userId)
      .single(),
  ]);

  return {
    goals: goalsResult.data || [],
    projects: projectsResult.data || [],
    existingTasks: (tasksResult.data || []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status as TaskStatus,
      priority: t.priority as TaskPriority,
      due_date: t.due_date,
      project_name: (Array.isArray(t.project) ? t.project[0]?.name : (t.project as { name: string } | null)?.name),
      tags: t.tags,
    })),
    profile: profileResult.data || undefined,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// BUDGET MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

export interface BudgetStatus {
  hasLimit: boolean;
  budgetCents: number;
  usedCents: number;
  remainingCents: number;
  canProceed: boolean;
  warning?: string;
  onExceed: "warn" | "block" | "downgrade_model";
}

/**
 * Check current budget status for AI operations
 */
export async function checkBudget(supabase: SupabaseClient, userId: string): Promise<BudgetStatus> {
  const { data: budget } = await supabase.from("ai_cost_budgets").select("*").eq("owner_id", userId).single();

  if (!budget) {
    return {
      hasLimit: false,
      budgetCents: 0,
      usedCents: 0,
      remainingCents: Infinity,
      canProceed: true,
      onExceed: "warn",
    };
  }

  const budgetCents = budget.budget_cents || 0;
  const usedCents = budget.current_usage_cents || 0;
  const remainingCents = budgetCents - usedCents;
  const onExceed = budget.on_exceed || "warn";

  let warning: string | undefined;
  let canProceed = true;

  if (remainingCents <= 0) {
    if (onExceed === "block") {
      canProceed = false;
      warning = "Budget exceeded. Operations blocked.";
    } else {
      warning = "Budget exceeded.";
    }
  } else if (remainingCents < 50) {
    warning = `Low budget: $${(remainingCents / 100).toFixed(2)} remaining`;
  }

  return {
    hasLimit: true,
    budgetCents,
    usedCents,
    remainingCents,
    canProceed,
    onExceed,
    ...(warning ? { warning } : {}),
  };
}

/**
 * Record cost usage after an operation
 */
export async function recordCostUsage(
  supabase: SupabaseClient,
  userId: string,
  costCents: number
): Promise<void> {
  const { data: budget } = await supabase.from("ai_cost_budgets").select("id, current_usage_cents").eq("owner_id", userId).single();

  if (budget) {
    await supabase
      .from("ai_cost_budgets")
      .update({
        current_usage_cents: (budget.current_usage_cents || 0) + costCents,
      })
      .eq("id", budget.id);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DEDUPLICATION
// ════════════════════════════════════════════════════════════════════════════

export interface DuplicateCheck {
  proposalId: string;
  proposalTitle: string;
  potentialDuplicate?: {
    taskId: string;
    taskTitle: string;
    similarity: number;
  };
}

/**
 * Check proposed tasks for potential duplicates against existing tasks
 */
export function checkForDuplicates(
  proposedTasks: ProposedActionItem[],
  existingTasks: OpsContext["existingTasks"]
): DuplicateCheck[] {
  const results: DuplicateCheck[] = [];

  for (const proposed of proposedTasks) {
    const proposedWords = normalizeTitle(proposed.title);
    let bestMatch: DuplicateCheck["potentialDuplicate"];
    let bestSimilarity = 0;

    for (const existing of existingTasks) {
      const existingWords = normalizeTitle(existing.title);
      const similarity = calculateSimilarity(proposedWords, existingWords);

      if (similarity > 0.7 && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = {
          taskId: existing.id,
          taskTitle: existing.title,
          similarity,
        };
      }
    }

    const entry: DuplicateCheck = {
      proposalId: proposed.id,
      proposalTitle: proposed.title,
    };

    if (bestMatch) {
      entry.potentialDuplicate = bestMatch;
    }

    results.push(entry);
  }

  return results;
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

/**
 * Calculate Jaccard similarity between word sets
 */
function calculateSimilarity(words1: string[], words2: string[]): number {
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

// ════════════════════════════════════════════════════════════════════════════
// TASK MAPPING
// ════════════════════════════════════════════════════════════════════════════

export interface TaskCreatePayload {
  owner_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  project_id?: string;
  tags: string[];
  checklist: Array<{ id: string; title: string; done: boolean }>;
  estimated_minutes?: number;
  position: number;
  metadata: Record<string, unknown>;
}

/**
 * Map a proposed action item to a task create payload
 */
export function mapProposalToTaskCreate(
  proposal: ProposedActionItem,
  userId: string,
  decision: Decision,
  position: number = 0
): TaskCreatePayload {
  const sourceType = (decision.source as { type?: string })?.type as DecisionSourceType | undefined;
  const sourceTag = sourceType ? SOURCE_TAGS[sourceType] : undefined;

  // Build tags
  const tags = [...(proposal.tags || []), OPS_WORKER_TAG];
  if (sourceTag) {
    tags.push(sourceTag);
  }

  // Build checklist
  const checklist = (proposal.checklist || []).map((item, i) => ({
    id: `check-${i}`,
    title: item.title,
    done: false,
  }));

  return {
    owner_id: userId,
    title: proposal.title,
    priority: proposal.priority,
    tags,
    checklist,
    position,
    metadata: {
      ops_worker: true,
      source_decision_id: decision.id,
      rationale: proposal.rationale,
      aligned_goal_ids: proposal.aligned_goal_ids,
      source_excerpt: proposal.source_excerpt,
      confidence: proposal.confidence,
    },
    ...(proposal.description !== undefined ? { description: proposal.description } : {}),
    ...(proposal.due_date ? { due_date: proposal.due_date } : {}),
    ...(proposal.project_id ? { project_id: proposal.project_id } : {}),
    ...(proposal.estimated_minutes !== undefined
      ? { estimated_minutes: proposal.estimated_minutes }
      : {}),
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MODEL SELECTION
// ════════════════════════════════════════════════════════════════════════════

export interface ModelSelection {
  model: string;
  reason: string;
}

/**
 * Select the appropriate model based on budget and user preference
 */
export function selectModel(
  budgetStatus: BudgetStatus,
  cheapMode: boolean,
  userPreferredModel?: string
): ModelSelection {
  const DEFAULT_MODEL = "gpt-4o";
  const CHEAP_MODEL = "gpt-4o-mini";

  // If user explicitly requested cheap mode
  if (cheapMode) {
    return { model: CHEAP_MODEL, reason: "Cheap mode enabled" };
  }

  // If budget is low and set to downgrade
  if (budgetStatus.remainingCents < 20 && budgetStatus.onExceed === "downgrade_model") {
    return { model: CHEAP_MODEL, reason: "Low budget - using cheaper model" };
  }

  // If user has a preferred model
  if (userPreferredModel) {
    return { model: userPreferredModel, reason: "User preference" };
  }

  // Default
  return { model: DEFAULT_MODEL, reason: "Default model" };
}

// ════════════════════════════════════════════════════════════════════════════
// DECISION HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Create a decision from an email
 */
export function createDecisionFromEmail(
  emailId: string,
  subject: string,
  body: string,
  from: string
): { raw_text: string; source: DecisionSource } {
  const raw_text = `Email from: ${from}
Subject: ${subject}

${body}`;

  return {
    raw_text,
    source: {
      type: "email",
      reference_id: emailId,
      label: subject,
    },
  };
}

/**
 * Create a decision from meeting notes
 */
export function createDecisionFromMeeting(
  noteId: string,
  title: string,
  content: string
): { raw_text: string; source: DecisionSource } {
  return {
    raw_text: `Meeting: ${title}

${content}`,
    source: {
      type: "meeting_notes",
      reference_id: noteId,
      label: title,
    },
  };
}

/**
 * Create a decision from a note
 */
export function createDecisionFromNote(
  noteId: string,
  title: string,
  content: string
): { raw_text: string; source: DecisionSource } {
  return {
    raw_text: `Note: ${title}

${content}`,
    source: {
      type: "note",
      reference_id: noteId,
      label: title,
    },
  };
}

/**
 * Create a manual decision
 */
export function createManualDecision(text: string, label?: string): { raw_text: string; source: DecisionSource } {
  return {
    raw_text: text,
    source: {
      type: "manual",
      label: label || "Manual entry",
    },
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STATS & METRICS
// ════════════════════════════════════════════════════════════════════════════

export interface OpsStats {
  totalDecisions: number;
  decisionsByStatus: Record<string, number>;
  totalTasksCreated: number;
  totalTasksUpdated: number;
  totalRuns: number;
  totalCostCents: number;
  avgConfidence: number;
}

/**
 * Get ops worker statistics for a user
 */
export async function getOpsStats(supabase: SupabaseClient, userId: string): Promise<OpsStats> {
  const [decisionsResult, runsResult] = await Promise.all([
    supabase.from("decisions").select("status, created_task_ids").eq("owner_id", userId),
    supabase.from("ops_runs").select("status, cost_cents, created_task_ids, updated_task_ids, proposal").eq("owner_id", userId),
  ]);

  const decisions = decisionsResult.data || [];
  const runs = runsResult.data || [];

  const decisionsByStatus: Record<string, number> = {};
  for (const d of decisions) {
    decisionsByStatus[d.status] = (decisionsByStatus[d.status] || 0) + 1;
  }

  let totalTasksCreated = 0;
  let totalTasksUpdated = 0;
  let totalCostCents = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const r of runs) {
    totalTasksCreated += (r.created_task_ids || []).length;
    totalTasksUpdated += (r.updated_task_ids || []).length;
    totalCostCents += r.cost_cents || 0;

    // Calculate average confidence from proposals
    const proposal = r.proposal as OpsProposal | null;
    if (proposal?.tasks_to_create) {
      for (const t of proposal.tasks_to_create) {
        totalConfidence += t.confidence || 0;
        confidenceCount++;
      }
    }
  }

  return {
    totalDecisions: decisions.length,
    decisionsByStatus,
    totalTasksCreated,
    totalTasksUpdated,
    totalRuns: runs.length,
    totalCostCents,
    avgConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
  };
}
