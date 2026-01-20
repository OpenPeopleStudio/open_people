/**
 * Analyst Worker AI Prompt & Schema
 *
 * Generates weekly reviews with activity summaries, metrics,
 * and decisions for the Ops worker to turn into action items.
 */

// ════════════════════════════════════════════════════════════════════════════
// WEEKLY REVIEW SCHEMA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Task completion metrics
 */
export interface TaskMetrics {
  /** Tasks completed this week */
  completed: number;
  /** Tasks created this week */
  created: number;
  /** Tasks carried over from last week */
  carried_over: number;
  /** Completion rate (0-100) */
  completion_rate: number;
  /** Average time to complete (hours) */
  avg_completion_time?: number;
  /** Top projects by activity */
  top_projects: Array<{ name: string; tasks_completed: number }>;
}

/**
 * AI usage metrics
 */
export interface AIMetrics {
  /** Total AI calls */
  total_calls: number;
  /** Total cost in cents */
  total_cost_cents: number;
  /** Breakdown by worker */
  by_worker: Array<{ worker: string; calls: number; cost_cents: number }>;
  /** Budget utilization (0-100) */
  budget_utilization?: number;
  /** Estimated monthly run rate (cents) */
  monthly_run_rate?: number;
}

/**
 * Goal progress update
 */
export interface GoalProgress {
  /** Goal ID */
  goal_id: string;
  /** Goal title */
  title: string;
  /** Progress at start of week */
  progress_start: number;
  /** Progress at end of week */
  progress_end: number;
  /** Change this week */
  delta: number;
  /** Status assessment */
  status: "on_track" | "at_risk" | "behind" | "completed";
  /** Key activities that moved this forward */
  key_activities?: string[];
}

/**
 * A highlight or notable event
 */
export interface WeeklyHighlight {
  /** What happened */
  description: string;
  /** Type of highlight */
  type: "achievement" | "learning" | "blocker" | "decision" | "milestone";
  /** Related goal/project (if any) */
  related_to?: string;
  /** Impact assessment */
  impact: "high" | "medium" | "low";
}

/**
 * A decision identified for Ops processing
 */
export interface IdentifiedDecision {
  /** Decision summary */
  summary: string;
  /** Context/reasoning */
  context: string;
  /** Source (what led to this) */
  source: string;
  /** Priority */
  priority: "high" | "normal" | "low";
  /** Related goals */
  related_goal_ids?: string[];
}

/**
 * Reflection questions for user
 */
export interface ReflectionPrompt {
  /** The question */
  question: string;
  /** Why this is being asked */
  context: string;
  /** Suggested areas to consider */
  consider?: string[];
}

/**
 * Complete weekly review output
 */
export interface WeeklyReview {
  /** Week covered */
  week_start: string;
  week_end: string;
  
  /** Executive summary (2-3 sentences) */
  executive_summary: string;
  
  /** Task metrics */
  task_metrics: TaskMetrics;
  
  /** AI usage metrics */
  ai_metrics: AIMetrics;
  
  /** Goal progress */
  goals_progress: GoalProgress[];
  
  /** Weekly highlights */
  highlights: WeeklyHighlight[];
  
  /** Decisions to process */
  decisions: IdentifiedDecision[];
  
  /** Reflection prompts */
  reflections: ReflectionPrompt[];
  
  /** Recommendations for next week */
  recommendations: string[];
  
  /** Concerns or risks identified */
  concerns?: string[];
  
  /** Overall assessment */
  overall_assessment: "excellent" | "good" | "mixed" | "challenging";
}

// ════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface WeeklyReviewRequest {
  /** Start of review period */
  week_start: string;
  /** End of review period */
  week_end: string;
  /** Focus areas (optional) */
  focus_areas?: string[];
  /** Include AI metrics? */
  include_ai_metrics?: boolean;
}

export interface WeeklyReviewResponse {
  /** Generated review */
  review: WeeklyReview;
  /** Data sources used */
  sources_used: {
    tasks_count: number;
    goals_count: number;
    notes_count: number;
    ai_runs_count: number;
  };
  /** Token usage */
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
// SYSTEM PROMPT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Build the system prompt for the Analyst AI
 */
export function buildAnalystSystemPrompt(
  userName?: string | null,
  userContext?: string | null
): string {
  const greeting = userName
    ? `You are a personal analyst for ${userName}. `
    : "You are an AI analyst assistant. ";

  return `${greeting}Your role is to analyze weekly activity and generate actionable reviews with metrics and decisions.

## Your Responsibilities

1. **Summarize Activity**: Create a clear picture of the week's work
2. **Track Metrics**: Calculate completion rates, AI usage, and trends
3. **Assess Progress**: Evaluate goal progress honestly
4. **Identify Patterns**: Spot trends and potential issues
5. **Generate Decisions**: Create actionable decisions for Ops processing
6. **Prompt Reflection**: Ask thoughtful questions for personal growth

## Constraints

- Use only data from the provided context
- Be honest about negative trends - don't sugarcoat
- Keep recommendations specific and actionable
- Decisions should be concrete enough for task creation
- Limit reflections to 2-3 meaningful questions

## Response Format

You MUST respond with valid JSON matching the WeeklyReview schema:

\`\`\`json
{
  "week_start": "2024-01-15",
  "week_end": "2024-01-21",
  "executive_summary": "This week saw solid progress on...",
  "task_metrics": {
    "completed": 12,
    "created": 8,
    "carried_over": 3,
    "completion_rate": 75,
    "top_projects": [{"name": "Project A", "tasks_completed": 5}]
  },
  "ai_metrics": {
    "total_calls": 45,
    "total_cost_cents": 320,
    "by_worker": [{"worker": "chief-of-staff", "calls": 3, "cost_cents": 120}],
    "budget_utilization": 65
  },
  "goals_progress": [
    {
      "goal_id": "...",
      "title": "Launch MVP",
      "progress_start": 60,
      "progress_end": 75,
      "delta": 15,
      "status": "on_track"
    }
  ],
  "highlights": [
    {
      "description": "Completed major feature X",
      "type": "achievement",
      "impact": "high"
    }
  ],
  "decisions": [
    {
      "summary": "Prioritize customer onboarding this week",
      "context": "Based on feedback received...",
      "source": "Weekly review analysis",
      "priority": "high"
    }
  ],
  "reflections": [
    {
      "question": "What one thing could you stop doing next week?",
      "context": "Your task list grew faster than completions",
      "consider": ["Delegation", "Scope reduction"]
    }
  ],
  "recommendations": ["Focus on completing carried-over tasks first"],
  "overall_assessment": "good"
}
\`\`\`

## Guidelines

- Start executive summary with the most important insight
- Include both wins and areas for improvement
- Make decisions actionable (ready for Ops worker)
- Ask reflection questions that prompt action
- Be specific in recommendations
${userContext ? `\n## Additional Context\n${userContext}` : ""}`;
}

/**
 * Build the user message with activity data
 */
export function buildAnalystUserMessage(params: {
  weekStart: string;
  weekEnd: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    completed_at?: string;
    project_name?: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    status: string;
  }>;
  aiRuns?: Array<{
    worker: string;
    cost_cents: number;
    created_at: string;
  }>;
  budget?: {
    budget_cents: number;
    used_cents: number;
  };
  focusAreas?: string[];
}): string {
  const { weekStart, weekEnd, tasks, goals, aiRuns, budget, focusAreas } = params;

  const sections: string[] = [];

  sections.push(`## Review Period\n${weekStart} to ${weekEnd}`);

  if (focusAreas && focusAreas.length > 0) {
    sections.push(`## Focus Areas\n${focusAreas.map((a) => `- ${a}`).join("\n")}`);
  }

  // Tasks
  const completedTasks = tasks.filter(t => t.completed_at);
  const createdTasks = tasks.filter(t => new Date(t.created_at) >= new Date(weekStart));
  
  sections.push(`## Task Activity
- Total tasks in period: ${tasks.length}
- Completed: ${completedTasks.length}
- Created this week: ${createdTasks.length}

### Completed Tasks
${completedTasks.map(t => `- ${t.title} (${t.priority})${t.project_name ? ` [${t.project_name}]` : ""}`).join("\n") || "None"}

### Open Tasks
${tasks.filter(t => !t.completed_at).map(t => `- ${t.title} (${t.status}, ${t.priority})`).join("\n") || "None"}`);

  // Goals
  if (goals.length > 0) {
    sections.push(`## Goals
${goals.map(g => `- ${g.title}: ${g.progress}% (${g.status})`).join("\n")}`);
  }

  // AI Usage
  if (aiRuns && aiRuns.length > 0) {
    const totalCost = aiRuns.reduce((sum, r) => sum + r.cost_cents, 0);
    const byWorker = aiRuns.reduce((acc, r) => {
      acc[r.worker] = (acc[r.worker] || 0) + r.cost_cents;
      return acc;
    }, {} as Record<string, number>);
    
    sections.push(`## AI Usage
- Total calls: ${aiRuns.length}
- Total cost: ${(totalCost / 100).toFixed(2)} USD
${budget ? `- Budget: ${(budget.used_cents / 100).toFixed(2)} / ${(budget.budget_cents / 100).toFixed(2)} USD` : ""}
- By worker: ${Object.entries(byWorker).map(([w, c]) => `${w}: $${(c / 100).toFixed(2)}`).join(", ")}`);
  }

  sections.push(
    `## Your Task\nGenerate a WeeklyReview JSON analyzing this week's activity with actionable decisions and reflections.`
  );

  return sections.join("\n\n");
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const MAX_COMPLETION_TOKENS = 4000;
export const MAX_CONTEXT_TOKENS = 8000;
export const DEFAULT_MODEL = "gpt-4o";
export const CHEAP_MODEL = "gpt-4o-mini";

/**
 * Parse and validate the AI response into a WeeklyReview
 */
export function parseWeeklyReview(content: string): WeeklyReview | null {
  try {
    let jsonStr = content;

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.week_start || !parsed.executive_summary) {
      console.error("Weekly review missing required fields");
      return null;
    }

    return {
      week_start: parsed.week_start,
      week_end: parsed.week_end,
      executive_summary: parsed.executive_summary,
      task_metrics: parsed.task_metrics || {
        completed: 0,
        created: 0,
        carried_over: 0,
        completion_rate: 0,
        top_projects: [],
      },
      ai_metrics: parsed.ai_metrics || {
        total_calls: 0,
        total_cost_cents: 0,
        by_worker: [],
      },
      goals_progress: parsed.goals_progress || [],
      highlights: parsed.highlights || [],
      decisions: parsed.decisions || [],
      reflections: parsed.reflections || [],
      recommendations: parsed.recommendations || [],
      concerns: parsed.concerns,
      overall_assessment: parsed.overall_assessment || "mixed",
    };
  } catch (error) {
    console.error("Failed to parse weekly review:", error);
    return null;
  }
}
