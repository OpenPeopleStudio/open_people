/**
 * Quality Observability
 * 
 * Auto-slice explorer, regression gates, quality clustering
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const roundTo = (value: number, decimals = 6): number => Number(value.toFixed(decimals));

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QualitySliceKey {
  application_id?: string;
  model_name?: string;
  prompt_version?: number;
  topic_cluster?: string;
}

export interface QualitySlice {
  id: string;
  tenant_id: string;
  slice_key: QualitySliceKey;
  window_start: string;
  window_end: string;
  sample_count: number;
  low_quality_count: number;
  low_quality_rate: number;
  avg_quality_score: number | null;
  min_quality_score: number | null;
  max_quality_score: number | null;
  dimension_averages: Record<string, number> | null;
  total_cost_cents: number | null;
  successful_count: number | null;
  cost_per_success_cents: number | null;
  sample_run_ids: string[];
  baseline_quality_score: number | null;
  quality_delta: number | null;
  alert_generated: boolean;
  computed_at: string;
}

export interface SliceExplorerParams {
  tenantId: string;
  windowStart?: Date;
  windowEnd?: Date;
  minLowQualityRate?: number;
  minSampleCount?: number;
  groupBy?: Array<keyof QualitySliceKey>;
  limit?: number;
}

export interface RegressionGate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  scope_type: "prompt" | "model" | "application" | "global";
  scope_id: string | null;
  requirements: RegressionGateRequirements;
  on_failure: "block" | "warn" | "notify";
  notify_users: string[];
  is_active: boolean;
}

export interface RegressionGateRequirements {
  min_quality_score?: number;
  max_low_quality_rate?: number;
  min_sample_count?: number;
  benchmark_ids?: string[];
  min_benchmark_pass_rate?: number;
}

export interface GateEvaluationResult {
  gate_id: string;
  passed: boolean;
  evaluation_details: {
    quality_score?: number;
    low_quality_rate?: number;
    sample_count?: number;
    benchmark_results?: Array<{ id: string; passed: boolean; score: number }>;
  };
  failure_reasons: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Slice Explorer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get precomputed quality slices with low quality issues
 */
export async function getQualitySlices(
  supabase: SupabaseClient,
  params: SliceExplorerParams
): Promise<QualitySlice[]> {
  const {
    tenantId,
    windowStart,
    windowEnd,
    minLowQualityRate = 0.1,
    minSampleCount = 10,
    limit = 50,
  } = params;

  let query = supabase
    .from("quality_slices")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("low_quality_rate", minLowQualityRate)
    .gte("sample_count", minSampleCount)
    .order("low_quality_rate", { ascending: false })
    .limit(limit);

  if (windowStart) {
    query = query.gte("window_end", windowStart.toISOString());
  }
  if (windowEnd) {
    query = query.lte("window_start", windowEnd.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching quality slices:", error);
    return [];
  }

  return data || [];
}

/**
 * Compute quality slices from raw outcome data (used by background job)
 */
export async function computeQualitySlices(
  tenantId: string,
  windowStart: Date,
  windowEnd: Date,
  groupByDimensions: Array<keyof QualitySliceKey> = ["application_id", "model_name", "prompt_version"]
): Promise<QualitySlice[]> {
  const supabase = await createSupabaseAdmin();

  // Fetch outcomes in the window
  const { data: outcomes, error } = await supabase
    .from("ai_run_outcomes")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("created_at", windowStart.toISOString())
    .lte("created_at", windowEnd.toISOString());

  if (error || !outcomes || outcomes.length === 0) {
    return [];
  }

  // Group outcomes by slice key
  const sliceMap = new Map<string, typeof outcomes>();

  for (const outcome of outcomes) {
    const keyParts: string[] = [];

    for (const dim of groupByDimensions) {
      const value = outcome[dim];
      if (value !== null && value !== undefined) {
        keyParts.push(`${dim}:${value}`);
      } else {
        keyParts.push(`${dim}:__null__`);
      }
    }

    const keyStr = keyParts.join("|");
    if (!sliceMap.has(keyStr)) {
      sliceMap.set(keyStr, []);
    }
    sliceMap.get(keyStr)!.push(outcome);
  }

  // Compute slice metrics
  const slices: QualitySlice[] = [];

  for (const [, sliceOutcomes] of sliceMap) {
    const first = sliceOutcomes[0];
    const sliceKey: Record<string, string | number> = {};
    for (const dim of groupByDimensions) {
      if (first[dim] !== null && first[dim] !== undefined) {
        sliceKey[dim] = first[dim] as string | number;
      }
    }

    const sampleCount = sliceOutcomes.length;
    const lowQualityCount = sliceOutcomes.filter((o) => o.low_quality_flag).length;
    const lowQualityRate = sampleCount > 0 ? lowQualityCount / sampleCount : 0;

    const qualityScores = sliceOutcomes
      .map((o) => o.quality_score)
      .filter((s): s is number => s !== null);

    const avgQualityScore =
      qualityScores.length > 0
        ? roundTo(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
        : null;
    const minQualityScore = qualityScores.length > 0 ? Math.min(...qualityScores) : null;
    const maxQualityScore = qualityScores.length > 0 ? Math.max(...qualityScores) : null;

    // Cost metrics
    const totalCostCents = sliceOutcomes
      .filter((o) => o.total_cost_cents)
      .reduce((sum, o) => sum + (o.total_cost_cents || 0), 0);

    const successfulOutcomes = sliceOutcomes.filter((o) => o.is_successful);
    const successfulCount = successfulOutcomes.length;
    const successfulCost = successfulOutcomes.reduce(
      (sum, o) => sum + (o.total_cost_cents || 0),
      0
    );
    const costPerSuccessCents =
      successfulCount > 0 ? Math.round(successfulCost / successfulCount) : null;

    // Sample run IDs (low quality examples)
    const sampleRunIds = sliceOutcomes
      .filter((o) => o.low_quality_flag)
      .slice(0, 5)
      .map((o) => o.run_id);

    // Aggregate dimension scores
    let dimensionAverages: Record<string, number> | null = null;
    const dimScores: Record<string, number[]> = {};
    for (const outcome of sliceOutcomes) {
      if (outcome.quality_dimension_scores) {
        for (const [dim, score] of Object.entries(outcome.quality_dimension_scores)) {
          if (typeof score === "number") {
            if (!dimScores[dim]) dimScores[dim] = [];
            dimScores[dim].push(score);
          }
        }
      }
    }
    if (Object.keys(dimScores).length > 0) {
      dimensionAverages = {};
      for (const [dim, scores] of Object.entries(dimScores)) {
        dimensionAverages[dim] = roundTo(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    slices.push({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      slice_key: sliceKey as QualitySliceKey,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      sample_count: sampleCount,
      low_quality_count: lowQualityCount,
      low_quality_rate: lowQualityRate,
      avg_quality_score: avgQualityScore,
      min_quality_score: minQualityScore,
      max_quality_score: maxQualityScore,
      dimension_averages: dimensionAverages,
      total_cost_cents: totalCostCents,
      successful_count: successfulCount,
      cost_per_success_cents: costPerSuccessCents,
      sample_run_ids: sampleRunIds,
      baseline_quality_score: null, // TODO: Compare with baseline
      quality_delta: null,
      alert_generated: false,
      computed_at: new Date().toISOString(),
    });
  }

  return slices;
}

/**
 * Store computed slices in the database
 */
export async function storeQualitySlices(slices: QualitySlice[]): Promise<void> {
  if (slices.length === 0) return;

  const supabase = await createSupabaseAdmin();

  const { error } = await supabase.from("quality_slices").insert(slices);

  if (error) {
    console.error("Error storing quality slices:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Regression Gates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load regression gates for a scope
 */
export async function loadRegressionGates(
  supabase: SupabaseClient,
  tenantId: string,
  scopeType?: string,
  scopeId?: string
): Promise<RegressionGate[]> {
  let query = supabase
    .from("regression_gates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (scopeType) {
    query = query.eq("scope_type", scopeType);
  }
  if (scopeId) {
    query = query.eq("scope_id", scopeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading regression gates:", error);
    return [];
  }

  return data || [];
}

/**
 * Evaluate a regression gate
 */
export async function evaluateRegressionGate(
  supabase: SupabaseClient,
  tenantId: string,
  gate: RegressionGate,
  context: {
    promptId?: string;
    promptVersion?: number;
    modelName?: string;
    applicationId?: string;
  }
): Promise<GateEvaluationResult> {
  const requirements = gate.requirements;
  const failureReasons: string[] = [];
  const evaluationDetails: GateEvaluationResult["evaluation_details"] = {};

  // Get recent outcomes matching the scope
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 7); // Last 7 days

  let query = supabase
    .from("ai_run_outcomes")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("created_at", windowStart.toISOString());

  if (context.applicationId) {
    query = query.eq("application_id", context.applicationId);
  }
  if (context.modelName) {
    query = query.eq("model_name", context.modelName);
  }
  if (context.promptId) {
    query = query.eq("prompt_id", context.promptId);
  }
  if (context.promptVersion) {
    query = query.eq("prompt_version", context.promptVersion);
  }

  const { data: outcomes } = await query;

  if (!outcomes || outcomes.length === 0) {
    if (requirements.min_sample_count && requirements.min_sample_count > 0) {
      failureReasons.push(
        `Insufficient samples: 0 found, ${requirements.min_sample_count} required`
      );
    }
    return {
      gate_id: gate.id,
      passed: failureReasons.length === 0,
      evaluation_details: { sample_count: 0 },
      failure_reasons: failureReasons,
    };
  }

  evaluationDetails.sample_count = outcomes.length;

  // Check min sample count
  if (requirements.min_sample_count && outcomes.length < requirements.min_sample_count) {
    failureReasons.push(
      `Insufficient samples: ${outcomes.length} found, ${requirements.min_sample_count} required`
    );
  }

  // Check quality score
  const qualityScores = outcomes
    .map((o) => o.quality_score)
    .filter((s): s is number => s !== null);

  if (qualityScores.length > 0) {
    const avgScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    evaluationDetails.quality_score = avgScore;

    if (requirements.min_quality_score && avgScore < requirements.min_quality_score) {
      failureReasons.push(
        `Quality score ${avgScore.toFixed(2)} below minimum ${requirements.min_quality_score}`
      );
    }
  }

  // Check low quality rate
  const lowQualityCount = outcomes.filter((o) => o.low_quality_flag).length;
  const lowQualityRate = outcomes.length > 0 ? lowQualityCount / outcomes.length : 0;
  evaluationDetails.low_quality_rate = lowQualityRate;

  if (requirements.max_low_quality_rate && lowQualityRate > requirements.max_low_quality_rate) {
    failureReasons.push(
      `Low quality rate ${(lowQualityRate * 100).toFixed(1)}% exceeds maximum ${(requirements.max_low_quality_rate * 100).toFixed(1)}%`
    );
  }

  // Check benchmarks if specified
  if (requirements.benchmark_ids && requirements.benchmark_ids.length > 0) {
    const benchmarkResults: Array<{ id: string; passed: boolean; score: number }> = [];

    for (const benchmarkId of requirements.benchmark_ids) {
      // Get latest benchmark run
      const { data: runs } = await supabase
        .from("quality_benchmark_runs")
        .select("*")
        .eq("benchmark_id", benchmarkId)
        .order("run_at", { ascending: false })
        .limit(1);

      if (runs && runs.length > 0) {
        const run = runs[0];
        const passed = run.overall_score >= (requirements.min_benchmark_pass_rate || 0.9);
        benchmarkResults.push({
          id: benchmarkId,
          passed,
          score: run.overall_score,
        });
        if (!passed) {
          failureReasons.push(
            `Benchmark ${benchmarkId} score ${run.overall_score.toFixed(2)} below threshold`
          );
        }
      } else {
        failureReasons.push(`No benchmark run found for ${benchmarkId}`);
        benchmarkResults.push({ id: benchmarkId, passed: false, score: 0 });
      }
    }

    evaluationDetails.benchmark_results = benchmarkResults;
  }

  return {
    gate_id: gate.id,
    passed: failureReasons.length === 0,
    evaluation_details: evaluationDetails,
    failure_reasons: failureReasons,
  };
}

/**
 * Record a gate evaluation
 */
export async function recordGateEvaluation(
  supabase: SupabaseClient,
  evaluation: {
    gateId: string;
    evaluationType: "prompt_deploy" | "model_change" | "manual";
    targetId?: string;
    targetMetadata?: Record<string, unknown>;
    result: GateEvaluationResult;
    evaluatedBy?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("regression_gate_evaluations").insert({
    gate_id: evaluation.gateId,
    evaluation_type: evaluation.evaluationType,
    target_id: evaluation.targetId,
    target_metadata: evaluation.targetMetadata,
    passed: evaluation.result.passed,
    evaluation_details: evaluation.result.evaluation_details,
    failure_reasons: evaluation.result.failure_reasons,
    evaluated_by: evaluation.evaluatedBy,
  });

  if (error) {
    console.error("Error recording gate evaluation:", error);
    throw error;
  }
}

/**
 * Check all applicable gates for a deployment
 */
export async function checkDeploymentGates(
  tenantId: string,
  deployment: {
    type: "prompt_deploy" | "model_change";
    promptId?: string;
    promptVersion?: number;
    modelName?: string;
    applicationId?: string;
    deployedBy?: string;
  }
): Promise<{
  canProceed: boolean;
  blockingGates: GateEvaluationResult[];
  warningGates: GateEvaluationResult[];
  passedGates: GateEvaluationResult[];
}> {
  const supabase = await createSupabaseAdmin();

  // Load all applicable gates
  const gates = await loadRegressionGates(supabase, tenantId);

  const blockingGates: GateEvaluationResult[] = [];
  const warningGates: GateEvaluationResult[] = [];
  const passedGates: GateEvaluationResult[] = [];

  for (const gate of gates) {
    // Check if gate applies to this deployment
    const applies =
      gate.scope_type === "global" ||
      (gate.scope_type === "prompt" && gate.scope_id === deployment.promptId) ||
      (gate.scope_type === "model" && gate.scope_id === deployment.modelName) ||
      (gate.scope_type === "application" && gate.scope_id === deployment.applicationId);

    if (!applies) continue;

    const gateContext: {
      promptId?: string;
      promptVersion?: number;
      modelName?: string;
      applicationId?: string;
    } = {};
    if (deployment.promptId) {
      gateContext.promptId = deployment.promptId;
    }
    if (deployment.promptVersion !== undefined) {
      gateContext.promptVersion = deployment.promptVersion;
    }
    if (deployment.modelName) {
      gateContext.modelName = deployment.modelName;
    }
    if (deployment.applicationId) {
      gateContext.applicationId = deployment.applicationId;
    }

    const result = await evaluateRegressionGate(supabase, tenantId, gate, gateContext);

    // Record the evaluation
    const evaluation = {
      gateId: gate.id,
      evaluationType: deployment.type,
      result,
      ...(deployment.deployedBy ? { evaluatedBy: deployment.deployedBy } : {}),
    } as {
      gateId: string;
      evaluationType: "prompt_deploy" | "model_change";
      result: GateEvaluationResult;
      evaluatedBy?: string;
      targetId?: string;
      targetMetadata?: Record<string, unknown>;
    };

    const targetId = deployment.promptId || deployment.modelName;
    if (targetId) {
      evaluation.targetId = targetId;
    }

    const targetMetadata: Record<string, unknown> = {};
    if (deployment.promptVersion !== undefined) {
      targetMetadata.prompt_version = deployment.promptVersion;
    }
    if (deployment.modelName) {
      targetMetadata.model_name = deployment.modelName;
    }
    if (deployment.applicationId) {
      targetMetadata.application_id = deployment.applicationId;
    }
    if (Object.keys(targetMetadata).length > 0) {
      evaluation.targetMetadata = targetMetadata;
    }

    await recordGateEvaluation(supabase, evaluation);

    if (result.passed) {
      passedGates.push(result);
    } else if (gate.on_failure === "block") {
      blockingGates.push(result);
    } else {
      warningGates.push(result);
    }
  }

  return {
    canProceed: blockingGates.length === 0,
    blockingGates,
    warningGates,
    passedGates,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Outcome Linking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Link a quality score to an outcome record
 */
export async function linkQualityToOutcome(
  runId: string,
  qualityScore: number,
  dimensionScores: Record<string, number> | null,
  lowQualityFlag: boolean
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  // Upsert the outcome record
  const { error } = await supabase.from("ai_run_outcomes").upsert(
    {
      run_id: runId,
      quality_score: qualityScore,
      quality_dimension_scores: dimensionScores,
      low_quality_flag: lowQualityFlag,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "run_id" }
  );

  if (error) {
    console.error("Error linking quality to outcome:", error);
    throw error;
  }
}

/**
 * Link feedback to an outcome record
 */
export async function linkFeedbackToOutcome(
  runId: string,
  feedbackRating: string,
  feedbackScore?: number
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  // Calculate success based on feedback
  const isSuccessful = feedbackRating === "good" || (feedbackScore && feedbackScore >= 4);

  // Upsert the outcome record
  const { error } = await supabase.from("ai_run_outcomes").upsert(
    {
      run_id: runId,
      has_feedback: true,
      feedback_rating: feedbackRating,
      feedback_score: feedbackScore,
      is_successful: isSuccessful,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "run_id" }
  );

  if (error) {
    console.error("Error linking feedback to outcome:", error);
    throw error;
  }
}
