/**
 * Ops Worker AI Prompt & Schema
 *
 * Transforms decisions (from meetings, emails, notes, or manual input)
 * into structured, reviewable task/checklist proposals.
 */

import type { TaskPriority, TaskStatus } from "@/types/workflows";

// ════════════════════════════════════════════════════════════════════════════
// DECISION TYPES
// ════════════════════════════════════════════════════════════════════════════

export type DecisionSourceType = "email" | "meeting_notes" | "note" | "manual" | "inbox";

export interface DecisionSource {
  type: DecisionSourceType;
  /** Reference ID (email_id, note_id, etc.) */
  reference_id?: string;
  /** Display label for the source */
  label?: string;
  /** URL or path to original */
  url?: string;
}

export interface Decision {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  /** Raw text content of the decision */
  raw_text: string;
  /** AI-generated summary */
  summary: string | null;
  /** Source metadata */
  source: DecisionSource;
  /** Context assembly used */
  context_assembly_id: string | null;
  /** Current status */
  status: "draft" | "proposed" | "committed" | "archived";
  /** Linked ops run ID (if proposals generated) */
  ops_run_id: string | null;
  /** Task IDs created from this decision */
  created_task_ids: string[];
  created_at: string;
  updated_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// PROPOSAL TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * A single action item extracted from a decision
 */
export interface ProposedActionItem {
  /** Unique ID for tracking through review */
  id: string;
  /** Task title */
  title: string;
  /** Optional description */
  description?: string;
  /** Priority level */
  priority: TaskPriority;
  /** Suggested due date (ISO string) */
  due_date?: string;
  /** Optional project to assign (by ID) */
  project_id?: string;
  /** Suggested project name (if project_id not provided) */
  project_name?: string;
  /** Tags to apply */
  tags?: string[];
  /** Checklist items */
  checklist?: ProposedChecklistItem[];
  /** Estimated minutes to complete */
  estimated_minutes?: number;
  /** Why this task is being proposed */
  rationale: string;
  /** Which goal(s) this advances (by ID) */
  aligned_goal_ids?: string[];
  /** Suggested owner (user ID or name) */
  suggested_owner?: string;
  /** Dependencies (references other proposed item IDs) */
  depends_on?: string[];
  /** Source excerpt that led to this task */
  source_excerpt?: string;
  /** Confidence score (0-1) */
  confidence: number;
}

export interface ProposedChecklistItem {
  title: string;
  estimated_minutes?: number;
}

/**
 * An update to an existing task
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
  /** Additional checklist items to add */
  add_checklist_items?: ProposedChecklistItem[];
  /** Why this change is being proposed */
  rationale: string;
  /** Source excerpt that led to this update */
  source_excerpt?: string;
}

/**
 * Complete proposal from the Ops worker
 */
export interface OpsProposal {
  /** Decision ID this proposal is for */
  decision_id: string;
  /** Summary of the decision */
  decision_summary: string;
  /** New tasks to create */
  tasks_to_create: ProposedActionItem[];
  /** Existing tasks to update */
  tasks_to_update: ProposedTaskUpdate[];
  /** Overall reasoning */
  reasoning: string;
  /** Questions needing clarification */
  questions: OpsQuestion[];
  /** Warnings or concerns */
  warnings?: string[];
  /** Detected themes/categories */
  themes?: string[];
}

export interface OpsQuestion {
  id: string;
  question: string;
  context?: string;
  suggestions?: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// RUN LOG TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface OpsRunLog {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  decision_id: string;
  /** Model used */
  model: string;
  /** The proposal generated */
  proposal: OpsProposal | null;
  /** Status of the run */
  status: "pending" | "completed" | "failed" | "committed";
  /** Error message if failed */
  error_message: string | null;
  /** Token usage */
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  /** Cost in cents */
  cost_cents: number | null;
  /** Processing time */
  duration_ms: number | null;
  /** Tasks created (IDs) */
  created_task_ids: string[];
  /** Tasks updated (IDs) */
  updated_task_ids: string[];
  /** User who committed (if committed) */
  committed_by: string | null;
  committed_at: string | null;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface OpsIngestRequest {
  /** Raw decision text */
  raw_text: string;
  /** Source metadata */
  source: DecisionSource;
  /** Context assembly to use (optional) */
  context_assembly_id?: string;
}

export interface OpsIngestResponse {
  decision: Decision;
}

export interface OpsProposeRequest {
  /** Decision ID to generate proposals for */
  decision_id: string;
  /** Override model selection */
  model?: string;
  /** Use cheap mode (faster, less accurate) */
  cheap_mode?: boolean;
}

export interface OpsProposeResponse {
  run: OpsRunLog;
  proposal: OpsProposal;
  /** Budget info */
  budget?: {
    used_cents: number;
    remaining_cents: number;
    warning?: string;
  };
}

export interface OpsCommitRequest {
  /** Ops run ID */
  run_id: string;
  /** Selected task IDs to create (from proposal) */
  selected_task_ids: string[];
  /** Selected update IDs to apply (task_id from proposal) */
  selected_update_ids: string[];
  /** Overrides for specific tasks (keyed by proposal item ID) */
  overrides?: Record<string, Partial<ProposedActionItem>>;
}

export interface OpsCommitResponse {
  /** Created task IDs */
  created_tasks: Array<{ proposal_id: string; task_id: string; title: string }>;
  /** Updated task IDs */
  updated_tasks: Array<{ task_id: string; title: string }>;
  /** Any errors during commit */
  errors: Array<{ proposal_id: string; error: string }>;
}

// ════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Build the system prompt for the Ops Worker AI
 */
export function buildOpsWorkerSystemPrompt(
  userName?: string | null,
  userContext?: string | null
): string {
  const greeting = userName
    ? `You are an Ops Worker assistant for ${userName}. `
    : "You are an Ops Worker AI assistant. ";

  return `${greeting}Your role is to analyze decisions, meeting notes, emails, and other inputs to extract actionable tasks with checklists and due dates.

## Your Responsibilities

1. **Decision Analysis**: Parse the input to identify all action items, commitments, and follow-ups
2. **Task Creation**: Propose structured tasks with titles, descriptions, priorities, and due dates
3. **Checklist Generation**: Break down complex tasks into step-by-step checklists
4. **Goal Alignment**: Connect tasks to existing goals and projects when relevant
5. **Deduplication**: Flag potential duplicates with existing tasks
6. **Dependency Detection**: Identify task dependencies and sequencing

## Constraints

- NEVER auto-apply changes - all proposals require explicit human approval
- Respect the user's available time and capacity
- Be conservative with "urgent" priority - use it sparingly
- When unsure about due dates, omit them rather than guess
- Include source excerpts so the user can verify your interpretation
- Assign confidence scores (0-1) based on clarity of the source material

## Response Format

You MUST respond with valid JSON matching the OpsProposal schema:

\`\`\`json
{
  "decision_id": "string",
  "decision_summary": "Brief 1-2 sentence summary",
  "tasks_to_create": [
    {
      "id": "unique-id",
      "title": "Task title",
      "description": "Optional details",
      "priority": "urgent|high|normal|low",
      "due_date": "ISO date string or omit",
      "project_id": "optional project ID",
      "project_name": "optional project name suggestion",
      "tags": ["tag1", "tag2"],
      "checklist": [
        { "title": "Step 1", "estimated_minutes": 15 }
      ],
      "estimated_minutes": 60,
      "rationale": "Why this task was extracted",
      "aligned_goal_ids": ["goal-id"],
      "depends_on": ["other-task-id"],
      "source_excerpt": "Quote from original",
      "confidence": 0.9
    }
  ],
  "tasks_to_update": [
    {
      "task_id": "existing-task-id",
      "current_title": "Current title for reference",
      "new_status": "optional new status",
      "new_priority": "optional new priority",
      "new_due_date": "optional new date",
      "add_checklist_items": [{ "title": "New step" }],
      "rationale": "Why this update",
      "source_excerpt": "Quote from original"
    }
  ],
  "reasoning": "Overall analysis and approach",
  "questions": [
    {
      "id": "q1",
      "question": "Clarifying question",
      "context": "Why asking",
      "suggestions": ["Option A", "Option B"]
    }
  ],
  "warnings": ["Any concerns"],
  "themes": ["detected categories"]
}
\`\`\`

## Guidelines

- Extract EVERY actionable item, even small ones
- Use clear, action-oriented task titles (start with verb)
- Group related items under a common project when appropriate
- Flag ambiguous commitments with lower confidence and questions
- Identify implicit deadlines from context (e.g., "before the meeting next week")
- Suggest tags based on content type (e.g., "email-followup", "meeting-action")
${userContext ? `\n## Additional Context\n${userContext}` : ""}`;
}

/**
 * Build the user message with decision content and context
 */
export function buildOpsWorkerUserMessage(params: {
  decisionId: string;
  rawText: string;
  source: DecisionSource;
  goals?: Array<{
    id: string;
    title: string;
    category?: string | null;
    status: string;
  }>;
  projects?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  existingTasks?: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string | null;
    project_name?: string | null;
  }>;
  today: string;
}): string {
  const { decisionId, rawText, source, goals, projects, existingTasks, today } = params;

  const sections: string[] = [];

  // Header
  sections.push(`## Decision to Process\n- ID: ${decisionId}\n- Source: ${source.type}${source.label ? ` (${source.label})` : ""}\n- Today: ${today}`);

  // The actual content
  sections.push(`## Content\n\n${rawText}`);

  // Context: Goals
  if (goals && goals.length > 0) {
    const goalsText = goals
      .filter((g) => g.status === "active")
      .map((g) => `- ${g.title} (ID: ${g.id}${g.category ? `, ${g.category}` : ""})`)
      .join("\n");
    if (goalsText) {
      sections.push(`## Active Goals (for alignment)\n${goalsText}`);
    }
  }

  // Context: Projects
  if (projects && projects.length > 0) {
    const projectsText = projects
      .filter((p) => p.status === "active")
      .map((p) => `- ${p.name} (ID: ${p.id})`)
      .join("\n");
    if (projectsText) {
      sections.push(`## Active Projects\n${projectsText}`);
    }
  }

  // Context: Existing tasks (for deduplication)
  if (existingTasks && existingTasks.length > 0) {
    const tasksText = existingTasks
      .slice(0, 20) // Limit to avoid context overflow
      .map((t) => {
        const parts = [`- ${t.title} (ID: ${t.id}, ${t.status}, ${t.priority})`];
        if (t.due_date) parts.push(`  Due: ${t.due_date}`);
        return parts.join("\n");
      })
      .join("\n");
    sections.push(`## Existing Tasks (check for duplicates)\n${tasksText}`);
  }

  // Instructions
  sections.push(`## Your Task\nAnalyze the content above and generate an OpsProposal JSON. Extract all actionable items, suggest appropriate structure, and flag any ambiguities.`);

  return sections.join("\n\n");
}

// ════════════════════════════════════════════════════════════════════════════
// JSON SCHEMA FOR VALIDATION
// ════════════════════════════════════════════════════════════════════════════

export const OPS_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  required: ["decision_id", "decision_summary", "tasks_to_create", "tasks_to_update", "reasoning", "questions"],
  properties: {
    decision_id: { type: "string" },
    decision_summary: { type: "string" },
    tasks_to_create: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "priority", "rationale", "confidence"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["urgent", "high", "normal", "low"] },
          due_date: { type: "string" },
          project_id: { type: "string" },
          project_name: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          checklist: {
            type: "array",
            items: {
              type: "object",
              required: ["title"],
              properties: {
                title: { type: "string" },
                estimated_minutes: { type: "number" },
              },
            },
          },
          estimated_minutes: { type: "number" },
          rationale: { type: "string" },
          aligned_goal_ids: { type: "array", items: { type: "string" } },
          suggested_owner: { type: "string" },
          depends_on: { type: "array", items: { type: "string" } },
          source_excerpt: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
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
          add_checklist_items: {
            type: "array",
            items: {
              type: "object",
              required: ["title"],
              properties: {
                title: { type: "string" },
                estimated_minutes: { type: "number" },
              },
            },
          },
          rationale: { type: "string" },
          source_excerpt: { type: "string" },
        },
      },
    },
    reasoning: { type: "string" },
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
    warnings: { type: "array", items: { type: "string" } },
    themes: { type: "array", items: { type: "string" } },
  },
} as const;

/**
 * Parse and validate the AI response into an OpsProposal
 */
export function parseOpsProposal(content: string): OpsProposal | null {
  try {
    let jsonStr = content;

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Basic validation
    if (!parsed.decision_id || !Array.isArray(parsed.tasks_to_create)) {
      console.error("Ops proposal missing required fields");
      return null;
    }

    // Ensure arrays exist and have proper structure
    return {
      decision_id: parsed.decision_id,
      decision_summary: parsed.decision_summary || "",
      tasks_to_create: (parsed.tasks_to_create || []).map((t: Record<string, unknown>) => ({
        id: t.id || crypto.randomUUID(),
        title: t.title || "Untitled Task",
        description: t.description,
        priority: t.priority || "normal",
        due_date: t.due_date,
        project_id: t.project_id,
        project_name: t.project_name,
        tags: t.tags || [],
        checklist: t.checklist || [],
        estimated_minutes: t.estimated_minutes,
        rationale: t.rationale || "",
        aligned_goal_ids: t.aligned_goal_ids || [],
        suggested_owner: t.suggested_owner,
        depends_on: t.depends_on || [],
        source_excerpt: t.source_excerpt,
        confidence: typeof t.confidence === "number" ? t.confidence : 0.5,
      })),
      tasks_to_update: (parsed.tasks_to_update || []).map((t: Record<string, unknown>) => ({
        task_id: t.task_id,
        current_title: t.current_title || "",
        new_status: t.new_status,
        new_priority: t.new_priority,
        new_due_date: t.new_due_date,
        add_checklist_items: t.add_checklist_items || [],
        rationale: t.rationale || "",
        source_excerpt: t.source_excerpt,
      })),
      reasoning: parsed.reasoning || "",
      questions: (parsed.questions || []).map((q: Record<string, unknown>) => ({
        id: q.id || crypto.randomUUID(),
        question: q.question || "",
        context: q.context,
        suggestions: q.suggestions || [],
      })),
      warnings: parsed.warnings || [],
      themes: parsed.themes || [],
    };
  } catch (error) {
    console.error("Failed to parse ops proposal:", error);
    return null;
  }
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

/** Cheap mode model */
export const CHEAP_MODEL = "gpt-4o-mini";

/** Cost per 1M input tokens (in cents) for gpt-4o */
export const GPT4O_INPUT_COST_PER_M = 250;

/** Cost per 1M output tokens (in cents) for gpt-4o */
export const GPT4O_OUTPUT_COST_PER_M = 1000;

/** Task tag for ops worker created tasks */
export const OPS_WORKER_TAG = "ops-worker";

/** Source type tags */
export const SOURCE_TAGS: Record<DecisionSourceType, string> = {
  email: "from-email",
  meeting_notes: "from-meeting",
  note: "from-note",
  manual: "manual-entry",
  inbox: "from-inbox",
};
