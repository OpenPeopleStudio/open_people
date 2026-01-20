-- ════════════════════════════════════════════════════════════════════════════
-- Add project context to AI conversations
-- Allows linking chats to projects so notes/facts created from chat attach
-- ════════════════════════════════════════════════════════════════════════════

-- Add project_id to ai_conversations
ALTER TABLE ai_conversations 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Index for quick lookup of conversations by project
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project ON ai_conversations(project_id) 
WHERE project_id IS NOT NULL;

-- Comment explaining the column
COMMENT ON COLUMN ai_conversations.project_id IS 
  'Optional project context. When set, notes/facts created from this chat will be linked to this project.';
