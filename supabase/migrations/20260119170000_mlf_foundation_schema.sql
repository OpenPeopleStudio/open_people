-- ════════════════════════════════════════════════════════════════════════════
-- MINIMUM LOVABLE FOUNDATION (MLF)
-- Core infrastructure for a production-ready AI-native platform
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- PART 1: TENANT MEMBERSHIPS (Multi-workspace support)
-- ════════════════════════════════════════════════════════════════════════════

-- Allow users to belong to multiple tenants/workspaces
CREATE TABLE IF NOT EXISTS tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Role within this tenant
  role VARCHAR(50) NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer
  
  -- Permissions (can override role defaults)
  permissions JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, suspended, pending
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

-- Tenant invitations
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Invitation details
  email VARCHAR(500) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}',
  
  -- Token for accepting
  token VARCHAR(255) NOT NULL UNIQUE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',  -- pending, accepted, expired, revoked
  
  -- Tracking
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 2: UNIFIED ACTIVITY LEDGER
-- ════════════════════════════════════════════════════════════════════════════

-- Centralized activity log for all actions across the platform
CREATE TABLE IF NOT EXISTS activity_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID,  -- Optional: for workspace-specific activities
  
  -- Actor
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type VARCHAR(50) NOT NULL DEFAULT 'user',  -- user, system, ai, api
  actor_metadata JSONB DEFAULT '{}',  -- email, name, ip, user_agent, api_key_id
  
  -- Action
  action VARCHAR(100) NOT NULL,  -- resource.verb (e.g., 'file.upload', 'chat.send', 'memory.create')
  action_category VARCHAR(50),  -- auth, data, ai, admin, security
  
  -- Resource
  resource_type VARCHAR(100),  -- file, folder, conversation, message, memory, note, etc.
  resource_id UUID,
  resource_name VARCHAR(500),
  
  -- Change tracking
  changes JSONB,  -- {before: {...}, after: {...}} for auditable changes
  
  -- Context
  context JSONB DEFAULT '{}',  -- Additional context (conversation_id, parent_action, etc.)
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_code VARCHAR(100),
  error_message TEXT,
  
  -- Request metadata
  request_id UUID,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Removed generated column tenant_month due to immutability requirements.
-- Use the index below for time-based partitioning queries instead.

-- Activity ledger indexes
CREATE INDEX idx_activity_ledger_tenant_time ON activity_ledger(tenant_id, created_at DESC);
CREATE INDEX idx_activity_ledger_actor ON activity_ledger(actor_id, created_at DESC);
CREATE INDEX idx_activity_ledger_resource ON activity_ledger(resource_type, resource_id);
CREATE INDEX idx_activity_ledger_action ON activity_ledger(action, created_at DESC);
CREATE INDEX idx_activity_ledger_category ON activity_ledger(action_category, created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 3: KNOWLEDGE STORE (Documents with embeddings and citations)
-- ════════════════════════════════════════════════════════════════════════════

-- Knowledge documents (markdown, text, structured data)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Document info
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500),
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'markdown',  -- markdown, text, json
  
  -- Source tracking
  source_type VARCHAR(100),  -- manual, imported, extracted, generated
  source_id UUID,  -- Reference to original (file, note, etc.)
  source_url TEXT,
  
  -- Categorization
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',  -- active, archived, pending_review
  visibility VARCHAR(50) DEFAULT 'private',  -- private, tenant, public
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  word_count INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge chunks (for RAG retrieval)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  
  -- Chunk content
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,  -- Order within document
  
  -- Position in source
  start_char INTEGER,
  end_char INTEGER,
  
  -- Embedding for semantic search
  embedding vector(1536),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  token_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge citations (tracking what was used and where)
CREATE TABLE IF NOT EXISTS knowledge_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What used the knowledge
  citing_type VARCHAR(50) NOT NULL,  -- ai_message, note, document
  citing_id UUID NOT NULL,
  
  -- What was cited
  chunk_id UUID NOT NULL REFERENCES knowledge_chunks(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  
  -- Citation details
  relevance_score DECIMAL(4,3),  -- 0-1 similarity score
  excerpt TEXT,  -- The specific text that was cited
  
  -- How it was used
  usage_type VARCHAR(50),  -- context, reference, quote
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge chunks embedding index
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_documents_owner ON knowledge_documents(owner_id);
CREATE INDEX idx_knowledge_documents_tenant ON knowledge_documents(tenant_id);
CREATE INDEX idx_knowledge_citations_citing ON knowledge_citations(citing_type, citing_id);
CREATE INDEX idx_knowledge_citations_chunk ON knowledge_citations(chunk_id);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 4: AI RUN TRACES (Explainability)
-- ════════════════════════════════════════════════════════════════════════════

-- AI runs (each invocation of the AI)
CREATE TABLE IF NOT EXISTS ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  
  -- Run identification
  run_type VARCHAR(100) NOT NULL,  -- chat, completion, embedding, analysis, extraction
  parent_run_id UUID REFERENCES ai_runs(id),  -- For nested/chained runs
  
  -- Model info
  model VARCHAR(100) NOT NULL,
  model_version VARCHAR(100),
  provider VARCHAR(50),  -- openai, anthropic, etc.
  
  -- Input
  input_type VARCHAR(50),  -- messages, text, image
  input_preview TEXT,  -- First 500 chars for quick reference
  input_tokens INTEGER,
  
  -- System prompt and context
  system_prompt TEXT,
  context_summary TEXT,  -- Summary of what context was provided
  
  -- Output
  output_preview TEXT,  -- First 500 chars
  output_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Context used (detailed breakdown)
  context_used JSONB DEFAULT '{}',  -- {memories: [], notes: [], files: [], chunks: []}
  
  -- Why it said what it said
  reasoning TEXT,  -- If model provides reasoning/thinking
  confidence DECIMAL(3,2),
  
  -- Safety and moderation
  safety_flags JSONB DEFAULT '{}',  -- Any safety/moderation flags
  was_filtered BOOLEAN DEFAULT false,
  filter_reason TEXT,
  
  -- Performance
  latency_ms INTEGER,
  time_to_first_token_ms INTEGER,
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(10,6),
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed',  -- pending, streaming, completed, failed, cancelled
  error_code VARCHAR(100),
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI run context items (detailed log of each context item used)
CREATE TABLE IF NOT EXISTS ai_run_context_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES ai_runs(id) ON DELETE CASCADE,
  
  -- Source
  source_type VARCHAR(50) NOT NULL,  -- memory, note, file, chunk, entity
  source_id UUID,
  source_name VARCHAR(500),
  
  -- Content
  content_preview TEXT,  -- What was actually sent
  token_count INTEGER,
  
  -- Relevance
  relevance_score DECIMAL(4,3),
  selection_reason VARCHAR(255),  -- Why this was included
  
  -- Position in context
  context_position INTEGER,  -- Order in the context
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI run indexes
CREATE INDEX idx_ai_runs_owner ON ai_runs(owner_id, created_at DESC);
CREATE INDEX idx_ai_runs_tenant ON ai_runs(tenant_id, created_at DESC);
CREATE INDEX idx_ai_runs_conversation ON ai_runs(conversation_id);
CREATE INDEX idx_ai_runs_type ON ai_runs(run_type, created_at DESC);
CREATE INDEX idx_ai_runs_status ON ai_runs(status) WHERE status != 'completed';
CREATE INDEX idx_ai_run_context_items_run ON ai_run_context_items(run_id);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 5: ENHANCED MEMORY (Separate facts from raw chat)
-- ════════════════════════════════════════════════════════════════════════════

-- Knowledge facts (extracted, verified information)
CREATE TABLE IF NOT EXISTS knowledge_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Fact content
  fact TEXT NOT NULL,  -- The factual statement
  fact_type VARCHAR(100) NOT NULL,  -- user_preference, project_detail, business_rule, contact, date, etc.
  
  -- Subject (what/who this fact is about)
  subject_type VARCHAR(100),  -- user, project, person, company, system
  subject_id UUID,
  subject_name VARCHAR(255),
  
  -- Confidence and verification
  confidence DECIMAL(3,2) DEFAULT 0.8,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Temporal bounds (when is this fact valid)
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT true,
  
  -- Source tracking
  source_type VARCHAR(50) NOT NULL,  -- conversation, manual, import, extraction
  source_id UUID,
  source_excerpt TEXT,  -- The text this was extracted from
  
  -- For semantic search
  embedding vector(1536),
  
  -- Categorization
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- Importance and usage
  importance DECIMAL(3,2) DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fact contradictions (when facts conflict)
CREATE TABLE IF NOT EXISTS fact_contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  fact_id UUID NOT NULL REFERENCES knowledge_facts(id) ON DELETE CASCADE,
  contradicts_fact_id UUID NOT NULL REFERENCES knowledge_facts(id) ON DELETE CASCADE,
  
  -- Contradiction details
  contradiction_type VARCHAR(50),  -- direct, temporal, conditional
  description TEXT,
  
  -- Resolution
  resolution_status VARCHAR(50) DEFAULT 'unresolved',  -- unresolved, resolved, ignored
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Fact indexes
CREATE INDEX idx_knowledge_facts_owner ON knowledge_facts(owner_id, is_active) WHERE is_active = true;
CREATE INDEX idx_knowledge_facts_tenant ON knowledge_facts(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_knowledge_facts_type ON knowledge_facts(fact_type, owner_id);
CREATE INDEX idx_knowledge_facts_subject ON knowledge_facts(subject_type, subject_id);
CREATE INDEX idx_knowledge_facts_embedding ON knowledge_facts 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 6: CONTEXT ENTITIES (Toggleable context sources)
-- ════════════════════════════════════════════════════════════════════════════

-- Entities that can be referenced in context
CREATE TABLE IF NOT EXISTS context_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Entity info
  entity_type VARCHAR(100) NOT NULL,  -- person, company, project, product, concept
  name VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Structured data
  properties JSONB DEFAULT '{}',  -- Type-specific properties
  
  -- Relationships
  related_entities JSONB DEFAULT '[]',  -- [{id, type, relationship}]
  
  -- For semantic search
  embedding vector(1536),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context presets (saved combinations of context)
CREATE TABLE IF NOT EXISTS context_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preset info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- What's included
  included_notes UUID[] DEFAULT '{}',
  included_files UUID[] DEFAULT '{}',
  included_folders UUID[] DEFAULT '{}',
  included_entities UUID[] DEFAULT '{}',
  included_documents UUID[] DEFAULT '{}',  -- Knowledge documents
  
  -- Settings
  use_facts BOOLEAN DEFAULT true,
  use_memories BOOLEAN DEFAULT true,
  fact_types TEXT[] DEFAULT '{}',  -- Empty = all types
  memory_categories TEXT[] DEFAULT '{}',  -- Empty = all categories
  
  -- Usage
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_context_entities_owner ON context_entities(owner_id);
CREATE INDEX idx_context_entities_type ON context_entities(entity_type, owner_id);
CREATE INDEX idx_context_entities_embedding ON context_entities 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_context_presets_owner ON context_presets(owner_id);

-- ════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_run_context_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_presets ENABLE ROW LEVEL SECURITY;

-- Tenant memberships: user can see their own, admins can see all in tenant
CREATE POLICY "tenant_memberships_user" ON tenant_memberships
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tenant_memberships_admin" ON tenant_memberships
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Invitations: tenant admins only
CREATE POLICY "tenant_invitations_admin" ON tenant_invitations
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Activity ledger: tenant members can read their tenant's activities
CREATE POLICY "activity_ledger_tenant" ON activity_ledger
  FOR SELECT USING (
    tenant_id IS NULL OR
    tenant_id IN (SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid())
  );

-- Activity ledger: system can insert
CREATE POLICY "activity_ledger_insert" ON activity_ledger
  FOR INSERT WITH CHECK (true);

-- Knowledge documents: owner or tenant members
CREATE POLICY "knowledge_documents_owner" ON knowledge_documents
  FOR ALL USING (
    owner_id = auth.uid() OR
    (tenant_id IS NOT NULL AND tenant_id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
    ))
  );

-- Knowledge chunks: through documents
CREATE POLICY "knowledge_chunks_owner" ON knowledge_chunks
  FOR ALL USING (
    document_id IN (
      SELECT id FROM knowledge_documents 
      WHERE owner_id = auth.uid() OR
        (tenant_id IS NOT NULL AND tenant_id IN (
          SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
        ))
    )
  );

-- Citations: through chunks
CREATE POLICY "knowledge_citations_owner" ON knowledge_citations
  FOR ALL USING (
    chunk_id IN (SELECT kc.id FROM knowledge_chunks kc
      JOIN knowledge_documents kd ON kc.document_id = kd.id
      WHERE kd.owner_id = auth.uid())
  );

-- AI runs: owner only
CREATE POLICY "ai_runs_owner" ON ai_runs
  FOR ALL USING (owner_id = auth.uid());

-- AI run context items: through runs
CREATE POLICY "ai_run_context_items_owner" ON ai_run_context_items
  FOR ALL USING (
    run_id IN (SELECT id FROM ai_runs WHERE owner_id = auth.uid())
  );

-- Knowledge facts: owner only
CREATE POLICY "knowledge_facts_owner" ON knowledge_facts
  FOR ALL USING (owner_id = auth.uid());

-- Fact contradictions: through facts
CREATE POLICY "fact_contradictions_owner" ON fact_contradictions
  FOR ALL USING (
    fact_id IN (SELECT id FROM knowledge_facts WHERE owner_id = auth.uid())
  );

-- Context entities: owner only
CREATE POLICY "context_entities_owner" ON context_entities
  FOR ALL USING (owner_id = auth.uid());

-- Context presets: owner only
CREATE POLICY "context_presets_owner" ON context_presets
  FOR ALL USING (owner_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Log activity (utility function)
CREATE OR REPLACE FUNCTION log_activity(
  p_tenant_id UUID,
  p_actor_id UUID,
  p_action VARCHAR(100),
  p_resource_type VARCHAR(100) DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_resource_name VARCHAR(500) DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_context JSONB DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activity_ledger (
    tenant_id, actor_id, action, resource_type, resource_id, 
    resource_name, changes, context, success, error_message
  ) VALUES (
    p_tenant_id, p_actor_id, p_action, p_resource_type, p_resource_id,
    p_resource_name, p_changes, p_context, p_success, p_error_message
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search knowledge chunks by similarity
CREATE OR REPLACE FUNCTION search_knowledge(
  p_owner_id UUID,
  p_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title VARCHAR,
  content TEXT,
  similarity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id as chunk_id,
    kd.id as document_id,
    kd.title as document_title,
    kc.content,
    (1 - (kc.embedding <=> p_embedding))::DECIMAL as similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE kd.owner_id = p_owner_id
    AND kd.status = 'active'
    AND (1 - (kc.embedding <=> p_embedding)) >= p_threshold
  ORDER BY kc.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search facts by similarity
CREATE OR REPLACE FUNCTION search_facts(
  p_owner_id UUID,
  p_embedding vector(1536),
  p_limit INTEGER DEFAULT 10,
  p_threshold DECIMAL DEFAULT 0.7,
  p_fact_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  fact_id UUID,
  fact TEXT,
  fact_type VARCHAR,
  subject_name VARCHAR,
  confidence DECIMAL,
  similarity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kf.id as fact_id,
    kf.fact,
    kf.fact_type,
    kf.subject_name,
    kf.confidence,
    (1 - (kf.embedding <=> p_embedding))::DECIMAL as similarity
  FROM knowledge_facts kf
  WHERE kf.owner_id = p_owner_id
    AND kf.is_active = true
    AND kf.is_current = true
    AND (p_fact_types IS NULL OR kf.fact_type = ANY(p_fact_types))
    AND (1 - (kf.embedding <=> p_embedding)) >= p_threshold
  ORDER BY kf.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's tenant memberships
CREATE OR REPLACE FUNCTION get_user_tenants(p_user_id UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name VARCHAR,
  tenant_slug VARCHAR,
  role VARCHAR,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug as tenant_slug,
    tm.role,
    tm.status
  FROM tenant_memberships tm
  JOIN tenants t ON tm.tenant_id = t.id
  WHERE tm.user_id = p_user_id
    AND tm.status = 'active'
    AND t.status = 'active'
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment fact access
CREATE OR REPLACE FUNCTION increment_fact_access(p_fact_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE knowledge_facts
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = p_fact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record citation
CREATE OR REPLACE FUNCTION record_citation(
  p_citing_type VARCHAR(50),
  p_citing_id UUID,
  p_chunk_id UUID,
  p_relevance_score DECIMAL DEFAULT NULL,
  p_excerpt TEXT DEFAULT NULL,
  p_usage_type VARCHAR(50) DEFAULT 'context'
)
RETURNS UUID AS $$
DECLARE
  v_citation_id UUID;
  v_document_id UUID;
BEGIN
  -- Get document_id from chunk
  SELECT document_id INTO v_document_id FROM knowledge_chunks WHERE id = p_chunk_id;
  
  INSERT INTO knowledge_citations (
    citing_type, citing_id, chunk_id, document_id,
    relevance_score, excerpt, usage_type
  ) VALUES (
    p_citing_type, p_citing_id, p_chunk_id, v_document_id,
    p_relevance_score, p_excerpt, p_usage_type
  ) RETURNING id INTO v_citation_id;
  
  RETURN v_citation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
