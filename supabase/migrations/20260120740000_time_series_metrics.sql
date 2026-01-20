-- ═══════════════════════════════════════════════════════════════════════════
-- Time-Series Metrics Schema
-- Partitioned tables for performance, cost, and quality metrics with rollups
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Hourly Metrics (raw rollups, retained 90 days)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_metrics_hourly (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) DEFAULT 'hour',
    
    -- Request metrics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    
    -- Token metrics
    total_input_tokens BIGINT DEFAULT 0,
    total_output_tokens BIGINT DEFAULT 0,
    
    -- Latency metrics (milliseconds)
    avg_latency_ms INTEGER DEFAULT 0,
    p50_latency_ms INTEGER DEFAULT 0,
    p95_latency_ms INTEGER DEFAULT 0,
    p99_latency_ms INTEGER DEFAULT 0,
    
    -- Cost metrics
    total_cost_usd DECIMAL(12,6) DEFAULT 0,
    
    -- Quality metrics
    avg_quality_score DECIMAL(4,3),
    hallucination_rate DECIMAL(4,3),
    
    -- Cache metrics
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    cache_hit_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Error breakdown
    error_breakdown JSONB DEFAULT '{}',
    
    -- Model breakdown
    model_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (tenant_id, bucket_timestamp)
) PARTITION BY RANGE (bucket_timestamp);

-- Create monthly partitions for hourly data
CREATE TABLE ai_metrics_hourly_2026_01 PARTITION OF ai_metrics_hourly
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE ai_metrics_hourly_2026_02 PARTITION OF ai_metrics_hourly
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE ai_metrics_hourly_2026_03 PARTITION OF ai_metrics_hourly
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE ai_metrics_hourly_2026_04 PARTITION OF ai_metrics_hourly
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE ai_metrics_hourly_2026_05 PARTITION OF ai_metrics_hourly
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE ai_metrics_hourly_2026_06 PARTITION OF ai_metrics_hourly
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- ─────────────────────────────────────────────────────────────────────────────
-- Daily Metrics (aggregated from hourly, retained forever)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_metrics_daily (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) DEFAULT 'day',
    
    -- Request metrics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    
    -- Token metrics
    total_input_tokens BIGINT DEFAULT 0,
    total_output_tokens BIGINT DEFAULT 0,
    
    -- Latency metrics (milliseconds)
    avg_latency_ms INTEGER DEFAULT 0,
    min_latency_ms INTEGER DEFAULT 0,
    max_latency_ms INTEGER DEFAULT 0,
    
    -- Cost metrics
    total_cost_usd DECIMAL(12,6) DEFAULT 0,
    
    -- Quality metrics
    avg_quality_score DECIMAL(4,3),
    
    -- Cache metrics
    cache_hits INTEGER DEFAULT 0,
    cache_misses INTEGER DEFAULT 0,
    cache_hit_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Error breakdown
    error_breakdown JSONB DEFAULT '{}',
    
    -- Model breakdown
    model_breakdown JSONB DEFAULT '{}',
    
    -- Provider breakdown
    provider_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (tenant_id, bucket_timestamp)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_metrics_hourly_tenant_time 
    ON ai_metrics_hourly(tenant_id, bucket_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_daily_tenant_time 
    ON ai_metrics_daily(tenant_id, bucket_timestamp DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE ai_metrics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_metrics_hourly_tenant_isolation" ON ai_metrics_hourly
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "ai_metrics_daily_tenant_isolation" ON ai_metrics_daily
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- Cleanup Function (delete hourly data older than 90 days)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_hourly_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM ai_metrics_hourly
        WHERE bucket_timestamp < NOW() - INTERVAL '90 days'
        RETURNING 1
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- Rollup Function (for scheduled execution)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION rollup_hourly_to_daily(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS INTEGER AS $$
DECLARE
    tenant_record RECORD;
    inserted_count INTEGER := 0;
BEGIN
    FOR tenant_record IN 
        SELECT DISTINCT tenant_id FROM ai_metrics_hourly 
        WHERE bucket_timestamp >= p_date 
          AND bucket_timestamp < p_date + INTERVAL '1 day'
    LOOP
        INSERT INTO ai_metrics_daily (
            tenant_id,
            bucket_timestamp,
            total_requests,
            successful_requests,
            failed_requests,
            total_input_tokens,
            total_output_tokens,
            avg_latency_ms,
            total_cost_usd,
            cache_hits,
            cache_misses,
            cache_hit_rate,
            error_breakdown,
            model_breakdown
        )
        SELECT 
            tenant_id,
            date_trunc('day', bucket_timestamp),
            SUM(total_requests),
            SUM(successful_requests),
            SUM(failed_requests),
            SUM(total_input_tokens),
            SUM(total_output_tokens),
            CASE WHEN SUM(total_requests) > 0 
                 THEN SUM(avg_latency_ms * total_requests) / SUM(total_requests) 
                 ELSE 0 END,
            SUM(total_cost_usd),
            SUM(cache_hits),
            SUM(cache_misses),
            CASE WHEN SUM(cache_hits) + SUM(cache_misses) > 0 
                 THEN SUM(cache_hits)::DECIMAL / (SUM(cache_hits) + SUM(cache_misses)) 
                 ELSE 0 END,
            jsonb_object_agg(COALESCE(key, 'unknown'), COALESCE(value::INTEGER, 0)),
            '{}'::JSONB
        FROM ai_metrics_hourly
        CROSS JOIN LATERAL jsonb_each_text(error_breakdown) AS errors(key, value)
        WHERE tenant_id = tenant_record.tenant_id
          AND bucket_timestamp >= p_date
          AND bucket_timestamp < p_date + INTERVAL '1 day'
        GROUP BY tenant_id, date_trunc('day', bucket_timestamp)
        ON CONFLICT (tenant_id, bucket_timestamp) DO UPDATE SET
            total_requests = EXCLUDED.total_requests,
            successful_requests = EXCLUDED.successful_requests,
            failed_requests = EXCLUDED.failed_requests,
            total_input_tokens = EXCLUDED.total_input_tokens,
            total_output_tokens = EXCLUDED.total_output_tokens,
            avg_latency_ms = EXCLUDED.avg_latency_ms,
            total_cost_usd = EXCLUDED.total_cost_usd,
            cache_hits = EXCLUDED.cache_hits,
            cache_misses = EXCLUDED.cache_misses,
            cache_hit_rate = EXCLUDED.cache_hit_rate;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- Add trace_id columns to relevant tables
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS trace_id VARCHAR(64);
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS span_id VARCHAR(64);
ALTER TABLE ai_runs ADD COLUMN IF NOT EXISTS parent_span_id VARCHAR(64);

ALTER TABLE gateway_requests ADD COLUMN IF NOT EXISTS trace_id VARCHAR(64);
ALTER TABLE gateway_requests ADD COLUMN IF NOT EXISTS span_id VARCHAR(64);

-- Create indexes for trace lookups
CREATE INDEX IF NOT EXISTS idx_ai_runs_trace ON ai_runs(trace_id) WHERE trace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gateway_requests_trace ON gateway_requests(trace_id) WHERE trace_id IS NOT NULL;
