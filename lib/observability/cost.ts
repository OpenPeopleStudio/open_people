/**
 * Cost Observability
 * 
 * Cost-per-outcome analytics, change event correlation, anomaly detection
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChangeEvent {
  id: string;
  tenant_id: string;
  change_type: ChangeType;
  change_description: string;
  prompt_id?: string;
  prompt_version?: number;
  model_from?: string;
  model_to?: string;
  change_metadata: Record<string, unknown>;
  changed_by?: string;
  occurred_at: string;
  cost_impact_detected?: boolean;
  cost_impact_details?: Record<string, unknown>;
}

export type ChangeType =
  | "prompt_deploy"
  | "model_change"
  | "routing_change"
  | "cache_config"
  | "feature_rollout";

export interface CostOutcomeMetrics {
  id: string;
  tenant_id: string;
  application_id?: string;
  model_name?: string;
  prompt_id?: string;
  bucket_timestamp: string;
  bucket_interval: string;
  total_requests: number;
  total_cost_cents: number;
  avg_cost_per_request_cents: number;
  successful_requests: number;
  success_rate: number;
  total_successful_cost_cents: number;
  avg_cost_per_success_cents: number;
  high_quality_requests: number;
  high_quality_cost_cents: number;
  avg_cost_per_high_quality_cents: number;
}

export interface CostAnomaly {
  tenant_id: string;
  anomaly_timestamp: string;
  anomaly_type: "spike" | "unusual_pattern" | "high_cost_query";
  anomaly_details: {
    expected_value?: number;
    actual_value?: number;
    deviation_percent?: number;
    affected_dimension?: string;
    affected_value?: string;
  };
}

export interface CorrelatedChange {
  change_id: string;
  correlation_score: number;
  reason: string;
}

export interface AnomalyCorrelation {
  id: string;
  tenant_id: string;
  anomaly_id?: string;
  anomaly_timestamp: string;
  anomaly_type: string;
  anomaly_details: Record<string, unknown>;
  correlated_change_ids: string[];
  correlation_scores: Record<string, CorrelatedChange>;
  root_cause_hypothesis?: string;
  confidence?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Event Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a change event that may impact costs
 */
export async function recordChangeEvent(
  supabase: SupabaseClient,
  event: Omit<ChangeEvent, "id" | "occurred_at" | "cost_impact_detected" | "cost_impact_details">
): Promise<ChangeEvent | null> {
  const { data, error } = await supabase
    .from("ai_change_events")
    .insert({
      tenant_id: event.tenant_id,
      change_type: event.change_type,
      change_description: event.change_description,
      prompt_id: event.prompt_id,
      prompt_version: event.prompt_version,
      model_from: event.model_from,
      model_to: event.model_to,
      change_metadata: event.change_metadata,
      changed_by: event.changed_by,
    })
    .select()
    .single();

  if (error) {
    console.error("Error recording change event:", error);
    return null;
  }

  return data;
}

/**
 * Get recent change events
 */
export async function getRecentChangeEvents(
  supabase: SupabaseClient,
  tenantId: string,
  hours: number = 48
): Promise<ChangeEvent[]> {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const { data, error } = await supabase
    .from("ai_change_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("occurred_at", since.toISOString())
    .order("occurred_at", { ascending: false });

  if (error) {
    console.error("Error fetching change events:", error);
    return [];
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost-Per-Outcome Analytics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute cost-per-outcome metrics for a time bucket
 */
export async function computeCostOutcomeMetrics(
  tenantId: string,
  bucketStart: Date,
  bucketEnd: Date,
  bucketInterval: "hour" | "day" | "week",
  dimensions?: {
    applicationId?: string;
    modelName?: string;
    promptId?: string;
  }
): Promise<CostOutcomeMetrics | null> {
  const supabase = await createSupabaseAdmin();

  // Build query for outcomes with costs
  let query = supabase
    .from("ai_run_outcomes")
    .select("*, ai_costs!inner(*)")
    .eq("tenant_id", tenantId)
    .gte("created_at", bucketStart.toISOString())
    .lt("created_at", bucketEnd.toISOString());

  if (dimensions?.applicationId) {
    query = query.eq("application_id", dimensions.applicationId);
  }
  if (dimensions?.modelName) {
    query = query.eq("model_name", dimensions.modelName);
  }
  if (dimensions?.promptId) {
    query = query.eq("prompt_id", dimensions.promptId);
  }

  const { data: outcomes, error } = await query;

  if (error) {
    console.error("Error fetching outcomes for cost metrics:", error);
    return null;
  }

  if (!outcomes || outcomes.length === 0) {
    return null;
  }

  // Aggregate metrics
  const totalRequests = outcomes.length;
  let totalCostCents = 0;
  let successfulRequests = 0;
  let totalSuccessfulCostCents = 0;
  let highQualityRequests = 0;
  let highQualityCostCents = 0;

  for (const outcome of outcomes) {
    const costCents = outcome.total_cost_cents || 0;
    totalCostCents += costCents;

    if (outcome.is_successful) {
      successfulRequests++;
      totalSuccessfulCostCents += costCents;
    }

    if (outcome.quality_score && outcome.quality_score >= 0.8) {
      highQualityRequests++;
      highQualityCostCents += costCents;
    }
  }

  const avgCostPerRequestCents = totalRequests > 0 ? totalCostCents / totalRequests : 0;
  const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;
  const avgCostPerSuccessCents =
    successfulRequests > 0 ? totalSuccessfulCostCents / successfulRequests : 0;
  const avgCostPerHighQualityCents =
    highQualityRequests > 0 ? highQualityCostCents / highQualityRequests : 0;

  const metrics: CostOutcomeMetrics = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    bucket_timestamp: bucketStart.toISOString(),
    bucket_interval: bucketInterval,
    total_requests: totalRequests,
    total_cost_cents: totalCostCents,
    avg_cost_per_request_cents: avgCostPerRequestCents,
    successful_requests: successfulRequests,
    success_rate: successRate,
    total_successful_cost_cents: totalSuccessfulCostCents,
    avg_cost_per_success_cents: avgCostPerSuccessCents,
    high_quality_requests: highQualityRequests,
    high_quality_cost_cents: highQualityCostCents,
    avg_cost_per_high_quality_cents: avgCostPerHighQualityCents,
    ...(dimensions?.applicationId ? { application_id: dimensions.applicationId } : {}),
    ...(dimensions?.modelName ? { model_name: dimensions.modelName } : {}),
    ...(dimensions?.promptId ? { prompt_id: dimensions.promptId } : {}),
  };

  return metrics;
}

/**
 * Store computed cost-outcome metrics
 */
export async function storeCostOutcomeMetrics(
  metrics: CostOutcomeMetrics[]
): Promise<void> {
  if (metrics.length === 0) return;

  const supabase = await createSupabaseAdmin();

  const { error } = await supabase.from("cost_outcome_metrics").insert(metrics);

  if (error) {
    console.error("Error storing cost outcome metrics:", error);
    throw error;
  }
}

/**
 * Get cost-per-outcome summary for a tenant
 */
export async function getCostOutcomeSummary(
  supabase: SupabaseClient,
  tenantId: string,
  days: number = 30,
  groupBy?: "application" | "model" | "prompt"
): Promise<{
  totalCostCents: number;
  totalRequests: number;
  avgCostPerRequest: number;
  avgCostPerSuccess: number;
  avgCostPerHighQuality: number;
  successRate: number;
  byDimension?: Record<
    string,
    {
      costCents: number;
      requests: number;
      costPerSuccess: number;
    }
  >;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("cost_outcome_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("bucket_timestamp", since.toISOString());

  const { data: metrics, error } = await query;

  if (error || !metrics || metrics.length === 0) {
    return {
      totalCostCents: 0,
      totalRequests: 0,
      avgCostPerRequest: 0,
      avgCostPerSuccess: 0,
      avgCostPerHighQuality: 0,
      successRate: 0,
    };
  }

  // Aggregate totals
  let totalCostCents = 0;
  let totalRequests = 0;
  let totalSuccessfulCostCents = 0;
  let totalSuccessfulRequests = 0;
  let totalHighQualityCostCents = 0;
  let totalHighQualityRequests = 0;

  const byDimension: Record<
    string,
    { costCents: number; requests: number; successfulCost: number; successfulRequests: number }
  > = {};

  for (const m of metrics) {
    totalCostCents += m.total_cost_cents;
    totalRequests += m.total_requests;
    totalSuccessfulCostCents += m.total_successful_cost_cents || 0;
    totalSuccessfulRequests += m.successful_requests || 0;
    totalHighQualityCostCents += m.high_quality_cost_cents || 0;
    totalHighQualityRequests += m.high_quality_requests || 0;

    if (groupBy) {
      const dimValue =
        groupBy === "application"
          ? m.application_id
          : groupBy === "model"
            ? m.model_name
            : m.prompt_id;

      if (dimValue) {
        if (!byDimension[dimValue]) {
          byDimension[dimValue] = {
            costCents: 0,
            requests: 0,
            successfulCost: 0,
            successfulRequests: 0,
          };
        }
        byDimension[dimValue].costCents += m.total_cost_cents;
        byDimension[dimValue].requests += m.total_requests;
        byDimension[dimValue].successfulCost += m.total_successful_cost_cents || 0;
        byDimension[dimValue].successfulRequests += m.successful_requests || 0;
      }
    }
  }

  const result: ReturnType<typeof getCostOutcomeSummary> extends Promise<infer T> ? T : never = {
    totalCostCents,
    totalRequests,
    avgCostPerRequest: totalRequests > 0 ? totalCostCents / totalRequests : 0,
    avgCostPerSuccess: totalSuccessfulRequests > 0 ? totalSuccessfulCostCents / totalSuccessfulRequests : 0,
    avgCostPerHighQuality: totalHighQualityRequests > 0 ? totalHighQualityCostCents / totalHighQualityRequests : 0,
    successRate: totalRequests > 0 ? totalSuccessfulRequests / totalRequests : 0,
  };

  if (groupBy && Object.keys(byDimension).length > 0) {
    result.byDimension = {};
    for (const [dim, data] of Object.entries(byDimension)) {
      result.byDimension[dim] = {
        costCents: data.costCents,
        requests: data.requests,
        costPerSuccess:
          data.successfulRequests > 0 ? data.successfulCost / data.successfulRequests : 0,
      };
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly Correlation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Correlate a cost anomaly with recent change events
 */
export async function correlateAnomalyWithChanges(
  tenantId: string,
  anomaly: CostAnomaly,
  lookbackHours: number = 48
): Promise<AnomalyCorrelation> {
  const supabase = await createSupabaseAdmin();

  // Get change events in the lookback window
  const changeEvents = await getRecentChangeEvents(supabase, tenantId, lookbackHours);

  const correlatedChangeIds: string[] = [];
  const correlationScores: Record<string, CorrelatedChange> = {};

  const anomalyTime = new Date(anomaly.anomaly_timestamp).getTime();

  for (const event of changeEvents) {
    const eventTime = new Date(event.occurred_at).getTime();
    const hoursBefore = (anomalyTime - eventTime) / (1000 * 60 * 60);

    // Skip events after the anomaly
    if (hoursBefore < 0) continue;

    // Calculate correlation score based on timing and type
    let score = 0;
    let reason = "";

    // Closer in time = higher score
    if (hoursBefore <= 1) {
      score += 0.5;
      reason = "Change occurred within 1 hour before anomaly";
    } else if (hoursBefore <= 4) {
      score += 0.3;
      reason = "Change occurred within 4 hours before anomaly";
    } else if (hoursBefore <= 24) {
      score += 0.1;
      reason = "Change occurred within 24 hours before anomaly";
    }

    // Type-specific scoring
    if (anomaly.anomaly_type === "spike") {
      if (event.change_type === "model_change") {
        score += 0.3;
        reason += "; model change can cause cost spikes";
      } else if (event.change_type === "prompt_deploy") {
        score += 0.2;
        reason += "; prompt changes can affect token usage";
      } else if (event.change_type === "cache_config") {
        score += 0.4;
        reason += "; cache config directly affects cost";
      }
    }

    // Dimension matching
    if (
      anomaly.anomaly_details.affected_dimension === "model" &&
      (event.model_from || event.model_to)
    ) {
      score += 0.2;
      reason += "; model change matches affected dimension";
    }

    if (score > 0.2) {
      correlatedChangeIds.push(event.id);
      correlationScores[event.id] = {
        change_id: event.id,
        correlation_score: Math.min(score, 1.0),
        reason,
      };
    }
  }

  // Generate hypothesis
  let rootCauseHypothesis: string | undefined;
  let confidence = 0;

  if (correlatedChangeIds.length > 0) {
    const topCorrelation = Object.values(correlationScores).sort(
      (a, b) => b.correlation_score - a.correlation_score
    )[0];

    rootCauseHypothesis = `Likely caused by: ${topCorrelation.reason}`;
    confidence = topCorrelation.correlation_score;
  }

  const correlation: AnomalyCorrelation = {
    id: crypto.randomUUID(),
    tenant_id: tenantId,
    anomaly_timestamp: anomaly.anomaly_timestamp,
    anomaly_type: anomaly.anomaly_type,
    anomaly_details: anomaly.anomaly_details,
    correlated_change_ids: correlatedChangeIds,
    correlation_scores: correlationScores,
    confidence,
    ...(rootCauseHypothesis ? { root_cause_hypothesis: rootCauseHypothesis } : {}),
  };

  // Store the correlation
  const correlationInsert: Record<string, unknown> = {
    tenant_id: correlation.tenant_id,
    anomaly_timestamp: correlation.anomaly_timestamp,
    anomaly_type: correlation.anomaly_type,
    anomaly_details: correlation.anomaly_details,
    correlated_change_ids: correlation.correlated_change_ids,
    correlation_scores: correlation.correlation_scores,
    confidence: correlation.confidence,
  };
  if (correlation.root_cause_hypothesis) {
    correlationInsert.root_cause_hypothesis = correlation.root_cause_hypothesis;
  }
  const { error } = await supabase.from("cost_anomaly_correlations").insert(correlationInsert);

  if (error) {
    console.error("Error storing anomaly correlation:", error);
  }

  return correlation;
}

/**
 * Detect cost anomalies and correlate with changes (background job)
 */
export async function detectAndCorrelateAnomalies(
  tenantId: string
): Promise<AnomalyCorrelation[]> {
  const supabase = await createSupabaseAdmin();

  // Get recent cost metrics
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: recentMetrics } = await supabase
    .from("cost_outcome_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("bucket_timestamp", yesterday.toISOString())
    .order("bucket_timestamp", { ascending: false });

  const { data: baselineMetrics } = await supabase
    .from("cost_outcome_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("bucket_timestamp", weekAgo.toISOString())
    .lt("bucket_timestamp", yesterday.toISOString());

  if (!recentMetrics || !baselineMetrics || baselineMetrics.length === 0) {
    return [];
  }

  // Calculate baseline averages
  const baselineAvgCost =
    baselineMetrics.reduce((sum, m) => sum + m.avg_cost_per_request_cents, 0) /
    baselineMetrics.length;
  const baselineStdDev = Math.sqrt(
    baselineMetrics.reduce(
      (sum, m) => sum + Math.pow(m.avg_cost_per_request_cents - baselineAvgCost, 2),
      0
    ) / baselineMetrics.length
  );

  const anomalies: CostAnomaly[] = [];

  // Detect spikes (> 2 std deviations)
  for (const metric of recentMetrics) {
    const deviation =
      baselineStdDev > 0
        ? (metric.avg_cost_per_request_cents - baselineAvgCost) / baselineStdDev
        : 0;

    if (deviation > 2) {
      const anomalyDetails: {
        expected_value?: number;
        actual_value?: number;
        deviation_percent?: number;
        affected_dimension?: string;
        affected_value?: string;
      } = {
        expected_value: baselineAvgCost,
        actual_value: metric.avg_cost_per_request_cents,
        deviation_percent:
          ((metric.avg_cost_per_request_cents - baselineAvgCost) / baselineAvgCost) * 100,
      };
      if (metric.application_id) {
        anomalyDetails.affected_dimension = "application";
        anomalyDetails.affected_value = metric.application_id;
      } else if (metric.model_name) {
        anomalyDetails.affected_dimension = "model";
        anomalyDetails.affected_value = metric.model_name;
      }

      anomalies.push({
        tenant_id: tenantId,
        anomaly_timestamp: metric.bucket_timestamp,
        anomaly_type: "spike",
        anomaly_details: anomalyDetails,
      });
    }
  }

  // Correlate each anomaly with changes
  const correlations: AnomalyCorrelation[] = [];
  for (const anomaly of anomalies) {
    const correlation = await correlateAnomalyWithChanges(tenantId, anomaly);
    correlations.push(correlation);
  }

  return correlations;
}

/**
 * Update change event with detected cost impact
 */
export async function updateChangeEventImpact(
  changeId: string,
  impact: {
    detected: boolean;
    details: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  const { error } = await supabase
    .from("ai_change_events")
    .update({
      cost_impact_detected: impact.detected,
      cost_impact_details: impact.details,
    })
    .eq("id", changeId);

  if (error) {
    console.error("Error updating change event impact:", error);
    throw error;
  }
}
