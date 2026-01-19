# Semantic Caching Layer

> **Priority:** P1 - High  
> **Category:** Developer Experience  
> **Status:** Planned

## Overview

Intelligent caching for AI responses based on semantic similarity, reducing costs and latency by reusing responses for similar queries.

## Problem Statement

AI API calls are expensive and slow:
- Repeated similar queries waste money
- High latency impacts user experience
- Identical requests hit APIs unnecessarily
- No easy way to leverage past responses

Semantic caching can reduce costs by 20-40% while improving latency.

## User Stories

### As a Developer
- I want automatic caching without code changes
- I want to understand cache hit rates
- I want to control caching behavior

### As a Finance Manager
- I want to reduce AI costs
- I want to see savings from caching
- I want to optimize cache investment

### As an SRE
- I want faster AI responses
- I want to reduce provider dependency
- I want cache health monitoring

### As a Product Manager
- I want consistent responses for similar queries
- I want to balance freshness vs speed
- I want to test caching impact

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Semantic Cache                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Request ──▶ [Embed] ──▶ [Search] ──▶ Cache Hit? ──▶ Return
│                              │                               │
│                              ▼ Miss                          │
│                          [AI Call]                           │
│                              │                               │
│                              ▼                               │
│                    [Store in Cache]                          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Embedding  │  │   Vector    │  │     TTL     │         │
│  │   Model     │  │    Store    │  │   Manager   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Cache Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| Exact Match | Hash-based exact matching | Identical requests |
| Semantic | Embedding similarity | Similar questions |
| Hybrid | Exact + Semantic | General purpose |

### Components

1. **Cache Key Generator** - Create cache keys from requests
2. **Embedding Service** - Generate embeddings for semantic search
3. **Vector Store** - Store and search cached responses
4. **TTL Manager** - Handle cache expiration
5. **Cache Warmer** - Pre-populate cache
6. **Analytics** - Cache performance metrics

## Database Schema

```sql
-- Semantic Caching Schema

-- Cache configuration
CREATE TABLE cache_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
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
    
    -- Size limits
    max_entries INTEGER DEFAULT 100000,
    max_response_size_bytes INTEGER DEFAULT 100000,
    
    -- Behavior
    cache_errors BOOLEAN DEFAULT false,
    respect_no_cache BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache entries
CREATE TABLE cache_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    config_id UUID REFERENCES cache_configs(id),
    
    -- Key
    cache_key VARCHAR(64) NOT NULL, -- Hash for exact match
    
    -- Request signature
    model VARCHAR(255) NOT NULL,
    system_prompt_hash VARCHAR(64),
    messages_hash VARCHAR(64),
    parameters_hash VARCHAR(64),
    
    -- For semantic search
    embedding VECTOR(1536), -- Embedding of user message
    user_message_preview TEXT, -- First N chars for display
    
    -- Cached response
    response_content TEXT NOT NULL,
    response_metadata JSONB, -- {tokens, finish_reason, etc.}
    
    -- Costs saved info
    original_tokens INTEGER,
    original_cost DECIMAL(10,6),
    
    -- TTL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_hit_at TIMESTAMPTZ,
    hit_count INTEGER DEFAULT 0,
    
    -- Status
    is_valid BOOLEAN DEFAULT true
);

-- Cache invalidation rules
CREATE TABLE cache_invalidation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES cache_configs(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    
    -- Trigger
    trigger_type VARCHAR(50) NOT NULL, -- 'prompt_change', 'model_change', 'schedule', 'manual'
    
    -- For prompt_change
    prompt_ids JSONB,
    
    -- For schedule
    schedule_cron VARCHAR(100),
    
    -- Action
    invalidation_scope VARCHAR(50) DEFAULT 'matching', -- 'all', 'matching'
    matching_criteria JSONB,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache metrics
CREATE TABLE cache_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    config_id UUID REFERENCES cache_configs(id),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
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
    avg_similarity_score DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache warming jobs
CREATE TABLE cache_warming_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
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

-- Indexes
CREATE INDEX idx_cache_configs_tenant ON cache_configs(tenant_id);
CREATE INDEX idx_cache_entries_key ON cache_entries(tenant_id, cache_key);
CREATE INDEX idx_cache_entries_expires ON cache_entries(expires_at) WHERE is_valid = true;
CREATE INDEX idx_cache_entries_model ON cache_entries(model, created_at DESC);

-- Vector index for semantic search
CREATE INDEX idx_cache_entries_embedding ON cache_entries 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

CREATE INDEX idx_cache_metrics_tenant ON cache_metrics(tenant_id, bucket_timestamp DESC);
CREATE INDEX idx_cache_metrics_config ON cache_metrics(config_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Configuration
GET    /api/cache/configs                 # List configs
POST   /api/cache/configs                 # Create config
PUT    /api/cache/configs/:id             # Update config
DELETE /api/cache/configs/:id             # Delete config

# Manual operations
POST   /api/cache/invalidate              # Invalidate cache entries
POST   /api/cache/warm                    # Start warming job
GET    /api/cache/warm/:id                # Get warming status

# Analytics
GET    /api/cache/metrics                 # Get cache metrics
GET    /api/cache/savings                 # Get savings report
GET    /api/cache/entries                 # Browse cache entries

# Control
POST   /api/cache/bypass                  # Bypass cache for request
DELETE /api/cache/entries/:id             # Delete specific entry
```

## UI Components

### Admin Dashboard Pages

1. **Cache Overview** (`/admin/cache`)
   - Hit rate gauge
   - Savings summary
   - Cache size
   - Recent activity

2. **Configuration** (`/admin/cache/config`)
   - Cache policies
   - Threshold settings
   - TTL configuration
   - Scope rules

3. **Analytics** (`/admin/cache/analytics`)
   - Hit rate trends
   - Savings over time
   - Semantic vs exact breakdown
   - Top cached queries

4. **Cache Browser** (`/admin/cache/entries`)
   - Browse cached entries
   - Search by similarity
   - Manual invalidation
   - Entry details

5. **Warming** (`/admin/cache/warm`)
   - Warming jobs
   - Create warming job
   - Job status

## Dependencies

- **Existing:** API Gateway
- **Related:** Cost Analytics
- **External:**
  - Embedding model
  - Vector database (pgvector or dedicated)

## Security Considerations

- Cache isolation per tenant
- Sensitive data not cached by default
- Cache access controlled
- Encryption at rest optional
- No cross-tenant cache sharing

## Success Metrics

| Metric | Target |
|--------|--------|
| Cache hit rate | > 30% |
| Cost savings | > 20% |
| Latency reduction | > 50% for hits |
| Cache lookup latency | < 20ms |

## Implementation Notes

### Phase 1: Exact Match Cache
- Hash-based caching
- Basic TTL
- Hit/miss metrics

### Phase 2: Semantic Cache
- Embedding generation
- Vector similarity search
- Threshold tuning

### Phase 3: Advanced
- Cache warming
- Smart invalidation
- Predictive caching

### Phase 4: Optimization
- Multi-tier caching
- Edge caching
- Response streaming cache
