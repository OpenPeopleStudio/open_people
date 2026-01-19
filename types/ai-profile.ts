/**
 * AI Personalization Profile Types
 */

export interface AIUserProfile {
  id: string;
  user_id: string;
  
  // Identity
  preferred_name: string | null;
  self_description: string | null;
  roles: string[];
  
  // Purpose
  core_why: string | null;
  mission_statement: string | null;
  long_term_vision: string | null;
  core_values: CoreValue[];
  
  // Strengths & Growth
  strengths: Strength[];
  growth_areas: GrowthArea[];
  passions: Passion[];
  expertise_areas: string[];
  learning_goals: string[];
  
  // Communication Preferences
  communication_style: CommunicationStyle;
  formality_level: FormalityLevel;
  detail_preference: DetailPreference;
  emotional_support_level: EmotionalSupportLevel;
  challenge_me: boolean;
  celebrate_wins: boolean;
  use_analogies: boolean;
  use_humor: boolean;
  be_philosophical: boolean;
  action_oriented: boolean;
  
  // Context
  current_focus: string | null;
  current_challenges: string[];
  life_stage: string | null;
  important_context: string | null;
  
  // Boundaries
  topics_to_avoid: string[];
  sensitive_areas: string[];
  
  // Meta
  profile_completeness: number;
  last_reflection_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoreValue {
  value: string;
  description?: string;
  rank: number;
}

export interface Strength {
  strength: string;
  context?: string;
}

export interface GrowthArea {
  area: string;
  context?: string;
  working_on: boolean;
}

export interface Passion {
  passion: string;
  why?: string;
}

export type CommunicationStyle = "direct" | "nurturing" | "analytical" | "creative" | "balanced";
export type FormalityLevel = "formal" | "professional" | "casual" | "friendly";
export type DetailPreference = "brief" | "moderate" | "detailed" | "comprehensive";
export type EmotionalSupportLevel = "minimal" | "moderate" | "high";

export interface AIProfileReflection {
  id: string;
  user_id: string;
  prompt_type: "weekly_checkin" | "quarterly_review" | "milestone" | "custom";
  prompt: string;
  response: string | null;
  ai_insights: Record<string, unknown>;
  suggested_updates: ProfileUpdate[];
  updates_applied: boolean;
  created_at: string;
}

export interface ProfileUpdate {
  field: string;
  old_value: unknown;
  new_value: unknown;
  reason: string;
}

export interface AIUserGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  why_important: string | null;
  category: GoalCategory | null;
  timeframe: GoalTimeframe | null;
  status: "active" | "achieved" | "paused" | "abandoned";
  progress: number;
  milestones: GoalMilestone[];
  lessons_learned: string | null;
  target_date: string | null;
  achieved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GoalCategory = "personal" | "professional" | "health" | "relationship" | "financial" | "learning";
export type GoalTimeframe = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "life";

export interface GoalMilestone {
  title: string;
  completed: boolean;
  completed_at?: string;
}

export interface AIConversationStyle {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  communication_style: CommunicationStyle | null;
  formality_level: FormalityLevel | null;
  detail_preference: DetailPreference | null;
  emotional_support_level: EmotionalSupportLevel | null;
  challenge_me: boolean | null;
  use_analogies: boolean | null;
  use_humor: boolean | null;
  be_philosophical: boolean | null;
  action_oriented: boolean | null;
  custom_instructions: string | null;
  is_default: boolean;
  use_count: number;
  created_at: string;
}

// API Request/Response types

export interface UpdateProfileRequest {
  preferred_name?: string;
  self_description?: string;
  roles?: string[];
  core_why?: string;
  mission_statement?: string;
  long_term_vision?: string;
  core_values?: CoreValue[];
  strengths?: Strength[];
  growth_areas?: GrowthArea[];
  passions?: Passion[];
  expertise_areas?: string[];
  learning_goals?: string[];
  communication_style?: CommunicationStyle;
  formality_level?: FormalityLevel;
  detail_preference?: DetailPreference;
  emotional_support_level?: EmotionalSupportLevel;
  challenge_me?: boolean;
  celebrate_wins?: boolean;
  use_analogies?: boolean;
  use_humor?: boolean;
  be_philosophical?: boolean;
  action_oriented?: boolean;
  current_focus?: string;
  current_challenges?: string[];
  life_stage?: string;
  important_context?: string;
  topics_to_avoid?: string[];
  sensitive_areas?: string[];
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  why_important?: string;
  category?: GoalCategory;
  timeframe?: GoalTimeframe;
  target_date?: string;
  milestones?: GoalMilestone[];
}

// Discovery questions for onboarding
export interface DiscoveryQuestion {
  id: string;
  section: "identity" | "purpose" | "strengths" | "communication" | "context";
  question: string;
  description?: string;
  type: "text" | "textarea" | "select" | "multiselect" | "scale" | "ranking";
  options?: string[];
  field: keyof UpdateProfileRequest;
  required?: boolean;
}
