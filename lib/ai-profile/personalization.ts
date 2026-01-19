/**
 * AI Personalization Utilities
 * 
 * Build personalized system prompts and context from user profile
 */

import type { AIUserProfile, AIUserGoal } from "@/types/ai-profile";

/**
 * Build a personalized system prompt from user profile
 */
export function buildPersonalizedPrompt(
  profile: AIUserProfile,
  activeGoals?: AIUserGoal[]
): string {
  const sections: string[] = [];
  
  // Opening with name
  if (profile.preferred_name) {
    sections.push(`You are speaking with ${profile.preferred_name}.`);
  }
  
  // Communication style
  sections.push(buildCommunicationInstructions(profile));
  
  // Identity context
  if (profile.self_description || profile.roles.length > 0 || profile.life_stage) {
    sections.push(buildIdentityContext(profile));
  }
  
  // Purpose context
  if (profile.core_why || profile.mission_statement || profile.core_values.length > 0) {
    sections.push(buildPurposeContext(profile));
  }
  
  // Strengths and growth
  if (profile.strengths.length > 0 || profile.growth_areas.length > 0 || profile.passions.length > 0) {
    sections.push(buildStrengthsContext(profile));
  }
  
  // Current context
  if (profile.current_focus || profile.current_challenges.length > 0) {
    sections.push(buildCurrentContext(profile));
  }
  
  // Goals
  if (activeGoals && activeGoals.length > 0) {
    sections.push(buildGoalsContext(activeGoals));
  }
  
  // Important context
  if (profile.important_context) {
    sections.push(`## Important Context\n${profile.important_context}`);
  }
  
  // Boundaries
  if (profile.topics_to_avoid.length > 0 || profile.sensitive_areas.length > 0) {
    sections.push(buildBoundariesContext(profile));
  }
  
  return sections.join("\n\n");
}

/**
 * Build communication style instructions
 */
function buildCommunicationInstructions(profile: AIUserProfile): string {
  const instructions: string[] = [];
  
  // Base style
  const styleDescriptions: Record<string, string> = {
    direct: "Be direct and to the point. Don't sugarcoat things.",
    nurturing: "Be warm, supportive, and encouraging in your responses.",
    analytical: "Focus on logic, data, and systematic analysis.",
    creative: "Be imaginative and explore creative possibilities.",
    balanced: "Balance warmth with directness, analysis with creativity.",
  };
  
  instructions.push(styleDescriptions[profile.communication_style] || styleDescriptions.balanced);
  
  // Formality
  const formalityDescriptions: Record<string, string> = {
    formal: "Use formal language and professional tone.",
    professional: "Maintain a professional but approachable tone.",
    casual: "Use casual, conversational language.",
    friendly: "Be warm and friendly, like talking to a good friend.",
  };
  
  instructions.push(formalityDescriptions[profile.formality_level] || formalityDescriptions.casual);
  
  // Detail level
  const detailDescriptions: Record<string, string> = {
    brief: "Keep responses concise and focused. Get to the point quickly.",
    moderate: "Provide enough detail to be helpful without being overwhelming.",
    detailed: "Provide thorough, detailed responses with context.",
    comprehensive: "Give comprehensive answers exploring multiple angles.",
  };
  
  instructions.push(detailDescriptions[profile.detail_preference] || detailDescriptions.moderate);
  
  // Emotional support
  if (profile.emotional_support_level === "high") {
    instructions.push("Be emotionally supportive. Acknowledge feelings and validate experiences.");
  } else if (profile.emotional_support_level === "minimal") {
    instructions.push("Focus on practical matters rather than emotional support.");
  }
  
  // Challenge
  if (profile.challenge_me) {
    instructions.push("Don't just agree - challenge their thinking when appropriate. Ask probing questions.");
  }
  
  // Celebrate wins
  if (profile.celebrate_wins) {
    instructions.push("Acknowledge and celebrate achievements, progress, and wins.");
  }
  
  // Style additions
  if (profile.use_analogies) {
    instructions.push("Use analogies and metaphors to explain complex ideas.");
  }
  
  if (profile.use_humor) {
    instructions.push("Include appropriate humor when it fits the conversation.");
  }
  
  if (profile.be_philosophical) {
    instructions.push("Explore deeper meanings and philosophical implications when relevant.");
  }
  
  if (profile.action_oriented) {
    instructions.push("Focus on actionable advice and next steps.");
  }
  
  return "## How to Communicate\n\n" + instructions.join(" ");
}

/**
 * Build identity context
 */
function buildIdentityContext(profile: AIUserProfile): string {
  const parts: string[] = [];
  
  if (profile.self_description) {
    parts.push(`Self-description: ${profile.self_description}`);
  }
  
  if (profile.roles.length > 0) {
    parts.push(`Roles: ${profile.roles.join(", ")}`);
  }
  
  if (profile.life_stage) {
    parts.push(`Life stage: ${profile.life_stage}`);
  }
  
  if (profile.expertise_areas.length > 0) {
    parts.push(`Areas of expertise: ${profile.expertise_areas.join(", ")}`);
  }
  
  return "## Who They Are\n\n" + parts.join("\n");
}

/**
 * Build purpose context
 */
function buildPurposeContext(profile: AIUserProfile): string {
  const parts: string[] = [];
  
  if (profile.core_why) {
    parts.push(`Their "Why": ${profile.core_why}`);
  }
  
  if (profile.mission_statement) {
    parts.push(`Mission: ${profile.mission_statement}`);
  }
  
  if (profile.long_term_vision) {
    parts.push(`Long-term vision: ${profile.long_term_vision}`);
  }
  
  if (profile.core_values.length > 0) {
    const values = profile.core_values
      .sort((a, b) => a.rank - b.rank)
      .map(v => v.value + (v.description ? ` (${v.description})` : ""))
      .join(", ");
    parts.push(`Core values: ${values}`);
  }
  
  return "## Their Purpose & Values\n\n" + parts.join("\n");
}

/**
 * Build strengths context
 */
function buildStrengthsContext(profile: AIUserProfile): string {
  const parts: string[] = [];
  
  if (profile.strengths.length > 0) {
    const strengths = profile.strengths
      .map(s => s.strength + (s.context ? ` (${s.context})` : ""))
      .join(", ");
    parts.push(`Strengths: ${strengths}`);
  }
  
  if (profile.growth_areas.length > 0) {
    const areas = profile.growth_areas
      .filter(a => a.working_on)
      .map(a => a.area)
      .join(", ");
    if (areas) {
      parts.push(`Currently working on: ${areas}`);
    }
  }
  
  if (profile.passions.length > 0) {
    const passions = profile.passions
      .map(p => p.passion)
      .join(", ");
    parts.push(`Passionate about: ${passions}`);
  }
  
  if (profile.learning_goals.length > 0) {
    parts.push(`Learning goals: ${profile.learning_goals.join(", ")}`);
  }
  
  return "## Strengths & Growth\n\n" + parts.join("\n");
}

/**
 * Build current context
 */
function buildCurrentContext(profile: AIUserProfile): string {
  const parts: string[] = [];
  
  if (profile.current_focus) {
    parts.push(`Current focus: ${profile.current_focus}`);
  }
  
  if (profile.current_challenges.length > 0) {
    parts.push(`Current challenges: ${profile.current_challenges.join(", ")}`);
  }
  
  return "## Current Situation\n\n" + parts.join("\n");
}

/**
 * Build goals context
 */
function buildGoalsContext(goals: AIUserGoal[]): string {
  const activeGoals = goals.filter(g => g.status === "active");
  
  if (activeGoals.length === 0) return "";
  
  const goalList = activeGoals
    .map(g => {
      let item = `- ${g.title}`;
      if (g.progress > 0) item += ` (${g.progress}% complete)`;
      if (g.why_important) item += `\n  Why: ${g.why_important}`;
      return item;
    })
    .join("\n");
  
  return `## Active Goals\n\n${goalList}`;
}

/**
 * Build boundaries context
 */
function buildBoundariesContext(profile: AIUserProfile): string {
  const parts: string[] = [];
  
  if (profile.topics_to_avoid.length > 0) {
    parts.push(`Avoid these topics: ${profile.topics_to_avoid.join(", ")}`);
  }
  
  if (profile.sensitive_areas.length > 0) {
    parts.push(`Approach carefully: ${profile.sensitive_areas.join(", ")}`);
  }
  
  return "## Boundaries\n\n" + parts.join("\n");
}

/**
 * Discovery questions for profile onboarding
 */
export const DISCOVERY_QUESTIONS = [
  // Identity
  {
    id: "name",
    section: "identity",
    question: "What would you like me to call you?",
    type: "text",
    field: "preferred_name",
    required: true,
  },
  {
    id: "self",
    section: "identity",
    question: "How would you describe yourself in a few sentences?",
    description: "Think about how you'd introduce yourself to someone who wants to truly understand you.",
    type: "textarea",
    field: "self_description",
  },
  {
    id: "roles",
    section: "identity",
    question: "What roles do you play in life?",
    description: "e.g., entrepreneur, parent, developer, artist, mentor, student",
    type: "multiselect",
    options: ["Entrepreneur", "Executive", "Developer", "Designer", "Parent", "Partner", "Artist", "Writer", "Mentor", "Student", "Caregiver", "Leader", "Creator"],
    field: "roles",
  },
  {
    id: "life_stage",
    section: "identity",
    question: "Where are you in your journey?",
    type: "select",
    options: [
      "Just starting out",
      "Building momentum",
      "Scaling up",
      "Established and growing",
      "Transitioning",
      "Reinventing myself",
      "Mentoring others",
    ],
    field: "life_stage",
  },
  
  // Purpose
  {
    id: "why",
    section: "purpose",
    question: "What is your 'Why'?",
    description: "What drives you at your core? What gets you out of bed in the morning?",
    type: "textarea",
    field: "core_why",
    required: true,
  },
  {
    id: "mission",
    section: "purpose",
    question: "What are you trying to accomplish?",
    description: "Your mission - what you're working toward.",
    type: "textarea",
    field: "mission_statement",
  },
  {
    id: "vision",
    section: "purpose",
    question: "Where do you see yourself in 5-10 years?",
    type: "textarea",
    field: "long_term_vision",
  },
  {
    id: "values",
    section: "purpose",
    question: "What values are most important to you?",
    description: "Select and rank your top values.",
    type: "ranking",
    options: [
      "Integrity", "Growth", "Freedom", "Family", "Impact", "Creativity",
      "Excellence", "Authenticity", "Courage", "Compassion", "Adventure",
      "Security", "Knowledge", "Balance", "Leadership", "Service"
    ],
    field: "core_values",
  },
  
  // Strengths
  {
    id: "strengths",
    section: "strengths",
    question: "What are you naturally good at?",
    description: "Your superpowers - skills that come easily to you.",
    type: "textarea",
    field: "strengths",
  },
  {
    id: "growth",
    section: "strengths",
    question: "What are you working to improve?",
    description: "Areas where you're actively growing.",
    type: "textarea",
    field: "growth_areas",
  },
  {
    id: "passions",
    section: "strengths",
    question: "What are you passionate about?",
    description: "Things that light you up, even if they're not your job.",
    type: "textarea",
    field: "passions",
  },
  {
    id: "expertise",
    section: "strengths",
    question: "What topics do you know deeply?",
    description: "Areas where you have significant expertise.",
    type: "multiselect",
    field: "expertise_areas",
  },
  
  // Communication
  {
    id: "style",
    section: "communication",
    question: "How do you prefer I communicate with you?",
    type: "select",
    options: [
      { value: "direct", label: "Direct - Be straight with me, no fluff" },
      { value: "nurturing", label: "Nurturing - Warm and supportive" },
      { value: "analytical", label: "Analytical - Data and logic focused" },
      { value: "creative", label: "Creative - Imaginative and exploratory" },
      { value: "balanced", label: "Balanced - Mix of all approaches" },
    ],
    field: "communication_style",
  },
  {
    id: "formality",
    section: "communication",
    question: "What tone feels right?",
    type: "select",
    options: [
      { value: "formal", label: "Formal - Professional and structured" },
      { value: "professional", label: "Professional - Polished but approachable" },
      { value: "casual", label: "Casual - Relaxed conversation" },
      { value: "friendly", label: "Friendly - Like talking to a good friend" },
    ],
    field: "formality_level",
  },
  {
    id: "detail",
    section: "communication",
    question: "How much detail do you want?",
    type: "select",
    options: [
      { value: "brief", label: "Brief - Just the essentials" },
      { value: "moderate", label: "Moderate - Enough context to understand" },
      { value: "detailed", label: "Detailed - Thorough explanations" },
      { value: "comprehensive", label: "Comprehensive - Full deep-dives" },
    ],
    field: "detail_preference",
  },
  {
    id: "challenge",
    section: "communication",
    question: "Should I challenge your thinking?",
    description: "Push back when I see potential blind spots or room for growth.",
    type: "select",
    options: [
      { value: true, label: "Yes - I want to be challenged" },
      { value: false, label: "No - I prefer support over challenge" },
    ],
    field: "challenge_me",
  },
  
  // Context
  {
    id: "focus",
    section: "context",
    question: "What's your main focus right now?",
    description: "The primary thing you're working on or thinking about.",
    type: "textarea",
    field: "current_focus",
  },
  {
    id: "challenges",
    section: "context",
    question: "What challenges are you facing?",
    description: "Main obstacles or difficulties you're dealing with.",
    type: "textarea",
    field: "current_challenges",
  },
  {
    id: "context",
    section: "context",
    question: "Is there anything else I should always keep in mind?",
    description: "Important context that shapes how I should help you.",
    type: "textarea",
    field: "important_context",
  },
];

/**
 * Generate a reflection prompt based on profile
 */
export function generateReflectionPrompt(
  profile: AIUserProfile,
  type: "weekly_checkin" | "quarterly_review" | "milestone"
): string {
  const name = profile.preferred_name || "there";
  
  if (type === "weekly_checkin") {
    return `Hey ${name}, let's take a moment to reflect on your week.

1. What went well this week?
2. What was challenging?
3. What did you learn about yourself?
4. Is your current focus (${profile.current_focus || "not set"}) still the right priority?
5. Anything you want to adjust for next week?`;
  }
  
  if (type === "quarterly_review") {
    return `${name}, it's time for a deeper reflection.

Looking at your "Why": "${profile.core_why || "not yet defined"}"

1. Are you living in alignment with this purpose?
2. What progress have you made toward your vision?
3. Have your values shifted at all?
4. What strengths have you leveraged well?
5. What growth areas need more attention?
6. Is there anything about how I communicate that you'd like to change?`;
  }
  
  // Milestone
  return `${name}, you've hit a milestone! Let's capture this moment.

1. What did you accomplish?
2. How does this connect to your bigger "Why"?
3. What made this possible?
4. What did you learn?
5. What's the next milestone you're aiming for?`;
}
