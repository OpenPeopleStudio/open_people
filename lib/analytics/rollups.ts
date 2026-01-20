/* ═══════════════════════════════════════════════════════════════════════════
   Analytics Rollups
   Time-series aggregation for performance, cost, and quality metrics
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RollupInterval = "hour" | "day" | "week" | "month";

export type MetricsBucket = {
  id?: string;
  tenant_id: string;
  bucket_timestamp: string;
  bucket_interval: RollupInterval;
  
  // Request metrics
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  
  // Token metrics
  total_input_tokens: number;
  total_output_tokens: number;
  
  // Latency metrics (milliseconds)
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  
  // Cost metrics
  total_cost_usd: number;
  
  // Quality metrics
  avg_quality_score?: number;
  hallucination_rate?: number;
  
  // Cache metrics
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  
  // Error breakdown
  error_breakdown: Record<string, number>;
  
  // Model breakdown
  model_breakdown: Record<string, {
    requests: number;
    tokens: number;
    cost_usd: number;
  }>;
  
  created_at: string;
};

export type RollupResult = {
  interval: RollupInterval;
  buckets_created: number;
  buckets_updated: number;
  timestamp: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Rollup Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function rollupHourlyMetrics(
  tenantId: string,
  hourTimestamp?: Date
): Promise<RollupResult> {
  const supabase = await createSupabaseAdmin();
  const timestamp = hourTimestamp || new Date();
  
  // Truncate to hour
  const bucketStart = new Date(timestamp);
  bucketStart.setMinutes(0, 0, 0);
  const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000);
  
  // Query raw data from ai_runs
  const { data: runs } = await supabase
    .from("ai_runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("created_at", bucketStart.toISOString())
    .lt("created_at", bucketEnd.toISOString());
  
  if (!runs || runs.length === 0) {
    return {
      interval: "hour",
      buckets_created: 0,
      buckets_updated: 0,
      timestamp: timestamp.toISOString(),
    };
  }
  
  // Calculate aggregates
  const metrics = aggregateMetrics(runs, tenantId, bucketStart, "hour");
  
  // Upsert bucket
  const { data, error } = await supabase
    .from("ai_metrics_hourly")
    .upsert(metrics, {
      onConflict: "tenant_id,bucket_timestamp",
    })
    .select();
  
  if (error) {
    console.error("Failed to upsert hourly metrics:", error);
    return {
      interval: "hour",
      buckets_created: 0,
      buckets_updated: 0,
      timestamp: timestamp.toISOString(),
    };
  }
  
  return {
    interval: "hour",
    buckets_created: data ? 1 : 0,
    buckets_updated: 0,
    timestamp: timestamp.toISOString(),
  };
}

export async function rollupDailyMetrics(
  tenantId: string,
  dayTimestamp?: Date
): Promise<RollupResult> {
  const supabase = await createSupabaseAdmin();
  const timestamp = dayTimestamp || new Date();
  
  // Truncate to day
  const bucketStart = new Date(timestamp);
  bucketStart.setHours(0, 0, 0, 0);
  const bucketEnd = new Date(bucketStart.getTime() + 24 * 60 * 60 * 1000);
  
  // Aggregate from hourly buckets (more efficient than raw data)
  const { data: hourlyBuckets } = await supabase
    .from("ai_metrics_hourly")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("bucket_timestamp", bucketStart.toISOString())
    .lt("bucket_timestamp", bucketEnd.toISOString());
  
  if (!hourlyBuckets || hourlyBuckets.length === 0) {
    // Fall back to raw data
    const { data: runs } = await supabase
      .from("ai_runs")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("created_at", bucketStart.toISOString())
      .lt("created_at", bucketEnd.toISOString());
    
    if (!runs || runs.length === 0) {
      return {
        interval: "day",
        buckets_created: 0,
        buckets_updated: 0,
        timestamp: timestamp.toISOString(),
      };
    }
    
    const metrics = aggregateMetrics(runs, tenantId, bucketStart, "day");
    await supabase.from("ai_metrics_daily").upsert(metrics, {
      onConflict: "tenant_id,bucket_timestamp",
    });
    
    return {
      interval: "day",
      buckets_created: 1,
      buckets_updated: 0,
      timestamp: timestamp.toISOString(),
    };
  }
  
  // Aggregate hourly buckets
  const metrics = aggregateHourlyBuckets(hourlyBuckets, tenantId, bucketStart, "day");
  
  await supabase.from("ai_metrics_daily").upsert(metrics, {
    onConflict: "tenant_id,bucket_timestamp",
  });
  
  return {
    interval: "day",
    buckets_created: 1,
    buckets_updated: 0,
    timestamp: timestamp.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation Helpers
// ─────────────────────────────────────────────────────────────────────────────

function aggregateMetrics(
  runs: any[],
  tenantId: string,
  bucketTimestamp: Date,
  interval: RollupInterval
): MetricsBucket {
  const latencies = runs
    .filter((r) => r.latency_ms != null)
    .map((r) => r.latency_ms)
    .sort((a, b) => a - b);
  
  const modelBreakdown: MetricsBucket["model_breakdown"] = {};
  const errorBreakdown: Record<string, number> = {};
  
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;
  let successCount = 0;
  let failedCount = 0;
  let qualitySum = 0;
  let qualityCount = 0;
  
  for (const run of runs) {
    // Token counts
    totalInputTokens += run.input_tokens || 0;
    totalOutputTokens += run.output_tokens || 0;
    totalCost += run.estimated_cost_usd || 0;
    
    // Success/failure
    if (run.status === "completed") {
      successCount++;
    } else if (run.status === "failed") {
      failedCount++;
      const errorType = run.error_type || "unknown";
      errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
    }
    
    // Quality score
    if (run.quality_score != null) {
      qualitySum += run.quality_score;
      qualityCount++;
    }
    
    // Model breakdown
    const model = run.model || "unknown";
    if (!modelBreakdown[model]) {
      modelBreakdown[model] = { requests: 0, tokens: 0, cost_usd: 0 };
    }
    modelBreakdown[model].requests++;
    modelBreakdown[model].tokens += (run.input_tokens || 0) + (run.output_tokens || 0);
    modelBreakdown[model].cost_usd += run.estimated_cost_usd || 0;
  }
  
  return {
    tenant_id: tenantId,
    bucket_timestamp: bucketTimestamp.toISOString(),
    bucket_interval: interval,
    total_requests: runs.length,
    successful_requests: successCount,
    failed_requests: failedCount,
    total_input_tokens: totalInputTokens,
    total_output_tokens: totalOutputTokens,
    avg_latency_ms: latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0,
    p50_latency_ms: latencies.length > 0 ? percentile(latencies, 50) : 0,
    p95_latency_ms: latencies.length > 0 ? percentile(latencies, 95) : 0,
    p99_latency_ms: latencies.length > 0 ? percentile(latencies, 99) : 0,
    total_cost_usd: totalCost,
    avg_quality_score: qualityCount > 0 ? qualitySum / qualityCount : undefined,
    cache_hits: 0, // Would need to join with cache metrics
    cache_misses: 0,
    cache_hit_rate: 0,
    error_breakdown: errorBreakdown,
    model_breakdown: modelBreakdown,
    created_at: new Date().toISOString(),
  };
}

function aggregateHourlyBuckets(
  buckets: any[],
  tenantId: string,
  bucketTimestamp: Date,
  interval: RollupInterval
): MetricsBucket {
  const modelBreakdown: MetricsBucket["model_breakdown"] = {};
  const errorBreakdown: Record<string, number> = {};
  
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;
  let latencySum = 0;
  let cacheHits = 0;
  let cacheMisses = 0;
  
  for (const bucket of buckets) {
    totalRequests += bucket.total_requests || 0;
    successfulRequests += bucket.successful_requests || 0;
    failedRequests += bucket.failed_requests || 0;
    totalInputTokens += bucket.total_input_tokens || 0;
    totalOutputTokens += bucket.total_output_tokens || 0;
    totalCost += bucket.total_cost_usd || 0;
    latencySum += (bucket.avg_latency_ms || 0) * (bucket.total_requests || 1);
    cacheHits += bucket.cache_hits || 0;
    cacheMisses += bucket.cache_misses || 0;
    
    // Merge error breakdown
    if (bucket.error_breakdown) {
      for (const [key, value] of Object.entries(bucket.error_breakdown)) {
        errorBreakdown[key] = (errorBreakdown[key] || 0) + (value as number);
      }
    }
    
    // Merge model breakdown
    if (bucket.model_breakdown) {
      for (const [model, stats] of Object.entries(bucket.model_breakdown)) {
        const s = stats as { requests: number; tokens: number; cost_usd: number };
        if (!modelBreakdown[model]) {
          modelBreakdown[model] = { requests: 0, tokens: 0, cost_usd: 0 };
        }
        modelBreakdown[model].requests += s.requests;
        modelBreakdown[model].tokens += s.tokens;
        modelBreakdown[model].cost_usd += s.cost_usd;
      }
    }
  }
  
  const totalCacheRequests = cacheHits + cacheMisses;
  
  return {
    tenant_id: tenantId,
    bucket_timestamp: bucketTimestamp.toISOString(),
    bucket_interval: interval,
    total_requests: totalRequests,
    successful_requests: successfulRequests,
    failed_requests: failedRequests,
    total_input_tokens: totalInputTokens,
    total_output_tokens: totalOutputTokens,
    avg_latency_ms: totalRequests > 0 ? latencySum / totalRequests : 0,
    p50_latency_ms: 0, // Can't accurately calculate from aggregates
    p95_latency_ms: 0,
    p99_latency_ms: 0,
    total_cost_usd: totalCost,
    cache_hits: cacheHits,
    cache_misses: cacheMisses,
    cache_hit_rate: totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0,
    error_breakdown: errorBreakdown,
    model_breakdown: modelBreakdown,
    created_at: new Date().toISOString(),
  };
}

function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

// ─────────────────────────────────────────────────────────────────────────────
// Scheduled Rollup Job
// ─────────────────────────────────────────────────────────────────────────────

export async function runScheduledRollups(): Promise<{
  hourly: number;
  daily: number;
}> {
  const supabase = await createSupabaseAdmin();
  
  // Get all active tenants
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id")
    .eq("is_active", true);
  
  if (!tenants) {
    return { hourly: 0, daily: 0 };
  }
  
  let hourlyCount = 0;
  let dailyCount = 0;
  
  // Previous hour for hourly rollup
  const previousHour = new Date();
  previousHour.setHours(previousHour.getHours() - 1);
  
  // Previous day for daily rollup (only run at certain times)
  const previousDay = new Date();
  previousDay.setDate(previousDay.getDate() - 1);
  
  for (const tenant of tenants) {
    const hourlyResult = await rollupHourlyMetrics(tenant.id, previousHour);
    hourlyCount += hourlyResult.buckets_created;
    
    // Only run daily rollup once per day (e.g., at 1 AM)
    const currentHour = new Date().getHours();
    if (currentHour === 1) {
      const dailyResult = await rollupDailyMetrics(tenant.id, previousDay);
      dailyCount += dailyResult.buckets_created;
    }
  }
  
  return { hourly: hourlyCount, daily: dailyCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function getMetricsByInterval(
  tenantId: string,
  interval: RollupInterval,
  startDate: Date,
  endDate: Date
): Promise<MetricsBucket[]> {
  const supabase = await createSupabaseAdmin();
  
  const tableName = interval === "hour" ? "ai_metrics_hourly" : "ai_metrics_daily";
  
  const { data } = await supabase
    .from(tableName)
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("bucket_timestamp", startDate.toISOString())
    .lte("bucket_timestamp", endDate.toISOString())
    .order("bucket_timestamp", { ascending: true });
  
  return (data || []) as MetricsBucket[];
}

// Note: Types RollupInterval, MetricsBucket, and RollupResult are exported above
