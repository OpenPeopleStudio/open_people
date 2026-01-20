/**
 * Researcher Worker AI Prompt & Schema
 *
 * Turns questions into structured research briefs with executive summaries,
 * key points, and next actions. Saves findings to knowledge base.
 */

// ════════════════════════════════════════════════════════════════════════════
// RESEARCH BRIEF SCHEMA
// ════════════════════════════════════════════════════════════════════════════

/**
 * A key point extracted from research
 */
export interface ResearchKeyPoint {
  /** Brief summary of the point */
  summary: string;
  /** Supporting details or evidence */
  details?: string;
  /** Source reference (if available) */
  source?: string;
  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * An open question identified during research
 */
export interface ResearchOpenQuestion {
  /** The question */
  question: string;
  /** Why this question is important */
  context?: string;
  /** Suggested approaches to answer */
  suggestions?: string[];
}

/**
 * A recommended next action from research
 */
export interface ResearchNextAction {
  /** Action title */
  title: string;
  /** Why this action is recommended */
  rationale: string;
  /** Priority (1 = highest) */
  priority: number;
  /** Suggested assignee (optional) */
  assignee?: string;
  /** Estimated effort */
  effort?: "low" | "medium" | "high";
}

/**
 * A fact extracted for the knowledge base
 */
export interface ExtractedFact {
  /** The fact statement */
  fact: string;
  /** Fact type */
  fact_type: "attribute" | "preference" | "relationship" | "event" | "belief" | "skill" | "context";
  /** Subject of the fact */
  subject_name: string;
  /** Type of subject */
  subject_type: "person" | "organization" | "project" | "topic" | "tool" | "other";
  /** Confidence (0-1) */
  confidence: number;
}

/**
 * Complete research brief output
 */
export interface ResearchBrief {
  /** Original question/topic */
  question: string;
  /** Executive summary (2-3 sentences) */
  executive_summary: string;
  /** Key points discovered */
  key_points: ResearchKeyPoint[];
  /** Open questions needing further investigation */
  open_questions: ResearchOpenQuestion[];
  /** Recommended next actions */
  next_actions: ResearchNextAction[];
  /** Facts to save to knowledge base */
  extracted_facts: ExtractedFact[];
  /** Sources consulted */
  sources_consulted: string[];
  /** Overall confidence in findings (0-1) */
  overall_confidence: number;
  /** Tags for categorization */
  tags: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ════════════════════════════════════════════════════════════════════════════

export type ResearchSource = "internal" | "notes" | "tasks" | "knowledge" | "web";

export interface ResearchRequest {
  /** The research question */
  question: string;
  /** Sources to search */
  sources: ResearchSource[];
  /** Output format preference */
  format: "brief" | "full";
  /** Additional context */
  context?: string;
  /** Focus areas */
  focus_areas?: string[];
}

export interface ResearchResponse {
  /** The generated brief */
  brief: ResearchBrief;
  /** Context that was used */
  context_used: {
    documents_count: number;
    notes_count: number;
    tasks_count: number;
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
 * Build the system prompt for the Researcher AI
 */
export function buildResearcherSystemPrompt(
  userName?: string | null,
  userContext?: string | null
): string {
  const greeting = userName
    ? `You are a Research Assistant for ${userName}. `
    : "You are an AI Research Assistant. ";

  return `${greeting}Your role is to analyze questions and generate structured research briefs with actionable insights.

## Your Responsibilities

1. **Question Analysis**: Understand the core question and identify sub-questions
2. **Information Synthesis**: Combine relevant information from provided sources
3. **Key Point Extraction**: Identify the most important findings
4. **Gap Identification**: Note what information is missing or uncertain
5. **Action Recommendations**: Suggest concrete next steps
6. **Fact Extraction**: Identify facts worth saving to the knowledge base

## Constraints

- Only use information from the provided context
- Clearly indicate confidence levels for each finding
- Don't make up information - acknowledge gaps
- Focus on actionable insights, not just summaries
- Keep executive summaries concise (2-3 sentences)

## Response Format

You MUST respond with valid JSON matching the ResearchBrief schema:

\`\`\`json
{
  "question": "The original question",
  "executive_summary": "2-3 sentence summary of key findings",
  "key_points": [
    {
      "summary": "Key finding",
      "details": "Supporting details",
      "source": "Where this came from",
      "confidence": 0.9
    }
  ],
  "open_questions": [
    {
      "question": "Unanswered question",
      "context": "Why this matters",
      "suggestions": ["How to answer"]
    }
  ],
  "next_actions": [
    {
      "title": "Recommended action",
      "rationale": "Why this is important",
      "priority": 1,
      "effort": "low"
    }
  ],
  "extracted_facts": [
    {
      "fact": "Fact statement",
      "fact_type": "attribute",
      "subject_name": "Subject",
      "subject_type": "topic",
      "confidence": 0.85
    }
  ],
  "sources_consulted": ["List of sources"],
  "overall_confidence": 0.8,
  "tags": ["relevant", "tags"]
}
\`\`\`

## Guidelines

- Prioritize accuracy over comprehensiveness
- Flag contradictory information
- Suggest specific, actionable next steps
- Include relevant context for each finding
- Use tags to help with future organization
${userContext ? `\n## Additional Context\n${userContext}` : ""}`;
}

/**
 * Build the user message with research context
 */
export function buildResearcherUserMessage(params: {
  question: string;
  format: "brief" | "full";
  documents?: Array<{ title: string; content: string; source?: string }>;
  notes?: Array<{ title: string; content: string }>;
  tasks?: Array<{ title: string; description?: string; status: string }>;
  additionalContext?: string;
}): string {
  const { question, format, documents, notes, tasks, additionalContext } = params;

  const sections: string[] = [];

  sections.push(`## Research Question\n${question}`);
  sections.push(`## Output Format\n${format === "brief" ? "Concise research brief" : "Detailed report"}`);

  if (documents && documents.length > 0) {
    const docsText = documents
      .map((d) => `### ${d.title}${d.source ? ` (${d.source})` : ""}\n${d.content}`)
      .join("\n\n");
    sections.push(`## Knowledge Documents\n${docsText}`);
  }

  if (notes && notes.length > 0) {
    const notesText = notes.map((n) => `### ${n.title}\n${n.content}`).join("\n\n");
    sections.push(`## Relevant Notes\n${notesText}`);
  }

  if (tasks && tasks.length > 0) {
    const tasksText = tasks
      .map((t) => `- ${t.title} (${t.status})${t.description ? `: ${t.description}` : ""}`)
      .join("\n");
    sections.push(`## Related Tasks\n${tasksText}`);
  }

  if (additionalContext) {
    sections.push(`## Additional Context\n${additionalContext}`);
  }

  sections.push(
    `## Your Task\nAnalyze the above and generate a ResearchBrief JSON answering the question.`
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
 * Parse and validate the AI response into a ResearchBrief
 */
export function parseResearchBrief(content: string): ResearchBrief | null {
  try {
    let jsonStr = content;

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.question || !parsed.executive_summary) {
      console.error("Research brief missing required fields");
      return null;
    }

    return {
      question: parsed.question,
      executive_summary: parsed.executive_summary,
      key_points: parsed.key_points || [],
      open_questions: parsed.open_questions || [],
      next_actions: parsed.next_actions || [],
      extracted_facts: parsed.extracted_facts || [],
      sources_consulted: parsed.sources_consulted || [],
      overall_confidence: parsed.overall_confidence ?? 0.5,
      tags: parsed.tags || [],
    };
  } catch (error) {
    console.error("Failed to parse research brief:", error);
    return null;
  }
}
