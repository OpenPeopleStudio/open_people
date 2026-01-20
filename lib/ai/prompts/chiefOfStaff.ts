/**
 * Chief of Staff AI Prompt & Schema
 * 
 * Defines the structured JSON contract for weekly plan proposals.
 * The AI generates a rolling 7-day plan aligned with user goals.
 */

import type { TaskPriority, TaskStatus } from "@/types/workflows";
import type { GoalCategory } from "@/types/ai-profile";

// ════════════════════════════════════════════════════════════════════════════
// PLAN PROPOSAL SCHEMA
// ════════════════════════════════════════════════════════════════════════════

/**
 * A proposed outcome/commitment for the week
 */
export interface ProposedOutcome {
  /** Brief description of the outcome */
  description: string;
  /** Which goal(s) this advances (by ID) */
  aligned_goal_ids: string[];
  /** Priority ranking (1 = highest) */
  priority: number;
  /** Why this matters this week */
  rationale: string;
}

/**
 * A new task the AI proposes to create
 */
export interface ProposedTaskCreate {
  /** Task title */
  title: string;
  /** Optional description */
  description?: string;
  /** Priority level */
  priority: TaskPriority;
  /** Suggested due date (ISO string, within 7 days) */
  due_date?: string;
  /** Optional project to assign to (by ID) */
  project_id?: string;
  /** Tags to apply */
  tags?: string[];
  /** Estimated minutes to complete */
  estimated_minutes?: number;
  /** Why this task is being proposed */
  rationale: string;
  /** Which goal(s) this advances (by ID) */
  aligned_goal_ids?: string[];
}

/**
 * An existing task the AI proposes to update
 */
export interface ProposedTaskUpdate {
  /** The task ID to update */
  task_id: string;
  /** Current task title (for display) */
  current_title: string;
  /** New status (optional) */
  new_status?: TaskStatus;
  /** New priority (optional) */
  new_priority?: TaskPriority;
  /** New due date (optional, ISO string) */
  new_due_date?: string;
  /** Why this change is being proposed */
  rationale: string;
}

/**
 * A clarifying question the AI needs answered
 */
export interface ClarifyingQuestion {
  /** Question ID for tracking */
  id: string;
  /** The question text */
  question: string;
  /** Context about why this is being asked */
  context?: string;
  /** Optional suggested answers */
  suggestions?: string[];
}

/**
 * The complete plan proposal returned by the AI
 */
export interface PlanProposal {
  /** Week start date (ISO string, typically today) */
  week_start: string;
  /** Week end date (ISO string, 7 days from start) */
  week_end: string;
  
  /** High-level outcomes/commitments for the week */
  outcomes: ProposedOutcome[];
  
  /** New tasks to create */
  tasks_to_create: ProposedTaskCreate[];
  
  /** Existing tasks to update (status/priority/due date) */
  tasks_to_update: ProposedTaskUpdate[];
  
  /** Questions the AI needs answered before finalizing */
  questions: ClarifyingQuestion[];
  
  /** AI's reasoning and summary */
  reasoning: string;
  
  /** Optional focus areas identified */
  focus_areas?: string[];
  
  /** Any concerns or blockers identified */
  concerns?: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * User input for generating a weekly plan
 */
export interface WeekPlanRequest {
  /** Start date for the plan (defaults to today) */
  start_date?: string;
  /** Available hours for the week */
  available_hours?: number;
  /** Things that must happen (non-negotiable) */
  non_negotiables?: string[];
  /** Specific goals to focus on (by ID) */
  focus_goal_ids?: string[];
  /** Specific projects to focus on (by ID) */
  focus_project_ids?: string[];
  /** Additional context or notes */
  additional_context?: string;
}

/**
 * Response from the plan generation endpoint
 */
export interface WeekPlanResponse {
  /** The generated proposal */
  proposal: PlanProposal;
  /** Context that was used to generate the plan */
  context_used: {
    goals_count: number;
    active_tasks_count: number;
    notes_count: number;
  };
  /** Token usage info */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  /** Estimated cost in cents */
  estimated_cost_cents?: number;
  /** Processing time in ms */
  duration_ms: number;
}

// ════════════════════════════════════════════════════════════════════════════
// SAVED PLAN TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * A finalized week plan (stored as note metadata)
 */
export interface SavedWeekPlan {
  /** Week start date */
  week_start: string;
  /** Week end date */
  week_end: string;
  /** Committed outcomes */
  outcomes: ProposedOutcome[];
  /** Task IDs created from this plan */
  created_task_ids: string[];
  /** Task IDs updated from this plan */
  updated_task_ids: string[];
  /** When the plan was finalized */
  finalized_at: string;
  /** Original proposal for reference */
  original_proposal?: PlanProposal;
}

// ════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Build the system prompt for the Chief of Staff AI
 */
export function buildChiefOfStaffSystemPrompt(
  userName?: string | null,
  userContext?: string | null
): string {
  const greeting = userName ? `You are the Chief of Staff for ${userName}. ` : "You are an AI Chief of Staff. ";
  
  return `${greeting}Your role is to help plan the next 7 days by analyzing goals, active tasks, and context to propose a focused, achievable plan.

## Your Responsibilities

1. **Outcome Planning**: Identify 2-4 high-impact outcomes for the week that advance the user's goals
2. **Task Triage**: Review existing tasks and propose status/priority/due date changes
3. **Task Creation**: Propose new tasks that fill gaps or break down outcomes into actions
4. **Alignment Check**: Ensure all proposals connect to stated goals and values

## Constraints

- Only propose tasks with due dates within the 7-day window
- Never auto-apply changes - all proposals require human approval
- Limit new task proposals to what's realistically achievable
- Prioritize ruthlessly - fewer well-chosen items over many scattered ones
- If available hours are provided, respect them when estimating workload

## Response Format

You MUST respond with valid JSON matching the PlanProposal schema. Include:
- outcomes: 2-4 high-level commitments for the week
- tasks_to_create: New tasks to add (with rationale)
- tasks_to_update: Changes to existing tasks (with rationale)
- questions: Any clarifications needed
- reasoning: Your overall thinking process
- concerns: Any blockers or risks identified

## Guidelines

- Be specific and actionable, not vague
- Connect every proposal to a goal when possible
- If unsure, ask a clarifying question rather than guess
- Consider dependencies between tasks
- Leave room for unexpected work (don't overcommit)
${userContext ? `\n## Additional User Context\n${userContext}` : ""}`;
}

/**
 * Build the user message with all context for plan generation
 */
export function buildChiefOfStaffUserMessage(params: {
  startDate: string;
  endDate: string;
  goals: Array<{
    id: string;
    title: string;
    description?: string | null;
    why_important?: string | null;
    category?: GoalCategory | null;
    status: string;
    progress: number;
  }>;
  activeTasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
    project_id?: string | null;
    project_name?: string | null;
    tags?: string[];
    estimated_minutes?: number | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  recentNotes?: Array<{
    title: string;
    excerpt?: string | null;
  }>;
  request: WeekPlanRequest;
}): string {
  const { startDate, endDate, goals, activeTasks, projects, recentNotes, request } = params;
  
  const sections: string[] = [];
  
  // Time frame
  sections.push(`## Planning Window\n- Start: ${startDate}\n- End: ${endDate}`);
  
  // User inputs
  if (request.available_hours) {
    sections.push(`## Available Hours\n${request.available_hours} hours this week`);
  }
  
  if (request.non_negotiables?.length) {
    sections.push(`## Non-Negotiables (Must Happen)\n${request.non_negotiables.map(n => `- ${n}`).join("\n")}`);
  }
  
  if (request.additional_context) {
    sections.push(`## Additional Context\n${request.additional_context}`);
  }
  
  // Goals
  if (goals.length > 0) {
    const focusGoals = request.focus_goal_ids?.length 
      ? goals.filter(g => request.focus_goal_ids!.includes(g.id))
      : goals;
    
    const goalsText = focusGoals.map(g => {
      const parts = [`- **${g.title}** (ID: ${g.id}, ${g.progress}% complete)`];
      if (g.why_important) parts.push(`  - Why: ${g.why_important}`);
      if (g.category) parts.push(`  - Category: ${g.category}`);
      return parts.join("\n");
    }).join("\n");
    
    sections.push(`## Active Goals${request.focus_goal_ids?.length ? " (Focused)" : ""}\n${goalsText}`);
  } else {
    sections.push(`## Active Goals\nNo active goals defined yet.`);
  }
  
  // Projects
  if (projects.length > 0) {
    const focusProjects = request.focus_project_ids?.length
      ? projects.filter(p => request.focus_project_ids!.includes(p.id))
      : projects;
    
    const projectsText = focusProjects.map(p => `- ${p.name} (ID: ${p.id}, ${p.status})`).join("\n");
    sections.push(`## Active Projects${request.focus_project_ids?.length ? " (Focused)" : ""}\n${projectsText}`);
  }
  
  // Active tasks
  if (activeTasks.length > 0) {
    const tasksText = activeTasks.map(t => {
      const parts = [`- **${t.title}** (ID: ${t.id})`];
      parts.push(`  - Status: ${t.status}, Priority: ${t.priority}`);
      if (t.due_date) parts.push(`  - Due: ${t.due_date}`);
      if (t.project_name) parts.push(`  - Project: ${t.project_name}`);
      if (t.estimated_minutes) parts.push(`  - Est: ${t.estimated_minutes} min`);
      return parts.join("\n");
    }).join("\n");
    
    sections.push(`## Current Tasks (Not Done)\n${tasksText}`);
  } else {
    sections.push(`## Current Tasks\nNo active tasks.`);
  }
  
  // Recent notes (limited context)
  if (recentNotes?.length) {
    const notesText = recentNotes.slice(0, 5).map(n => `- ${n.title}${n.excerpt ? `: ${n.excerpt.slice(0, 100)}...` : ""}`).join("\n");
    sections.push(`## Recent Notes (for context)\n${notesText}`);
  }
  
  // Final instruction
  sections.push(`## Your Task\nAnalyze the above and generate a PlanProposal JSON for the week of ${startDate} to ${endDate}. Focus on what will have the highest impact toward the user's goals.`);
  
  return sections.join("\n\n");
}

// ════════════════════════════════════════════════════════════════════════════
// JSON SCHEMA FOR VALIDATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * JSON Schema for PlanProposal (for use with OpenAI function calling or validation)
 */
export const PLAN_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  required: ["week_start", "week_end", "outcomes", "tasks_to_create", "tasks_to_update", "questions", "reasoning"],
  properties: {
    week_start: { type: "string", description: "ISO date string for week start" },
    week_end: { type: "string", description: "ISO date string for week end" },
    outcomes: {
      type: "array",
      items: {
        type: "object",
        required: ["description", "aligned_goal_ids", "priority", "rationale"],
        properties: {
          description: { type: "string" },
          aligned_goal_ids: { type: "array", items: { type: "string" } },
          priority: { type: "number" },
          rationale: { type: "string" },
        },
      },
    },
    tasks_to_create: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "priority", "rationale"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["urgent", "high", "normal", "low"] },
          due_date: { type: "string" },
          project_id: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          estimated_minutes: { type: "number" },
          rationale: { type: "string" },
          aligned_goal_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
    tasks_to_update: {
      type: "array",
      items: {
        type: "object",
        required: ["task_id", "current_title", "rationale"],
        properties: {
          task_id: { type: "string" },
          current_title: { type: "string" },
          new_status: { type: "string", enum: ["todo", "in_progress", "blocked", "done", "cancelled"] },
          new_priority: { type: "string", enum: ["urgent", "high", "normal", "low"] },
          new_due_date: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "question"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          context: { type: "string" },
          suggestions: { type: "array", items: { type: "string" } },
        },
      },
    },
    reasoning: { type: "string" },
    focus_areas: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
  },
} as const;

/**
 * Parse and validate the AI response into a PlanProposal
 * Returns null if parsing fails
 */
export function parsePlanProposal(content: string): PlanProposal | null {
  try {
    // Try to extract JSON from the response (in case it's wrapped in markdown code blocks)
    let jsonStr = content;
    
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Basic validation
    if (!parsed.week_start || !parsed.week_end || !Array.isArray(parsed.outcomes)) {
      console.error("Plan proposal missing required fields");
      return null;
    }
    
    // Ensure arrays exist
    return {
      week_start: parsed.week_start,
      week_end: parsed.week_end,
      outcomes: parsed.outcomes || [],
      tasks_to_create: parsed.tasks_to_create || [],
      tasks_to_update: parsed.tasks_to_update || [],
      questions: parsed.questions || [],
      reasoning: parsed.reasoning || "",
      focus_areas: parsed.focus_areas,
      concerns: parsed.concerns,
    };
  } catch (error) {
    console.error("Failed to parse plan proposal:", error);
    return null;
  }
}

/**
 * Generate markdown content from a finalized plan (for saving as a note)
 */
export function generatePlanMarkdown(plan: SavedWeekPlan): string {
  const lines: string[] = [];
  
  lines.push(`# Week Plan: ${plan.week_start.split("T")[0]} to ${plan.week_end.split("T")[0]}`);
  lines.push("");
  lines.push(`*Finalized: ${new Date(plan.finalized_at).toLocaleString()}*`);
  lines.push("");
  
  // Outcomes
  lines.push("## Outcomes");
  lines.push("");
  for (const outcome of plan.outcomes) {
    lines.push(`### ${outcome.priority}. ${outcome.description}`);
    lines.push("");
    lines.push(`*${outcome.rationale}*`);
    lines.push("");
  }
  
  // Created tasks
  if (plan.created_task_ids.length > 0) {
    lines.push("## Tasks Created");
    lines.push("");
    lines.push(`${plan.created_task_ids.length} task(s) created from this plan.`);
    lines.push("");
  }
  
  // Updated tasks
  if (plan.updated_task_ids.length > 0) {
    lines.push("## Tasks Updated");
    lines.push("");
    lines.push(`${plan.updated_task_ids.length} task(s) updated from this plan.`);
    lines.push("");
  }
  
  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

/** Maximum tokens for the AI response */
export const MAX_COMPLETION_TOKENS = 4000;

/** Maximum context tokens to include */
export const MAX_CONTEXT_TOKENS = 6000;

/** Default model to use */
export const DEFAULT_MODEL = "gpt-4o";

/** Cost limits (in cents) - warn if exceeded */
export const COST_WARNING_THRESHOLD_CENTS = 50;

/** Note project name for week plans */
export const WEEK_PLAN_PROJECT_NAME = "week-plans";

/** Note tag for week plans */
export const WEEK_PLAN_TAG = "week-plan";
