-- ════════════════════════════════════════════════════════════════════════════
-- AI Chat & Memory Schema
-- Persistent conversations with full context and learning
-- ════════════════════════════════════════════════════════════════════════════

-- Chat conversations (threads)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identification
  title VARCHAR(500),
  slug VARCHAR(500),
  
  -- Context settings
  system_prompt TEXT,                   -- Custom system prompt for this conversation
  model VARCHAR(100) DEFAULT 'gpt-4o',  -- Model to use
  temperature DECIMAL(2,1) DEFAULT 0.7,
  
  -- Attached context
  attached_notes UUID[] DEFAULT '{}',   -- Note IDs to include as context
  attached_files UUID[] DEFAULT '{}',   -- Vault file IDs to include
  attached_folders UUID[] DEFAULT '{}', -- Folder IDs (all files in folder)
  
  -- Memory settings
  use_memory BOOLEAN DEFAULT true,      -- Include relevant memories
  memory_threshold DECIMAL(3,2) DEFAULT 0.7, -- Similarity threshold for memory retrieval
  
  -- Stats
  message_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  
  -- Status
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Chat messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  -- Message content
  role VARCHAR(20) NOT NULL,            -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  
  -- For assistant messages: why it said what it said
  reasoning TEXT,                       -- Internal reasoning/thinking
  confidence DECIMAL(3,2),              -- How confident the AI was
  sources JSONB DEFAULT '[]',           -- What context was used [{type, id, excerpt}]
  
  -- For user messages: metadata
  edited BOOLEAN DEFAULT false,
  original_content TEXT,                -- If edited, store original
  
  -- Token usage
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memory store (learnings extracted from conversations)
CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Memory content
  content TEXT NOT NULL,                -- The memory/learning
  summary TEXT,                         -- Short summary for display
  
  -- Source tracking
  source_conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  source_message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  source_type VARCHAR(50),              -- 'conversation', 'manual', 'note', 'file'
  
  -- Categorization
  category VARCHAR(100),                -- 'preference', 'fact', 'instruction', 'context'
  tags TEXT[] DEFAULT '{}',
  
  -- For semantic search (embedding stored as vector)
  embedding vector(1536),               -- OpenAI embedding
  
  -- Importance
  importance DECIMAL(3,2) DEFAULT 0.5,  -- 0-1 scale
  access_count INTEGER DEFAULT 0,       -- How often this memory is retrieved
  last_accessed_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context snapshots (what context was provided for each message)
CREATE TABLE IF NOT EXISTS ai_context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  
  -- What was included
  included_notes JSONB DEFAULT '[]',    -- [{id, title, excerpt}]
  included_files JSONB DEFAULT '[]',    -- [{id, filename, summary}]
  included_memories JSONB DEFAULT '[]', -- [{id, content, similarity}]
  
  -- Full context sent to model
  full_context TEXT,                    -- The actual context string sent
  context_tokens INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat attachments (files/images attached to specific messages)
CREATE TABLE IF NOT EXISTS ai_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  
  -- Attachment details
  attachment_type VARCHAR(50) NOT NULL, -- 'image', 'file', 'code', 'link'
  filename VARCHAR(500),
  content_type VARCHAR(255),
  
  -- Content (for small items) or reference
  content TEXT,                         -- For code snippets, links
  vault_file_id UUID REFERENCES vault_files(id) ON DELETE SET NULL,
  storage_url TEXT,                     -- For images uploaded to chat
  
  -- AI analysis of attachment
  ai_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved prompts (reusable prompts/templates)
CREATE TABLE IF NOT EXISTS ai_saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  
  -- Categorization
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- Usage
  use_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ════════════════════════════════════════════════════════════════════════════

-- Conversations
CREATE INDEX idx_ai_conversations_owner ON ai_conversations(owner_id);
CREATE INDEX idx_ai_conversations_updated ON ai_conversations(updated_at DESC);
CREATE INDEX idx_ai_conversations_pinned ON ai_conversations(is_pinned) WHERE is_pinned = true;

-- Messages
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_messages_role ON ai_messages(conversation_id, role);

-- Memories
CREATE INDEX idx_ai_memories_owner ON ai_memories(owner_id);
CREATE INDEX idx_ai_memories_category ON ai_memories(owner_id, category);
CREATE INDEX idx_ai_memories_active ON ai_memories(owner_id, is_active) WHERE is_active = true;
CREATE INDEX idx_ai_memories_embedding ON ai_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Context snapshots
CREATE INDEX idx_ai_context_snapshots_message ON ai_context_snapshots(message_id);

-- Attachments
CREATE INDEX idx_ai_message_attachments_message ON ai_message_attachments(message_id);

-- Saved prompts
CREATE INDEX idx_ai_saved_prompts_owner ON ai_saved_prompts(owner_id);

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_saved_prompts ENABLE ROW LEVEL SECURITY;

-- Conversations: owner only
CREATE POLICY "ai_conversations_owner" ON ai_conversations
  FOR ALL USING (owner_id = auth.uid());

-- Messages: owner of conversation
CREATE POLICY "ai_messages_owner" ON ai_messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM ai_conversations WHERE owner_id = auth.uid())
  );

-- Memories: owner only
CREATE POLICY "ai_memories_owner" ON ai_memories
  FOR ALL USING (owner_id = auth.uid());

-- Context snapshots: owner of message's conversation
CREATE POLICY "ai_context_snapshots_owner" ON ai_context_snapshots
  FOR ALL USING (
    message_id IN (
      SELECT m.id FROM ai_messages m
      JOIN ai_conversations c ON m.conversation_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Attachments: owner of message's conversation
CREATE POLICY "ai_message_attachments_owner" ON ai_message_attachments
  FOR ALL USING (
    message_id IN (
      SELECT m.id FROM ai_messages m
      JOIN ai_conversations c ON m.conversation_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Saved prompts: owner only
CREATE POLICY "ai_saved_prompts_owner" ON ai_saved_prompts
  FOR ALL USING (owner_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Update conversation stats on new message
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET 
    message_count = message_count + 1,
    token_count = token_count + COALESCE(NEW.total_tokens, 0),
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_stats
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- Auto-generate conversation title from first message
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conv RECORD;
BEGIN
  SELECT * INTO v_conv FROM ai_conversations WHERE id = NEW.conversation_id;
  
  -- Only set title if it's the first user message and title is null
  IF v_conv.title IS NULL AND NEW.role = 'user' THEN
    UPDATE ai_conversations
    SET title = substring(NEW.content from 1 for 100)
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_title_conversation
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_title_conversation();

-- Search memories by similarity (requires pgvector)
CREATE OR REPLACE FUNCTION search_memories(
  p_owner_id UUID,
  p_embedding vector(1536),
  p_threshold DECIMAL DEFAULT 0.7,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  summary TEXT,
  category VARCHAR,
  similarity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.summary,
    m.category,
    (1 - (m.embedding <=> p_embedding))::DECIMAL as similarity
  FROM ai_memories m
  WHERE m.owner_id = p_owner_id
    AND m.is_active = true
    AND (1 - (m.embedding <=> p_embedding)) >= p_threshold
  ORDER BY m.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Extract and store memory from conversation
CREATE OR REPLACE FUNCTION increment_memory_access(p_memory_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_memories
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = p_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- Enable pgvector extension (for embeddings)
-- ════════════════════════════════════════════════════════════════════════════

-- Note: This requires pgvector to be installed on the database
-- Run this manually if not already enabled:
-- CREATE EXTENSION IF NOT EXISTS vector;
