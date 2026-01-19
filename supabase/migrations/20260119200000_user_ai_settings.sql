-- ════════════════════════════════════════════════════════════════════════════
-- User AI Settings Schema
-- Store per-user AI provider configurations
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Settings stored as JSONB for flexibility
  -- Contains: defaultProvider, providers[], fallbackToOpenAI, etc.
  settings JSONB NOT NULL DEFAULT '{
    "defaultProvider": "openai",
    "providers": [],
    "fallbackToOpenAI": true,
    "preferLocalForSimpleTasks": false,
    "useOpenAIForEmbeddings": true
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX idx_user_ai_settings_user ON user_ai_settings(user_id);

-- Enable RLS
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "user_ai_settings_owner" ON user_ai_settings
  FOR ALL USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_ai_settings_updated_at
  BEFORE UPDATE ON user_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_settings_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- Add provider tracking to AI messages
-- ════════════════════════════════════════════════════════════════════════════

-- Add column to track which provider was used for each message
ALTER TABLE ai_messages 
ADD COLUMN IF NOT EXISTS provider_used VARCHAR(100),
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 6) DEFAULT 0;

-- Comment on columns
COMMENT ON TABLE user_ai_settings IS 'Per-user AI provider configurations (OpenAI, LLM Studio, Ollama, etc.)';
COMMENT ON COLUMN user_ai_settings.settings IS 'JSONB containing: defaultProvider, providers[], fallbackToOpenAI, preferLocalForSimpleTasks, useOpenAIForEmbeddings';
COMMENT ON COLUMN ai_messages.provider_used IS 'Which AI provider generated this response (openai, llmstudio, ollama, etc.)';
COMMENT ON COLUMN ai_messages.estimated_cost IS 'Estimated cost in USD for this message (0 for local models)';
