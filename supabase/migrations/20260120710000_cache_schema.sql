-- ═══════════════════════════════════════════════════════════════════════════
-- Semantic Cache Schema
-- Tables for AI response caching with exact and semantic matching
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Cache Configuration
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cache_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL DEFAULT 'Default',
    
    -- Scope
    application_ids JSONB, -- NULL = all
    model_patterns JSONB, -- ['gpt-*', 'claude-*']
    
    -- Cache strategy
    strategy VARCHAR(50) DEFAULT 'hybrid', -- 'exact', 'semantic', 'hybrid'
    
    -- Semantic settings
    similarity_threshold DECIMAL(3,2) DEFAULT 0.95,
    embedding_model VARCHAR(255) DEFAULT 'text-embedding-3-small',
    
    -- TTL
    default_ttl_seconds INTEGER DEFAULT 86400, -- 24 hours
    max_ttl_seconds INTEGER DEFAULT 604800, -- 7 days
    
    -- Determinism knobs
    cache_when_temperature_lte DECIMAL(3,2) DEFAULT 0.5,
    cache_when_output_validated BOOLEAN DEFAULT false,
    
    -- Exclusions
    exclude_models JSONB, -- Models to never cache
    exclude_pii BOOLEAN DEFAULT true, -- Don't cache PII requests
    
    -- Size limits
    max_entries INTEGER DEFAULT 100000,
    max_response_size_bytes INTEGER DEFAULT 100000,
    
    -- Behavior
    cache_errors BOOLEAN DEFAULT false,
    respect_no_cache BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Cache Entries
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cache_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    config_id UUID REFERENCES cache_configs(id) ON DELETE SET NULL,
    
    -- Key
    cache_key VARCHAR(64) NOT NULL, -- SHA-256 hash for exact match
    scope_hash VARCHAR(64) NOT NULL, -- Hash of scope (tenant+prompt_ver+kb_ver+model+app)
    
    -- Request signature
    model VARCHAR(255) NOT NULL,
    system_prompt_hash VARCHAR(64),
    messages_hash VARCHAR(64) NOT NULL,
    parameters_hash VARCHAR(64) NOT NULL,
    
    -- For semantic search
    embedding vector(1536), -- Embedding of user message
    user_message_preview TEXT, -- First N chars for display
    
    -- Cached response
    response_content TEXT NOT NULL,
    response_metadata JSONB, -- {tokens, finish_reason, model, etc.}
    
    -- Costs saved info
    original_tokens INTEGER DEFAULT 0,
    original_cost_usd DECIMAL(10,6) DEFAULT 0,
    
    -- TTL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_hit_at TIMESTAMPTZ,
    hit_count INTEGER DEFAULT 0,
    
    -- Status
    is_valid BOOLEAN DEFAULT true,
    
    -- Unique constraint for upsert
    UNIQUE(tenant_id, cache_key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Cache Invalidation Rules
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cache_invalidation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    config_id UUID REFERENCES cache_configs(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    
    -- Trigger
    trigger_type VARCHAR(50) NOT NULL, -- 'prompt_change', 'kb_update', 'model_change', 'schedule', 'manual'
    
    -- For prompt_change
    prompt_ids JSONB,
    
    -- For kb_update
    kb_ids JSONB,
    
    -- For schedule
    schedule_cron VARCHAR(100),
    
    -- Action
    invalidation_scope VARCHAR(50) DEFAULT 'matching', -- 'all', 'matching'
    matching_criteria JSONB, -- {models: [], applications: []}
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Cache Invalidation Events (audit log)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cache_invalidation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    trigger VARCHAR(50) NOT NULL,
    scope JSONB NOT NULL,
    entries_invalidated INTEGER DEFAULT 0,
    hard_delete BOOLEAN DEFAULT false,
    
    rule_id UUID REFERENCES cache_invalidation_rules(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Cache Metrics (aggregated for dashboards)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cache_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    config_id UUID REFERENCES cache_configs(id),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL, -- 'hour', 'day', 'week'
    
    -- Hit/miss
    total_requests INTEGER DEFAULT 0,
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    hit_rate DECIMAL(5,4),
    
    -- Savings
    tokens_saved BIGINT DEFAULT 0,
    cost_saved DECIMAL(12,4) DEFAULT 0,
    latency_saved_ms BIGINT DEFAULT 0,
    
    -- Performance
    avg_lookup_latency_ms INTEGER,
    avg_embedding_latency_ms INTEGER,
    
    -- Semantic vs exact
    exact_hits INTEGER DEFAULT 0,
    semantic_hits INTEGER DEFAULT 0,
    avg_similarity_score DECIMAL(4,3),
    
    -- Entry counts
    total_entries INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, config_id, bucket_timestamp, bucket_interval)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Cache Warming Jobs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cache_warming_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    config_id UUID REFERENCES cache_configs(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Source
    source_type VARCHAR(50) NOT NULL, -- 'query_list', 'historical', 'prompt_variations'
    source_config JSONB NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    
    -- Progress
    total_queries INTEGER,
    processed_queries INTEGER DEFAULT 0,
    cached_responses INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- Cache entries indexes
CREATE INDEX IF NOT EXISTS idx_cache_entries_tenant_key 
    ON cache_entries(tenant_id, cache_key) 
    WHERE is_valid = true;
    
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires 
    ON cache_entries(expires_at) 
    WHERE is_valid = true;
    
CREATE INDEX IF NOT EXISTS idx_cache_entries_scope 
    ON cache_entries(tenant_id, scope_hash, model);

-- Vector index for semantic search (IVFFlat for speed)
CREATE INDEX IF NOT EXISTS idx_cache_entries_embedding 
    ON cache_entries USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_cache_configs_tenant 
    ON cache_configs(tenant_id);
    
CREATE INDEX IF NOT EXISTS idx_cache_invalidation_rules_tenant 
    ON cache_invalidation_rules(tenant_id);
    
CREATE INDEX IF NOT EXISTS idx_cache_metrics_tenant 
    ON cache_metrics(tenant_id, bucket_timestamp DESC);
    
CREATE INDEX IF NOT EXISTS idx_cache_warming_jobs_tenant 
    ON cache_warming_jobs(tenant_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE cache_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_invalidation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_invalidation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_warming_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cache_configs_tenant_isolation" ON cache_configs
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "cache_entries_tenant_isolation" ON cache_entries
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "cache_invalidation_rules_tenant_isolation" ON cache_invalidation_rules
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "cache_invalidation_events_tenant_isolation" ON cache_invalidation_events
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "cache_metrics_tenant_isolation" ON cache_metrics
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "cache_warming_jobs_tenant_isolation" ON cache_warming_jobs
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper Functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Semantic search function for cache lookup
CREATE OR REPLACE FUNCTION search_cache_semantic(
    p_tenant_id UUID,
    p_scope_hash VARCHAR(64),
    p_embedding vector(1536),
    p_threshold DECIMAL(3,2) DEFAULT 0.95,
    p_limit INTEGER DEFAULT 1
)
RETURNS TABLE(
    id UUID,
    cache_key VARCHAR(64),
    response_content TEXT,
    response_metadata JSONB,
    hit_count INTEGER,
    similarity DECIMAL(4,3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.cache_key,
        ce.response_content,
        ce.response_metadata,
        ce.hit_count,
        (1 - (ce.embedding <=> p_embedding))::DECIMAL(4,3) as similarity
    FROM cache_entries ce
    WHERE ce.tenant_id = p_tenant_id
      AND ce.scope_hash = p_scope_hash
      AND ce.is_valid = true
      AND ce.expires_at > NOW()
      AND ce.embedding IS NOT NULL
      AND (1 - (ce.embedding <=> p_embedding)) >= p_threshold
    ORDER BY ce.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update cache metrics (called by background job)
CREATE OR REPLACE FUNCTION update_cache_metrics(
    p_tenant_id UUID,
    p_interval VARCHAR(20) DEFAULT 'hour'
)
RETURNS VOID AS $$
DECLARE
    v_bucket_timestamp TIMESTAMPTZ;
    v_total_entries INTEGER;
    v_total_hits BIGINT;
    v_exact_hits BIGINT;
    v_semantic_hits BIGINT;
BEGIN
    -- Determine bucket timestamp
    IF p_interval = 'hour' THEN
        v_bucket_timestamp := date_trunc('hour', NOW());
    ELSIF p_interval = 'day' THEN
        v_bucket_timestamp := date_trunc('day', NOW());
    ELSE
        v_bucket_timestamp := date_trunc('week', NOW());
    END IF;
    
    -- Count entries
    SELECT COUNT(*) INTO v_total_entries
    FROM cache_entries
    WHERE tenant_id = p_tenant_id AND is_valid = true;
    
    -- Sum hits
    SELECT COALESCE(SUM(hit_count), 0) INTO v_total_hits
    FROM cache_entries
    WHERE tenant_id = p_tenant_id;
    
    -- Upsert metrics
    INSERT INTO cache_metrics (
        tenant_id,
        bucket_timestamp,
        bucket_interval,
        total_entries
    ) VALUES (
        p_tenant_id,
        v_bucket_timestamp,
        p_interval,
        v_total_entries
    )
    ON CONFLICT (tenant_id, config_id, bucket_timestamp, bucket_interval)
    DO UPDATE SET
        total_entries = EXCLUDED.total_entries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired cache entries (called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_cache_entries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM cache_entries
        WHERE expires_at < NOW()
           OR (is_valid = false AND created_at < NOW() - INTERVAL '7 days')
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
