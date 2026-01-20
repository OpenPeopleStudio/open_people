/**
 * Inbox Triage Worker AI Prompt & Schema
 *
 * Analyzes email threads to generate summaries, proposed replies,
 * and follow-up tasks.
 */

import type { TaskPriority } from "@/types/workflows";

// ════════════════════════════════════════════════════════════════════════════
// EMAIL ANALYSIS SCHEMA
// ════════════════════════════════════════════════════════════════════════════

/**
 * Email thread summary
 */
export interface ThreadSummary {
  /** 3-bullet summary */
  key_points: string[];
  /** Overall sentiment */
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  /** Main topic/subject */
  topic: string;
  /** Key people involved */
  participants: string[];
  /** Action required? */
  requires_action: boolean;
  /** Deadline mentioned (if any) */
  deadline?: string;
}

/**
 * A proposed reply option
 */
export interface ReplyOption {
  /** Option identifier */
  id: string;
  /** Reply subject (if different from RE:) */
  subject?: string;
  /** Reply body */
  body: string;
  /** Tone of the reply */
  tone: "formal" | "friendly" | "brief" | "detailed";
  /** Key points addressed */
  addresses: string[];
  /** Recommended use case */
  best_for: string;
}

/**
 * A follow-up task extracted from the email
 */
export interface ExtractedTask {
  /** Task title */
  title: string;
  /** Task description */
  description?: string;
  /** Priority */
  priority: TaskPriority;
  /** Due date (if mentioned or inferable) */
  due_date?: string;
  /** Source quote from email */
  source_excerpt: string;
  /** Confidence (0-1) */
  confidence: number;
  /** Suggested owner */
  suggested_owner?: string;
}

/**
 * A label/tag suggestion
 */
export interface LabelSuggestion {
  /** Label name */
  label: string;
  /** Reason for suggestion */
  reason: string;
  /** Confidence (0-1) */
  confidence: number;
}

/**
 * Complete email triage output
 */
export interface EmailTriageResult {
  /** Thread ID reference */
  thread_id: string;
  /** Thread summary */
  summary: ThreadSummary;
  /** Proposed replies (2-3 options) */
  reply_options: ReplyOption[];
  /** Extracted follow-up tasks */
  tasks: ExtractedTask[];
  /** Suggested labels/tags */
  labels: LabelSuggestion[];
  /** AI's reasoning */
  reasoning: string;
  /** Questions needing clarification */
  questions?: string[];
  /** Warnings (e.g., sensitive content) */
  warnings?: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface EmailMessage {
  /** Message ID */
  id: string;
  /** From address */
  from: string;
  /** To addresses */
  to: string[];
  /** CC addresses */
  cc?: string[];
  /** Subject */
  subject: string;
  /** Body (plain text) */
  body: string;
  /** Date sent */
  date: string;
}

export interface TriageRequest {
  /** Thread ID */
  thread_id: string;
  /** Messages in the thread (chronological) */
  messages: EmailMessage[];
  /** User's email (for context) */
  user_email: string;
  /** User's name */
  user_name?: string;
  /** Reply preferences */
  preferences?: {
    default_tone?: "formal" | "friendly" | "brief";
    signature?: string;
    max_reply_length?: number;
  };
}

export interface TriageResponse {
  /** Triage result */
  result: EmailTriageResult;
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
 * Build the system prompt for the Inbox Triage AI
 */
export function buildInboxTriageSystemPrompt(
  userName?: string | null,
  userEmail?: string | null
): string {
  const greeting = userName
    ? `You are an email assistant for ${userName}${userEmail ? ` (${userEmail})` : ""}. `
    : "You are an AI email assistant. ";

  return `${greeting}Your role is to analyze email threads and help draft responses and extract action items.

## Your Responsibilities

1. **Summarize**: Create a clear 3-point summary of the thread
2. **Assess**: Determine sentiment, urgency, and required actions
3. **Draft Replies**: Generate 2-3 reply options with different tones
4. **Extract Tasks**: Identify any action items or follow-ups
5. **Label**: Suggest appropriate labels/tags

## Constraints

- NEVER auto-send replies - all must be reviewed first
- Respect privacy - don't include unnecessary personal details
- Be conservative with urgency assessments
- Include source excerpts for extracted tasks
- Flag potentially sensitive content

## Response Format

You MUST respond with valid JSON matching the EmailTriageResult schema:

\`\`\`json
{
  "thread_id": "...",
  "summary": {
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "sentiment": "neutral",
    "topic": "Main topic",
    "participants": ["person@email.com"],
    "requires_action": true,
    "deadline": "2024-01-25"
  },
  "reply_options": [
    {
      "id": "r1",
      "body": "Reply text...",
      "tone": "friendly",
      "addresses": ["main question"],
      "best_for": "Quick acknowledgment"
    }
  ],
  "tasks": [
    {
      "title": "Follow up on X",
      "priority": "normal",
      "due_date": "2024-01-25",
      "source_excerpt": "Can you send me X by Friday?",
      "confidence": 0.9
    }
  ],
  "labels": [
    {
      "label": "action-required",
      "reason": "Contains explicit request",
      "confidence": 0.95
    }
  ],
  "reasoning": "..."
}
\`\`\`

## Guidelines

- Lead replies with direct answers to questions
- Match formality to the sender's tone
- Keep task titles action-oriented (start with verb)
- Use realistic confidence scores
- Err on the side of creating tasks for unclear commitments`;
}

/**
 * Build the user message with email thread
 */
export function buildInboxTriageUserMessage(params: {
  threadId: string;
  messages: EmailMessage[];
  userEmail: string;
  preferences?: TriageRequest["preferences"];
}): string {
  const { threadId, messages, userEmail, preferences } = params;

  const sections: string[] = [];

  sections.push(`## Thread ID\n${threadId}`);
  sections.push(`## Your Email\n${userEmail}`);

  const messagesText = messages
    .map((m) => {
      return `### From: ${m.from}
To: ${m.to.join(", ")}${m.cc ? `\nCC: ${m.cc.join(", ")}` : ""}
Date: ${m.date}
Subject: ${m.subject}

${m.body}`;
    })
    .join("\n\n---\n\n");

  sections.push(`## Email Thread\n${messagesText}`);

  if (preferences) {
    const prefLines: string[] = [];
    if (preferences.default_tone) prefLines.push(`- Preferred tone: ${preferences.default_tone}`);
    if (preferences.max_reply_length) prefLines.push(`- Max reply length: ${preferences.max_reply_length} words`);
    if (prefLines.length > 0) {
      sections.push(`## Reply Preferences\n${prefLines.join("\n")}`);
    }
  }

  sections.push(
    `## Your Task\nAnalyze this email thread and generate an EmailTriageResult JSON with summary, reply options, and extracted tasks.`
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
 * Parse and validate the AI response into an EmailTriageResult
 */
export function parseEmailTriageResult(content: string): EmailTriageResult | null {
  try {
    let jsonStr = content;

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.thread_id || !parsed.summary) {
      console.error("Email triage result missing required fields");
      return null;
    }

    return {
      thread_id: parsed.thread_id,
      summary: {
        key_points: parsed.summary.key_points || [],
        sentiment: parsed.summary.sentiment || "neutral",
        topic: parsed.summary.topic || "",
        participants: parsed.summary.participants || [],
        requires_action: parsed.summary.requires_action ?? false,
        deadline: parsed.summary.deadline,
      },
      reply_options: parsed.reply_options || [],
      tasks: parsed.tasks || [],
      labels: parsed.labels || [],
      reasoning: parsed.reasoning || "",
      questions: parsed.questions,
      warnings: parsed.warnings,
    };
  } catch (error) {
    console.error("Failed to parse email triage result:", error);
    return null;
  }
}
