-- ════════════════════════════════════════════════════════════════════════════
-- AI Personalization Profile Schema
-- Understanding who you are so AI can serve you better
-- ════════════════════════════════════════════════════════════════════════════

-- User's core identity and values
CREATE TABLE IF NOT EXISTS ai_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- IDENTITY: Who you are
  -- ═══════════════════════════════════════════════════════════════════════════
  
  -- How you see yourself
  preferred_name VARCHAR(100),           -- What you want to be called
  self_description TEXT,                 -- How you'd describe yourself in a few sentences
  roles TEXT[] DEFAULT '{}',             -- entrepreneur, parent, developer, artist, etc.
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- PURPOSE: Your Why
  -- ═══════════════════════════════════════════════════════════════════════════
  
  core_why TEXT,                         -- Your fundamental purpose/motivation
  mission_statement TEXT,                -- What you're trying to accomplish
  long_term_vision TEXT,                 -- Where you see yourself in 5-10 years
  
  -- Values that drive you (ranked)
  core_values JSONB DEFAULT '[]',        -- [{value: "integrity", description: "...", rank: 1}]
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- STRENGTHS & GROWTH
  -- ═══════════════════════════════════════════════════════════════════════════
  
  strengths JSONB DEFAULT '[]',          -- [{strength: "strategic thinking", context: "..."}]
  growth_areas JSONB DEFAULT '[]',       -- [{area: "patience", context: "...", working_on: true}]
  passions JSONB DEFAULT '[]',           -- [{passion: "building products", why: "..."}]
  
  -- Skills and expertise
  expertise_areas TEXT[] DEFAULT '{}',   -- Areas where you have deep knowledge
  learning_goals TEXT[] DEFAULT '{}',    -- What you're currently trying to learn
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- COMMUNICATION PREFERENCES
  -- ═══════════════════════════════════════════════════════════════════════════
  
  -- How you like AI to communicate
  communication_style VARCHAR(50) DEFAULT 'balanced',  -- direct, nurturing, analytical, creative, balanced
  formality_level VARCHAR(50) DEFAULT 'casual',        -- formal, professional, casual, friendly
  detail_preference VARCHAR(50) DEFAULT 'moderate',    -- brief, moderate, detailed, comprehensive
  
  -- Emotional tone
  emotional_support_level VARCHAR(50) DEFAULT 'moderate', -- minimal, moderate, high
  challenge_me BOOLEAN DEFAULT true,                   -- Should AI push back/challenge your thinking?
  celebrate_wins BOOLEAN DEFAULT true,                 -- Should AI acknowledge achievements?
  
  -- Response style
  use_analogies BOOLEAN DEFAULT true,                  -- Explain with metaphors and analogies
  use_humor BOOLEAN DEFAULT false,                     -- Include appropriate humor
  be_philosophical BOOLEAN DEFAULT false,              -- Explore deeper meanings
  action_oriented BOOLEAN DEFAULT true,                -- Focus on actionable advice
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- CONTEXT & CIRCUMSTANCES
  -- ═══════════════════════════════════════════════════════════════════════════
  
  current_focus TEXT,                    -- What you're primarily focused on right now
  current_challenges TEXT[] DEFAULT '{}',-- Main challenges you're facing
  life_stage VARCHAR(100),               -- Career starter, scaling business, retirement, etc.
  
  -- Important context
  important_context TEXT,                -- Anything else AI should always know
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- BOUNDARIES & PREFERENCES
  -- ═══════════════════════════════════════════════════════════════════════════
  
  topics_to_avoid TEXT[] DEFAULT '{}',   -- Topics you don't want discussed
  sensitive_areas TEXT[] DEFAULT '{}',   -- Areas to approach carefully
  
  -- ═══════════════════════════════════════════════════════════════════════════
  -- META
  -- ═══════════════════════════════════════════════════════════════════════════
  
  profile_completeness INTEGER DEFAULT 0, -- 0-100 percentage
  last_reflection_at TIMESTAMPTZ,        -- Last time user reviewed/updated profile
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile reflections (periodic check-ins)
CREATE TABLE IF NOT EXISTS ai_profile_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reflection prompts and responses
  prompt_type VARCHAR(100) NOT NULL,     -- weekly_checkin, quarterly_review, milestone, custom
  prompt TEXT NOT NULL,
  response TEXT,
  
  -- AI insights from reflection
  ai_insights JSONB DEFAULT '{}',        -- Patterns, growth, suggestions
  
  -- Suggested profile updates
  suggested_updates JSONB DEFAULT '{}',  -- {field: "current_focus", old: "...", new: "...", reason: "..."}
  updates_applied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User goals (tied to profile)
CREATE TABLE IF NOT EXISTS ai_user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Goal details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  why_important TEXT,                    -- Connection to your "why"
  
  -- Categorization
  category VARCHAR(100),                 -- personal, professional, health, relationship, financial, learning
  timeframe VARCHAR(50),                 -- daily, weekly, monthly, quarterly, yearly, life
  
  -- Tracking
  status VARCHAR(50) DEFAULT 'active',   -- active, achieved, paused, abandoned
  progress INTEGER DEFAULT 0,            -- 0-100
  
  -- Milestones
  milestones JSONB DEFAULT '[]',         -- [{title, completed, completed_at}]
  
  -- Reflection
  lessons_learned TEXT,
  
  -- Timestamps
  target_date DATE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation style templates (presets)
CREATE TABLE IF NOT EXISTS ai_conversation_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Can be system (NULL user_id) or user-created
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Style settings
  communication_style VARCHAR(50),
  formality_level VARCHAR(50),
  detail_preference VARCHAR(50),
  emotional_support_level VARCHAR(50),
  challenge_me BOOLEAN,
  use_analogies BOOLEAN,
  use_humor BOOLEAN,
  be_philosophical BOOLEAN,
  action_oriented BOOLEAN,
  
  -- Custom system prompt additions
  custom_instructions TEXT,
  
  -- Usage
  is_default BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_ai_user_profiles_user ON ai_user_profiles(user_id);
CREATE INDEX idx_ai_profile_reflections_user ON ai_profile_reflections(user_id, created_at DESC);
CREATE INDEX idx_ai_user_goals_user ON ai_user_goals(user_id, status);
CREATE INDEX idx_ai_conversation_styles_user ON ai_conversation_styles(user_id);
CREATE INDEX idx_ai_conversation_styles_system ON ai_conversation_styles(user_id) WHERE user_id IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE ai_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_profile_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_styles ENABLE ROW LEVEL SECURITY;

-- Profiles: owner only
CREATE POLICY "ai_user_profiles_owner" ON ai_user_profiles
  FOR ALL USING (user_id = auth.uid());

-- Reflections: owner only
CREATE POLICY "ai_profile_reflections_owner" ON ai_profile_reflections
  FOR ALL USING (user_id = auth.uid());

-- Goals: owner only
CREATE POLICY "ai_user_goals_owner" ON ai_user_goals
  FOR ALL USING (user_id = auth.uid());

-- Conversation styles: owner or system (NULL user_id)
CREATE POLICY "ai_conversation_styles_access" ON ai_conversation_styles
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "ai_conversation_styles_owner" ON ai_conversation_styles
  FOR ALL USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- Seed default conversation styles
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO ai_conversation_styles (
  user_id, name, description, 
  communication_style, formality_level, detail_preference,
  emotional_support_level, challenge_me, use_analogies, 
  use_humor, be_philosophical, action_oriented
) VALUES
  (NULL, 'Executive Coach', 
   'Direct, strategic, focused on outcomes. Pushes you to think bigger.',
   'direct', 'professional', 'brief',
   'minimal', true, false, false, false, true),
   
  (NULL, 'Thoughtful Mentor',
   'Balanced guidance with warmth. Helps you discover answers yourself.',
   'balanced', 'casual', 'moderate',
   'moderate', true, true, false, true, true),
   
  (NULL, 'Creative Partner',
   'Playful, imaginative, explores possibilities. Great for brainstorming.',
   'creative', 'friendly', 'moderate',
   'moderate', false, true, true, false, false),
   
  (NULL, 'Analytical Advisor',
   'Data-driven, thorough, systematic. Helps break down complex problems.',
   'analytical', 'professional', 'detailed',
   'minimal', true, false, false, false, true),
   
  (NULL, 'Supportive Friend',
   'Warm, encouraging, celebratory. Focuses on emotional wellbeing.',
   'nurturing', 'friendly', 'moderate',
   'high', false, true, true, false, false);

-- ════════════════════════════════════════════════════════════════════════════
-- Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_profile ai_user_profiles)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_total INTEGER := 20;
BEGIN
  -- Identity (4 points)
  IF p_profile.preferred_name IS NOT NULL THEN v_score := v_score + 1; END IF;
  IF p_profile.self_description IS NOT NULL THEN v_score := v_score + 1; END IF;
  IF array_length(p_profile.roles, 1) > 0 THEN v_score := v_score + 1; END IF;
  IF p_profile.life_stage IS NOT NULL THEN v_score := v_score + 1; END IF;
  
  -- Purpose (4 points)
  IF p_profile.core_why IS NOT NULL THEN v_score := v_score + 1; END IF;
  IF p_profile.mission_statement IS NOT NULL THEN v_score := v_score + 1; END IF;
  IF p_profile.long_term_vision IS NOT NULL THEN v_score := v_score + 1; END IF;
  IF jsonb_array_length(p_profile.core_values) > 0 THEN v_score := v_score + 1; END IF;
  
  -- Strengths & Growth (4 points)
  IF jsonb_array_length(p_profile.strengths) > 0 THEN v_score := v_score + 1; END IF;
  IF jsonb_array_length(p_profile.growth_areas) > 0 THEN v_score := v_score + 1; END IF;
  IF jsonb_array_length(p_profile.passions) > 0 THEN v_score := v_score + 1; END IF;
  IF array_length(p_profile.expertise_areas, 1) > 0 THEN v_score := v_score + 1; END IF;
  
  -- Current context (4 points)
  IF p_profile.current_focus IS NOT NULL THEN v_score := v_score + 1; END IF;
  IF array_length(p_profile.current_challenges, 1) > 0 THEN v_score := v_score + 1; END IF;
  IF array_length(p_profile.learning_goals, 1) > 0 THEN v_score := v_score + 1; END IF;
  IF p_profile.important_context IS NOT NULL THEN v_score := v_score + 1; END IF;
  
  -- Communication preferences (4 points - auto-filled defaults count)
  v_score := v_score + 4;
  
  RETURN (v_score * 100) / v_total;
END;
$$ LANGUAGE plpgsql;

-- Update completeness on profile change
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness := calculate_profile_completeness(NEW);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_completeness
  BEFORE INSERT OR UPDATE ON ai_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completeness();
