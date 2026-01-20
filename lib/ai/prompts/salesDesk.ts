/* ═══════════════════════════════════════════════════════════════════════════
   Sales Desk - Prompt Types and Builders
   ═══════════════════════════════════════════════════════════════════════════ */

// ════════════════════════════════════════════════════════════════════════════
// Request / Response Types
// ════════════════════════════════════════════════════════════════════════════

export interface SalesPrepRequest {
  lead_name?: string;
  company_name?: string;
  opportunity_context?: string;
  previous_emails?: string;
  known_objections?: string;
  call_objective?: string;
  cheap_mode?: boolean;
}

export interface SalesPrepResponse {
  call_prep_brief: string;
  talking_points: string[];
  objection_scripts: ObjectionScript[];
  follow_up_draft: FollowUpEmail;
  suggested_tasks: SuggestedTask[];
  reasoning: string;
}

export interface ObjectionScript {
  objection: string;
  response: string;
}

export interface FollowUpEmail {
  subject: string;
  body: string;
}

export interface SuggestedTask {
  title: string;
  due_date?: string;
  priority: "urgent" | "high" | "normal" | "low";
}

// ════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════

export const DEFAULT_MODEL = "gpt-4o";
export const CHEAP_MODEL = "gpt-4o-mini";
export const MAX_COMPLETION_TOKENS = 4096;

// Pricing (per million tokens)
export const GPT4O_INPUT_COST_PER_M = 2.5;
export const GPT4O_OUTPUT_COST_PER_M = 10;
export const GPT4O_MINI_INPUT_COST_PER_M = 0.15;
export const GPT4O_MINI_OUTPUT_COST_PER_M = 0.6;

// ════════════════════════════════════════════════════════════════════════════
// Prompt Builders
// ════════════════════════════════════════════════════════════════════════════

export function buildSalesDeskSystemPrompt(userName?: string): string {
  const greeting = userName ? `The user's name is ${userName}.` : "";

  return `You are Sales Desk, an AI assistant specialized in sales preparation.
Your job is to help sales professionals prepare for calls, handle objections, and follow up effectively.

${greeting}

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "call_prep_brief": "2-3 paragraph summary with key points to cover, rapport builders, and strategy",
  "talking_points": ["Array of 4-6 concise talking points for the call"],
  "objection_scripts": [
    {
      "objection": "The anticipated objection",
      "response": "A professional, empathetic response that addresses the concern"
    }
  ],
  "follow_up_draft": {
    "subject": "Email subject line",
    "body": "Professional follow-up email body (use \\n for line breaks)"
  },
  "suggested_tasks": [
    {
      "title": "Task description",
      "due_date": "YYYY-MM-DD or null",
      "priority": "urgent|high|normal|low"
    }
  ],
  "reasoning": "Brief explanation of your approach"
}

GUIDELINES:
- Be professional but personable
- Focus on value-based selling, not pressure tactics
- Objection responses should be empathetic and solution-oriented
- Follow-up emails should be concise and action-oriented
- Suggested tasks should be specific and actionable
- If call objective is unclear, focus on discovery and relationship building
- Always include at least 2 objection scripts (anticipate common ones if not provided)
- Keep the call prep brief focused and scannable`;
}

export function buildSalesDeskUserMessage(request: SalesPrepRequest): string {
  const parts: string[] = [];

  if (request.lead_name || request.company_name) {
    parts.push(
      `LEAD: ${[request.lead_name, request.company_name].filter(Boolean).join(" at ")}`
    );
  }

  if (request.opportunity_context) {
    parts.push(`OPPORTUNITY CONTEXT:\n${request.opportunity_context}`);
  }

  if (request.previous_emails) {
    parts.push(`PREVIOUS COMMUNICATIONS:\n${request.previous_emails}`);
  }

  if (request.known_objections) {
    parts.push(`KNOWN OBJECTIONS/CONCERNS:\n${request.known_objections}`);
  }

  if (request.call_objective) {
    parts.push(`CALL OBJECTIVE: ${request.call_objective}`);
  }

  if (parts.length === 0) {
    parts.push(
      "Please generate a general sales call preparation framework for a discovery call."
    );
  }

  parts.push(`\nToday's date: ${new Date().toISOString().split("T")[0]}`);

  return parts.join("\n\n");
}

// ════════════════════════════════════════════════════════════════════════════
// Response Parsing
// ════════════════════════════════════════════════════════════════════════════

export function parseSalesPrepResponse(
  content: string
): SalesPrepResponse | null {
  try {
    // Handle markdown-wrapped JSON
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (
      typeof parsed.call_prep_brief !== "string" ||
      !Array.isArray(parsed.talking_points) ||
      !Array.isArray(parsed.objection_scripts) ||
      !parsed.follow_up_draft ||
      !Array.isArray(parsed.suggested_tasks)
    ) {
      return null;
    }

    return {
      call_prep_brief: parsed.call_prep_brief,
      talking_points: parsed.talking_points,
      objection_scripts: parsed.objection_scripts.map(
        (s: { objection?: string; response?: string }) => ({
          objection: s.objection || "",
          response: s.response || "",
        })
      ),
      follow_up_draft: {
        subject: parsed.follow_up_draft.subject || "",
        body: parsed.follow_up_draft.body || "",
      },
      suggested_tasks: parsed.suggested_tasks.map(
        (t: { title?: string; due_date?: string; priority?: string }) => ({
          title: t.title || "Follow up",
          due_date: t.due_date || undefined,
          priority: (["urgent", "high", "normal", "low"].includes(t.priority || "")
            ? t.priority
            : "normal") as "urgent" | "high" | "normal" | "low",
        })
      ),
      reasoning: parsed.reasoning || "",
    };
  } catch {
    return null;
  }
}
