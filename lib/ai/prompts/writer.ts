/**
 * Writer Worker AI Prompt & Schema
 *
 * Generates content drafts, emails, and marketing copy with multiple variants.
 * Produces structured artifacts that can be saved as notes or email templates.
 */

// ════════════════════════════════════════════════════════════════════════════
// CONTENT TYPES
// ════════════════════════════════════════════════════════════════════════════

export type ContentType = "email" | "landing" | "social" | "blog" | "custom";
export type ToneType = "professional" | "friendly" | "casual" | "formal" | "playful" | "urgent" | "empathetic";

// ════════════════════════════════════════════════════════════════════════════
// CONTENT SCHEMA
// ════════════════════════════════════════════════════════════════════════════

/**
 * A headline option for landing pages or emails
 */
export interface HeadlineOption {
  /** The headline text */
  text: string;
  /** Why this headline might work */
  rationale: string;
  /** Target emotion or benefit */
  approach: string;
}

/**
 * A call-to-action option
 */
export interface CTAOption {
  /** CTA text */
  text: string;
  /** Destination or action description */
  action: string;
  /** Urgency level */
  urgency: "low" | "medium" | "high";
}

/**
 * A content variant
 */
export interface ContentVariant {
  /** Variant identifier */
  id: string;
  /** The content body */
  content: string;
  /** Tone used */
  tone: ToneType;
  /** Key angle or approach */
  angle: string;
  /** Word count */
  word_count: number;
  /** Recommended use case */
  best_for?: string;
}

/**
 * Email-specific fields
 */
export interface EmailContent {
  /** Subject line options */
  subject_lines: string[];
  /** Preview text options */
  preview_texts: string[];
  /** Email body variants */
  body_variants: ContentVariant[];
  /** Suggested send time */
  suggested_send_time?: string;
}

/**
 * Landing page-specific fields
 */
export interface LandingContent {
  /** Headline options */
  headlines: HeadlineOption[];
  /** Subheadline options */
  subheadlines: string[];
  /** Body copy variants */
  body_variants: ContentVariant[];
  /** CTA options */
  ctas: CTAOption[];
  /** Suggested sections */
  sections?: string[];
}

/**
 * Social post-specific fields
 */
export interface SocialContent {
  /** Post variants for different platforms */
  variants: ContentVariant[];
  /** Suggested hashtags */
  hashtags: string[];
  /** Suggested posting times */
  posting_times?: string[];
  /** Thread/carousel suggestions */
  thread_suggestions?: string[];
}

/**
 * Blog-specific fields
 */
export interface BlogContent {
  /** Title options */
  titles: string[];
  /** Meta description */
  meta_description: string;
  /** Outline */
  outline: string[];
  /** Full content variants */
  body_variants: ContentVariant[];
  /** Suggested internal links */
  internal_link_suggestions?: string[];
}

/**
 * Complete content generation output
 */
export interface ContentGeneration {
  /** Content type */
  content_type: ContentType;
  /** Topic/subject */
  topic: string;
  /** Target audience */
  audience: string;
  /** Requested tone */
  tone: ToneType;
  
  /** Type-specific content */
  email?: EmailContent;
  landing?: LandingContent;
  social?: SocialContent;
  blog?: BlogContent;
  custom?: { variants: ContentVariant[] };
  
  /** AI's reasoning */
  reasoning: string;
  /** Suggestions for improvement */
  improvement_suggestions: string[];
  /** Tags for organization */
  tags: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// REQUEST/RESPONSE TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface WriteRequest {
  /** Content type */
  content_type: ContentType;
  /** Topic or subject */
  topic: string;
  /** Target audience */
  audience: string;
  /** Desired tone */
  tone: ToneType;
  /** Additional context */
  context?: string;
  /** Examples to reference */
  examples?: string[];
  /** Brand voice guidelines */
  brand_voice?: string;
  /** Constraints (word limits, etc.) */
  constraints?: {
    max_words?: number;
    required_keywords?: string[];
    avoid_words?: string[];
  };
}

export interface WriteResponse {
  /** Generated content */
  content: ContentGeneration;
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
 * Build the system prompt for the Writer AI
 */
export function buildWriterSystemPrompt(
  userName?: string | null,
  brandVoice?: string | null
): string {
  const greeting = userName
    ? `You are a professional copywriter assisting ${userName}. `
    : "You are an expert AI copywriter. ";

  return `${greeting}Your role is to generate compelling content with multiple variants for testing and refinement.

## Your Responsibilities

1. **Understand the Brief**: Grasp the topic, audience, and tone requirements
2. **Generate Variants**: Create multiple options for headlines, CTAs, and body copy
3. **Optimize for Audience**: Tailor language and messaging to the target audience
4. **Provide Rationale**: Explain why each variant might work
5. **Suggest Improvements**: Offer ways to enhance the content

## Constraints

- Respect any word limits or constraints provided
- Match the requested tone consistently
- Avoid clichés unless specifically requested
- Include all required keywords naturally
- Never use offensive or discriminatory language

## Response Format

You MUST respond with valid JSON matching the ContentGeneration schema. Include the appropriate type-specific content based on content_type.

For EMAIL:
\`\`\`json
{
  "content_type": "email",
  "topic": "...",
  "audience": "...",
  "tone": "professional",
  "email": {
    "subject_lines": ["Option 1", "Option 2", "Option 3"],
    "preview_texts": ["Preview 1", "Preview 2"],
    "body_variants": [
      {
        "id": "v1",
        "content": "Email body...",
        "tone": "professional",
        "angle": "benefits-focused",
        "word_count": 150,
        "best_for": "cold outreach"
      }
    ]
  },
  "reasoning": "...",
  "improvement_suggestions": ["..."],
  "tags": ["email", "marketing"]
}
\`\`\`

## Guidelines

- Lead with value, not features
- Use active voice
- Keep sentences concise
- Create curiosity without clickbait
- A/B test-friendly variants (one variable at a time)
- Consider mobile readability
${brandVoice ? `\n## Brand Voice Guidelines\n${brandVoice}` : ""}`;
}

/**
 * Build the user message for content generation
 */
export function buildWriterUserMessage(params: {
  contentType: ContentType;
  topic: string;
  audience: string;
  tone: ToneType;
  context?: string;
  examples?: string[];
  constraints?: WriteRequest["constraints"];
}): string {
  const { contentType, topic, audience, tone, context, examples, constraints } = params;

  const sections: string[] = [];

  sections.push(`## Content Type\n${contentType}`);
  sections.push(`## Topic\n${topic}`);
  sections.push(`## Target Audience\n${audience}`);
  sections.push(`## Tone\n${tone}`);

  if (context) {
    sections.push(`## Additional Context\n${context}`);
  }

  if (examples && examples.length > 0) {
    sections.push(`## Reference Examples\n${examples.map((e, i) => `${i + 1}. ${e}`).join("\n")}`);
  }

  if (constraints) {
    const constraintLines: string[] = [];
    if (constraints.max_words) constraintLines.push(`- Max words: ${constraints.max_words}`);
    if (constraints.required_keywords?.length) {
      constraintLines.push(`- Required keywords: ${constraints.required_keywords.join(", ")}`);
    }
    if (constraints.avoid_words?.length) {
      constraintLines.push(`- Avoid: ${constraints.avoid_words.join(", ")}`);
    }
    if (constraintLines.length > 0) {
      sections.push(`## Constraints\n${constraintLines.join("\n")}`);
    }
  }

  sections.push(
    `## Your Task\nGenerate a ContentGeneration JSON with multiple variants for this ${contentType} content.`
  );

  return sections.join("\n\n");
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const MAX_COMPLETION_TOKENS = 4000;
export const MAX_CONTEXT_TOKENS = 4000;
export const DEFAULT_MODEL = "gpt-4o";
export const CHEAP_MODEL = "gpt-4o-mini";

/**
 * Parse and validate the AI response into a ContentGeneration
 */
export function parseContentGeneration(content: string): ContentGeneration | null {
  try {
    let jsonStr = content;

    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!parsed.content_type || !parsed.topic) {
      console.error("Content generation missing required fields");
      return null;
    }

    return {
      content_type: parsed.content_type,
      topic: parsed.topic,
      audience: parsed.audience || "",
      tone: parsed.tone || "professional",
      email: parsed.email,
      landing: parsed.landing,
      social: parsed.social,
      blog: parsed.blog,
      custom: parsed.custom,
      reasoning: parsed.reasoning || "",
      improvement_suggestions: parsed.improvement_suggestions || [],
      tags: parsed.tags || [],
    };
  } catch (error) {
    console.error("Failed to parse content generation:", error);
    return null;
  }
}
