/* ═══════════════════════════════════════════════════════════════════════════
   QA Sampling Service
   Periodic sampling and calibration for reviewer quality assurance
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SamplingStrategy = "random" | "stratified" | "targeted";

export type SamplingConfig = {
  strategy: SamplingStrategy;
  percentage: number; // 0-100
  min_samples_per_reviewer?: number;
  target_decision_types?: string[]; // For stratified sampling
  target_risk_levels?: string[]; // For targeted sampling
};

export type QAQueueItem = {
  decision_id: string;
  reviewer_id: string;
  original_decision: string;
  item_id: string;
  review_content: Record<string, unknown>;
  sampling_reason: string;
};

export type DisagreementMetrics = {
  reviewer_id: string;
  reviewer_name: string;
  total_sampled: number;
  total_correct: number;
  accuracy_rate: number;
  disagreement_by_decision: Record<string, { sampled: number; correct: number }>;
  common_disagreements: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Select Decisions for QA Sampling
// ─────────────────────────────────────────────────────────────────────────────

export async function selectDecisionsForQA(
  tenantId: string,
  config: SamplingConfig,
  sinceDays: number = 7
): Promise<QAQueueItem[]> {
  const supabase = await createSupabaseAdmin();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDays);

  // Get decisions that haven't been QA'd yet
  const { data: decisions, error } = await supabase
    .from("hitl_decisions")
    .select(`
      id,
      reviewer_id,
      decision,
      item_id,
      item:hitl_items!inner(
        id,
        tenant_id,
        review_content,
        risk_evaluation:risk_evaluations(risk_level)
      )
    `)
    .eq("item.tenant_id", tenantId)
    .gte("created_at", sinceDate.toISOString())
    .order("created_at", { ascending: false });

  if (error || !decisions) {
    console.error("Error fetching decisions for QA:", error);
    return [];
  }

  // Filter out already QA'd decisions
  const decisionIds = decisions.map((d) => d.id);
  const { data: existingQAs } = await supabase
    .from("hitl_qa_reviews")
    .select("decision_id")
    .in("decision_id", decisionIds);

  const qaDecisionIds = new Set(existingQAs?.map((q) => q.decision_id) || []);
  const eligibleDecisions = decisions.filter((d) => !qaDecisionIds.has(d.id));

  // Apply sampling strategy
  let sampled: typeof eligibleDecisions = [];

  switch (config.strategy) {
    case "random":
      sampled = randomSample(eligibleDecisions, config.percentage);
      break;

    case "stratified":
      sampled = stratifiedSample(
        eligibleDecisions,
        config.percentage,
        config.target_decision_types
      );
      break;

    case "targeted":
      sampled = targetedSample(
        eligibleDecisions,
        config.percentage,
        config.target_risk_levels
      );
      break;
  }

  // Ensure minimum samples per reviewer
  if (config.min_samples_per_reviewer) {
    sampled = ensureMinSamplesPerReviewer(
      eligibleDecisions,
      sampled,
      config.min_samples_per_reviewer
    );
  }

  // Transform to QA queue items
  return sampled.map((d) => {
    const itemData = Array.isArray(d.item) ? d.item[0] : d.item;
    return {
      decision_id: d.id,
      reviewer_id: d.reviewer_id,
      original_decision: d.decision,
      item_id: d.item_id,
      review_content: (itemData as { review_content?: Record<string, unknown> })?.review_content || {},
      sampling_reason: config.strategy,
    };
  });
}

function randomSample<T>(items: T[], percentage: number): T[] {
  const count = Math.ceil(items.length * (percentage / 100));
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function stratifiedSample<T extends { decision: string }>(
  items: T[],
  percentage: number,
  targetTypes?: string[]
): T[] {
  // Group by decision type
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const type = item.decision;
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(item);
  }

  // Sample from each group
  const sampled: T[] = [];
  for (const [type, group] of groups) {
    // If target types specified, only sample from those
    if (targetTypes && targetTypes.length > 0 && !targetTypes.includes(type)) {
      continue;
    }
    const count = Math.ceil(group.length * (percentage / 100));
    const shuffled = [...group].sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, count));
  }

  return sampled;
}

function targetedSample<T extends { item: { risk_evaluation?: { risk_level: string }[] | { risk_level: string } } | { risk_evaluation?: { risk_level: string }[] | { risk_level: string } }[] }>(
  items: T[],
  percentage: number,
  targetRiskLevels?: string[]
): T[] {
  // Filter to target risk levels
  let filtered = items;
  if (targetRiskLevels && targetRiskLevels.length > 0) {
    filtered = items.filter((i) => {
      const item = Array.isArray(i.item) ? i.item[0] : i.item;
      const riskEval = item?.risk_evaluation;
      const riskLevel = Array.isArray(riskEval)
        ? riskEval[0]?.risk_level
        : riskEval?.risk_level;
      return targetRiskLevels.includes(riskLevel || "");
    });
  }

  return randomSample(filtered, percentage);
}

function ensureMinSamplesPerReviewer<T extends { reviewer_id: string }>(
  allItems: T[],
  sampled: T[],
  minSamples: number
): T[] {
  // Count samples per reviewer
  const reviewerCounts = new Map<string, number>();
  for (const item of sampled) {
    const count = reviewerCounts.get(item.reviewer_id) || 0;
    reviewerCounts.set(item.reviewer_id, count + 1);
  }

  // Get unique reviewers from all items
  const reviewers = new Set(allItems.map((i) => i.reviewer_id));
  const sampledSet = new Set(sampled.map((s) => (s as { id?: string }).id));

  // Add more samples for reviewers below minimum
  const additional: T[] = [];
  for (const reviewerId of reviewers) {
    const current = reviewerCounts.get(reviewerId) || 0;
    if (current < minSamples) {
      const needed = minSamples - current;
      const available = allItems.filter(
        (i) =>
          i.reviewer_id === reviewerId &&
          !sampledSet.has((i as { id?: string }).id)
      );
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      additional.push(...shuffled.slice(0, needed));
    }
  }

  return [...sampled, ...additional];
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculate Disagreement Metrics
// ─────────────────────────────────────────────────────────────────────────────

export async function calculateDisagreementMetrics(
  tenantId: string,
  sinceDays: number = 30
): Promise<DisagreementMetrics[]> {
  const supabase = await createSupabaseAdmin();

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - sinceDays);

  // Get QA reviews with reviewer info
  const { data: qaReviews, error } = await supabase
    .from("hitl_qa_reviews")
    .select(`
      *,
      decision:hitl_decisions!inner(
        reviewer_id,
        decision,
        item:hitl_items!inner(tenant_id)
      )
    `)
    .eq("decision.item.tenant_id", tenantId)
    .gte("created_at", sinceDate.toISOString());

  if (error || !qaReviews) {
    console.error("Error fetching QA reviews:", error);
    return [];
  }

  // Get reviewer names
  const reviewerIds = [...new Set(qaReviews.map((q) => (q.decision as { reviewer_id: string }).reviewer_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", reviewerIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

  // Aggregate by reviewer
  const reviewerMetrics = new Map<string, DisagreementMetrics>();

  for (const qa of qaReviews) {
    const decision = qa.decision as { reviewer_id: string; decision: string };
    const reviewerId = decision.reviewer_id;
    const originalDecision = decision.decision;

    if (!reviewerMetrics.has(reviewerId)) {
      reviewerMetrics.set(reviewerId, {
        reviewer_id: reviewerId,
        reviewer_name: profileMap.get(reviewerId) || "Unknown",
        total_sampled: 0,
        total_correct: 0,
        accuracy_rate: 0,
        disagreement_by_decision: {},
        common_disagreements: [],
      });
    }

    const metrics = reviewerMetrics.get(reviewerId)!;
    metrics.total_sampled++;
    if (qa.was_correct) {
      metrics.total_correct++;
    }

    // Track by decision type
    if (!metrics.disagreement_by_decision[originalDecision]) {
      metrics.disagreement_by_decision[originalDecision] = { sampled: 0, correct: 0 };
    }
    metrics.disagreement_by_decision[originalDecision].sampled++;
    if (qa.was_correct) {
      metrics.disagreement_by_decision[originalDecision].correct++;
    }

    // Track disagreement reasons
    if (!qa.was_correct && qa.disagreement_reason) {
      metrics.common_disagreements.push(qa.disagreement_reason);
    }
  }

  // Calculate accuracy rates and clean up
  const results: DisagreementMetrics[] = [];
  for (const metrics of reviewerMetrics.values()) {
    metrics.accuracy_rate =
      metrics.total_sampled > 0
        ? Math.round((metrics.total_correct / metrics.total_sampled) * 100)
        : 0;

    // Get top 3 common disagreements
    const reasonCounts = new Map<string, number>();
    for (const reason of metrics.common_disagreements) {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }
    metrics.common_disagreements = [...reasonCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);

    results.push(metrics);
  }

  // Sort by accuracy rate ascending (worst first)
  return results.sort((a, b) => a.accuracy_rate - b.accuracy_rate);
}

// ─────────────────────────────────────────────────────────────────────────────
// Get QA Queue for a Reviewer
// ─────────────────────────────────────────────────────────────────────────────

export async function getQAQueue(
  tenantId: string,
  qaReviewerId: string,
  limit: number = 20
): Promise<QAQueueItem[]> {
  const supabase = await createSupabaseAdmin();

  // Get decisions that need QA and aren't by this reviewer
  const { data: decisions, error } = await supabase
    .from("hitl_decisions")
    .select(`
      id,
      reviewer_id,
      decision,
      item_id,
      item:hitl_items!inner(
        id,
        tenant_id,
        review_content
      )
    `)
    .eq("item.tenant_id", tenantId)
    .neq("reviewer_id", qaReviewerId)
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error || !decisions) {
    console.error("Error fetching QA queue:", error);
    return [];
  }

  // Filter out already QA'd
  const decisionIds = decisions.map((d) => d.id);
  const { data: existingQAs } = await supabase
    .from("hitl_qa_reviews")
    .select("decision_id")
    .in("decision_id", decisionIds);

  const qaDecisionIds = new Set(existingQAs?.map((q) => q.decision_id) || []);
  const eligible = decisions.filter((d) => !qaDecisionIds.has(d.id));

  return eligible.slice(0, limit).map((d) => {
    const itemData = Array.isArray(d.item) ? d.item[0] : d.item;
    return {
      decision_id: d.id,
      reviewer_id: d.reviewer_id,
      original_decision: d.decision,
      item_id: d.item_id,
      review_content: (itemData as { review_content?: Record<string, unknown> })?.review_content || {},
      sampling_reason: "qa_queue" as const,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Submit QA Review
// ─────────────────────────────────────────────────────────────────────────────

export async function submitQAReview(
  decisionId: string,
  qaReviewerId: string,
  wasCorrect: boolean,
  feedback?: string,
  correctDecision?: string,
  disagreementReason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseAdmin();

  const { error } = await supabase.from("hitl_qa_reviews").insert({
    decision_id: decisionId,
    qa_reviewer_id: qaReviewerId,
    was_correct: wasCorrect,
    feedback,
    correct_decision: correctDecision,
    disagreement_reason: disagreementReason,
  });

  if (error) {
    console.error("Error submitting QA review:", error);
    return { success: false, error: error.message };
  }

  // Update reviewer metrics
  await updateReviewerQAMetrics(supabase, decisionId, wasCorrect);

  return { success: true };
}

async function updateReviewerQAMetrics(
  supabase: Awaited<ReturnType<typeof createSupabaseAdmin>>,
  decisionId: string,
  wasCorrect: boolean
) {
  // Get the decision to find reviewer and tenant
  const { data: decision } = await supabase
    .from("hitl_decisions")
    .select(`
      reviewer_id,
      item:hitl_items!inner(tenant_id)
    `)
    .eq("id", decisionId)
    .single();

  if (!decision) return;

  const reviewerId = decision.reviewer_id;
  const itemData = Array.isArray(decision.item) ? decision.item[0] : decision.item;
  const tenantId = (itemData as { tenant_id: string }).tenant_id;

  // Get or create today's metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("hitl_reviewer_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("reviewer_id", reviewerId)
    .eq("bucket_timestamp", today.toISOString())
    .eq("bucket_interval", "day")
    .single();

  if (existing) {
    await supabase
      .from("hitl_reviewer_metrics")
      .update({
        qa_sampled: (existing.qa_sampled || 0) + 1,
        qa_correct: (existing.qa_correct || 0) + (wasCorrect ? 1 : 0),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("hitl_reviewer_metrics").insert({
      tenant_id: tenantId,
      reviewer_id: reviewerId,
      bucket_timestamp: today.toISOString(),
      bucket_interval: "day",
      items_reviewed: 0,
      qa_sampled: 1,
      qa_correct: wasCorrect ? 1 : 0,
    });
  }
}
