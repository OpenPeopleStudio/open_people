/**
 * Drift Observability
 * 
 * Probe packs, auto-baseline, drift detection
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProbeDefinition {
  name: string;
  probe_input: string;
  expected_patterns: ProbePattern[];
  category?: string;
}

export interface ProbePattern {
  type: "contains" | "not_contains" | "regex" | "format";
  value: string;
}

export interface ProbePack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  is_system: boolean;
  tenant_id: string | null;
  probes: ProbeDefinition[];
  recommended_frequency: string;
  recommended_threshold: number;
  install_count: number;
}

export interface ProbePackInstall {
  id: string;
  tenant_id: string;
  pack_id: string;
  frequency_override?: string;
  threshold_override?: number;
  enabled_probes?: string[];
  application_id?: string;
  model_id?: string;
  is_active: boolean;
  installed_at: string;
  installed_by?: string;
}

export interface ProbeExecutionResult {
  probe_name: string;
  passed: boolean;
  output: string;
  patterns_matched: Array<{ pattern_idx: number; matched: boolean }>;
  latency_ms: number;
  error?: string;
}

export interface AutoBaselineConfig {
  id: string;
  tenant_id: string;
  scope_type: "prompt" | "model" | "application";
  scope_id?: string;
  collection_duration_hours: number;
  min_samples: number;
  max_samples: number;
  baseline_types: string[];
  trigger_on: "approval" | "deploy" | "manual";
  is_active: boolean;
}

export interface AutoBaselineJob {
  id: string;
  config_id: string;
  tenant_id: string;
  trigger_type: string;
  trigger_metadata: Record<string, unknown>;
  status: "collecting" | "completed" | "failed";
  collection_start: string;
  collection_end?: string;
  samples_collected: number;
  baseline_id?: string;
  error_message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Probe Packs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List available probe packs
 */
export async function listProbePacks(
  supabase: SupabaseClient,
  options?: {
    tenantId?: string;
    category?: string;
    includeSystem?: boolean;
  }
): Promise<ProbePack[]> {
  let query = supabase.from("drift_probe_packs").select("*");

  if (options?.category) {
    query = query.eq("category", options.category);
  }

  if (options?.tenantId) {
    // Show system packs and tenant-specific packs
    query = query.or(
      `is_system.eq.true,tenant_id.eq.${options.tenantId}`
    );
  } else if (options?.includeSystem !== false) {
    query = query.eq("is_system", true);
  }

  const { data, error } = await query.order("category").order("name");

  if (error) {
    console.error("Error listing probe packs:", error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific probe pack by slug
 */
export async function getProbePackBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ProbePack | null> {
  const { data, error } = await supabase
    .from("drift_probe_packs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching probe pack:", error);
    return null;
  }

  return data;
}

/**
 * Install a probe pack for a tenant
 */
export async function installProbePack(
  supabase: SupabaseClient,
  tenantId: string,
  packId: string,
  options?: {
    frequencyOverride?: string;
    thresholdOverride?: number;
    enabledProbes?: string[];
    applicationId?: string;
    modelId?: string;
    installedBy?: string;
  }
): Promise<ProbePackInstall | null> {
  const { data, error } = await supabase
    .from("drift_probe_pack_installs")
    .insert({
      tenant_id: tenantId,
      pack_id: packId,
      frequency_override: options?.frequencyOverride,
      threshold_override: options?.thresholdOverride,
      enabled_probes: options?.enabledProbes,
      application_id: options?.applicationId,
      model_id: options?.modelId,
      installed_by: options?.installedBy,
    })
    .select()
    .single();

  if (error) {
    console.error("Error installing probe pack:", error);
    return null;
  }

  // Increment install count on the pack
  await supabase.rpc("increment_probe_pack_installs", { pack_id: packId });

  return data;
}

/**
 * Get installed probe packs for a tenant
 */
export async function getInstalledProbePacks(
  supabase: SupabaseClient,
  tenantId: string,
  options?: {
    applicationId?: string;
    activeOnly?: boolean;
  }
): Promise<Array<ProbePackInstall & { pack: ProbePack }>> {
  let query = supabase
    .from("drift_probe_pack_installs")
    .select("*, pack:drift_probe_packs(*)")
    .eq("tenant_id", tenantId);

  if (options?.applicationId) {
    query = query.eq("application_id", options.applicationId);
  }

  if (options?.activeOnly !== false) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching installed probe packs:", error);
    return [];
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Probe Execution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a pattern matches the output
 */
function matchPattern(output: string, pattern: ProbePattern): boolean {
  const lowerOutput = output.toLowerCase();
  const lowerValue = pattern.value.toLowerCase();

  switch (pattern.type) {
    case "contains":
      return lowerOutput.includes(lowerValue);

    case "not_contains":
      return !lowerOutput.includes(lowerValue);

    case "regex":
      try {
        const regex = new RegExp(pattern.value, "i");
        return regex.test(output);
      } catch {
        console.error("Invalid regex pattern:", pattern.value);
        return false;
      }

    case "format":
      // Simple format checks
      if (pattern.value === "json") {
        try {
          JSON.parse(output);
          return true;
        } catch {
          return false;
        }
      }
      if (pattern.value === "single_sentence") {
        return output.split(/[.!?]/).filter((s) => s.trim()).length <= 1;
      }
      return true;

    default:
      return false;
  }
}

/**
 * Execute a single probe against an AI model
 */
export async function executeProbe(
  probe: ProbeDefinition,
  executor: (input: string) => Promise<{ output: string; latencyMs: number }>
): Promise<ProbeExecutionResult> {
  const startTime = Date.now();

  try {
    const { output, latencyMs } = await executor(probe.probe_input);

    const patternsMatched = probe.expected_patterns.map((pattern, idx) => ({
      pattern_idx: idx,
      matched: matchPattern(output, pattern),
    }));

    const allMatched = patternsMatched.every((p) => p.matched);

    return {
      probe_name: probe.name,
      passed: allMatched,
      output,
      patterns_matched: patternsMatched,
      latency_ms: latencyMs,
    };
  } catch (error) {
    return {
      probe_name: probe.name,
      passed: false,
      output: "",
      patterns_matched: [],
      latency_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run all probes in a pack
 */
export async function runProbePack(
  pack: ProbePack,
  executor: (input: string) => Promise<{ output: string; latencyMs: number }>,
  enabledProbes?: string[]
): Promise<{
  packId: string;
  packSlug: string;
  results: ProbeExecutionResult[];
  passRate: number;
  allPassed: boolean;
}> {
  const probes = enabledProbes
    ? pack.probes.filter((p) => enabledProbes.includes(p.name))
    : pack.probes;

  const results: ProbeExecutionResult[] = [];

  for (const probe of probes) {
    const result = await executeProbe(probe, executor);
    results.push(result);
  }

  const passedCount = results.filter((r) => r.passed).length;
  const passRate = probes.length > 0 ? passedCount / probes.length : 1;

  return {
    packId: pack.id,
    packSlug: pack.slug,
    results,
    passRate,
    allPassed: passRate === 1,
  };
}

/**
 * Store probe execution results
 */
export async function storeProbeResults(
  supabase: SupabaseClient,
  probeId: string,
  results: ProbeExecutionResult[]
): Promise<void> {
  const records = results.map((r) => ({
    probe_id: probeId,
    probe_output: r.output,
    patterns_matched: r.patterns_matched,
    all_patterns_matched: r.passed,
    latency_ms: r.latency_ms,
  }));

  const { error } = await supabase.from("drift_probe_results").insert(records);

  if (error) {
    console.error("Error storing probe results:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Baseline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get auto-baseline config for a scope
 */
export async function getAutoBaselineConfig(
  supabase: SupabaseClient,
  tenantId: string,
  scopeType: string,
  scopeId?: string
): Promise<AutoBaselineConfig | null> {
  let query = supabase
    .from("auto_baseline_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("scope_type", scopeType)
    .eq("is_active", true);

  if (scopeId) {
    query = query.eq("scope_id", scopeId);
  }

  const { data, error } = await query.limit(1).single();

  if (error) {
    // Not found is ok
    if (error.code !== "PGRST116") {
      console.error("Error fetching auto-baseline config:", error);
    }
    return null;
  }

  return data;
}

/**
 * Create an auto-baseline config
 */
export async function createAutoBaselineConfig(
  supabase: SupabaseClient,
  config: Omit<AutoBaselineConfig, "id">
): Promise<AutoBaselineConfig | null> {
  const { data, error } = await supabase
    .from("auto_baseline_configs")
    .insert(config)
    .select()
    .single();

  if (error) {
    console.error("Error creating auto-baseline config:", error);
    return null;
  }

  return data;
}

/**
 * Trigger auto-baseline collection on approval
 */
export async function triggerAutoBaseline(
  tenantId: string,
  trigger: {
    type: "approval" | "deploy" | "manual";
    promptId?: string;
    promptVersion?: number;
    modelName?: string;
    applicationId?: string;
    triggeredBy?: string;
  }
): Promise<AutoBaselineJob | null> {
  const supabase = await createSupabaseAdmin();

  // Find matching config
  let scopeType: "prompt" | "model" | "application" = "prompt";
  let scopeId: string | undefined;

  if (trigger.promptId) {
    scopeType = "prompt";
    scopeId = trigger.promptId;
  } else if (trigger.modelName) {
    scopeType = "model";
    scopeId = trigger.modelName;
  } else if (trigger.applicationId) {
    scopeType = "application";
    scopeId = trigger.applicationId;
  }

  const config = await getAutoBaselineConfig(supabase, tenantId, scopeType, scopeId);

  if (!config) {
    // No auto-baseline configured for this scope
    return null;
  }

  // Check if trigger type matches
  if (config.trigger_on !== trigger.type && trigger.type !== "manual") {
    return null;
  }

  // Create the job
  const { data: job, error } = await supabase
    .from("auto_baseline_jobs")
    .insert({
      config_id: config.id,
      tenant_id: tenantId,
      trigger_type: trigger.type,
      trigger_metadata: {
        prompt_id: trigger.promptId,
        prompt_version: trigger.promptVersion,
        model_name: trigger.modelName,
        application_id: trigger.applicationId,
        triggered_by: trigger.triggeredBy,
      },
      status: "collecting",
      collection_start: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating auto-baseline job:", error);
    return null;
  }

  return job;
}

/**
 * Update auto-baseline job with collected samples
 */
export async function updateAutoBaselineJob(
  jobId: string,
  update: {
    samplesCollected?: number;
    status?: "collecting" | "completed" | "failed";
    collectionEnd?: string;
    baselineId?: string;
    errorMessage?: string;
  }
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  const { error } = await supabase
    .from("auto_baseline_jobs")
    .update({
      samples_collected: update.samplesCollected,
      status: update.status,
      collection_end: update.collectionEnd,
      baseline_id: update.baselineId,
      error_message: update.errorMessage,
    })
    .eq("id", jobId);

  if (error) {
    console.error("Error updating auto-baseline job:", error);
    throw error;
  }
}

/**
 * Complete auto-baseline collection and create baseline
 */
export async function completeAutoBaseline(
  jobId: string
): Promise<string | null> {
  const supabase = await createSupabaseAdmin();

  // Get the job
  const { data: job, error: jobError } = await supabase
    .from("auto_baseline_jobs")
    .select("*, config:auto_baseline_configs(*)")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    console.error("Error fetching auto-baseline job:", jobError);
    return null;
  }

  const config = job.config as AutoBaselineConfig;
  const trigger = job.trigger_metadata as Record<string, unknown>;

  // Collect samples from drift_output_samples or ai_run_outcomes
  const { data: samples } = await supabase
    .from("ai_run_outcomes")
    .select("*")
    .eq("tenant_id", job.tenant_id)
    .gte("created_at", job.collection_start)
    .limit(config.max_samples);

  if (!samples || samples.length < config.min_samples) {
    await updateAutoBaselineJob(jobId, {
      status: "failed",
      collectionEnd: new Date().toISOString(),
      errorMessage: `Insufficient samples: ${samples?.length || 0} < ${config.min_samples}`,
    });
    return null;
  }

  // Compute baseline data
  const qualityScores = samples
    .map((s) => s.quality_score)
    .filter((s): s is number => s !== null);

  const baselineData = {
    sample_count: samples.length,
    avg_quality_score:
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : null,
    quality_std_dev:
      qualityScores.length > 1
        ? Math.sqrt(
            qualityScores.reduce(
              (sum, s) =>
                sum +
                Math.pow(
                  s - qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length,
                  2
                ),
              0
            ) /
              (qualityScores.length - 1)
          )
        : null,
    success_rate:
      samples.length > 0
        ? samples.filter((s) => s.is_successful).length / samples.length
        : null,
    low_quality_rate:
      samples.length > 0
        ? samples.filter((s) => s.low_quality_flag).length / samples.length
        : null,
  };

  // Create baseline record
  const { data: baseline, error: baselineError } = await supabase
    .from("drift_baselines")
    .insert({
      tenant_id: job.tenant_id,
      name: `Auto-baseline: ${config.scope_type} ${trigger.prompt_id || trigger.model_name || trigger.application_id}`,
      description: `Automatically collected after ${job.trigger_type}`,
      application_id: trigger.application_id as string | undefined,
      model_id: null,
      prompt_id: trigger.prompt_id as string | undefined,
      baseline_type: "quality",
      baseline_data: baselineData,
      sample_count: samples.length,
      collection_start: job.collection_start,
      collection_end: new Date().toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (baselineError || !baseline) {
    await updateAutoBaselineJob(jobId, {
      status: "failed",
      collectionEnd: new Date().toISOString(),
      errorMessage: `Failed to create baseline: ${baselineError?.message}`,
    });
    return null;
  }

  // Update job as completed
  await updateAutoBaselineJob(jobId, {
    samplesCollected: samples.length,
    status: "completed",
    collectionEnd: new Date().toISOString(),
    baselineId: baseline.id,
  });

  return baseline.id;
}

/**
 * Get pending auto-baseline jobs
 */
export async function getPendingAutoBaselineJobs(
  tenantId?: string
): Promise<AutoBaselineJob[]> {
  const supabase = await createSupabaseAdmin();

  let query = supabase
    .from("auto_baseline_jobs")
    .select("*")
    .eq("status", "collecting");

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching pending auto-baseline jobs:", error);
    return [];
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Drift Alerts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a drift alert
 */
export async function createDriftAlert(
  supabase: SupabaseClient,
  alert: {
    tenantId: string;
    configId?: string;
    measurementId?: string;
    probeId?: string;
    driftType: string;
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description?: string;
    driftDetails: Record<string, unknown>;
  }
): Promise<string | null> {
  const { data, error } = await supabase
    .from("drift_alerts")
    .insert({
      tenant_id: alert.tenantId,
      config_id: alert.configId,
      measurement_id: alert.measurementId,
      probe_id: alert.probeId,
      drift_type: alert.driftType,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      drift_details: alert.driftDetails,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating drift alert:", error);
    return null;
  }

  return data.id;
}
