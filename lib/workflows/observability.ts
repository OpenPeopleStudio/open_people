/**
 * AI Observability
 * 
 * Feedback, cost tracking, evaluation
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { AIFeedback, AICost, AICostBudget } from "@/types/workflows";

/**
 * Record feedback for an AI response
 */
export async function recordFeedback(
  supabase: SupabaseClient,
  userId: string,
  feedback: {
    runId?: string;
    messageId?: string;
    rating: "good" | "bad" | "neutral";
    ratingScore?: number;
    feedbackType?: "accuracy" | "helpfulness" | "tone" | "completeness" | "safety";
    feedbackText?: string;
    issues?: string[];
    expectedAnswer?: string;
  }
): Promise<AIFeedback | null> {
  const { data, error } = await supabase
    .from("ai_feedback")
    .insert({
      user_id: userId,
      run_id: feedback.runId,
      message_id: feedback.messageId,
      rating: feedback.rating,
      rating_score: feedback.ratingScore,
      feedback_type: feedback.feedbackType,
      feedback_text: feedback.feedbackText,
      issues: feedback.issues || [],
      expected_answer: feedback.expectedAnswer,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Failed to record feedback:", error);
    return null;
  }
  
  return data;
}

/**
 * Get feedback summary for analysis
 */
export async function getFeedbackSummary(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<{
  total: number;
  good: number;
  bad: number;
  neutral: number;
  byType: Record<string, number>;
  commonIssues: { issue: string; count: number }[];
  averageScore: number | null;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  
  const { data: feedbacks } = await supabase
    .from("ai_feedback")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  
  if (!feedbacks || feedbacks.length === 0) {
    return {
      total: 0,
      good: 0,
      bad: 0,
      neutral: 0,
      byType: {},
      commonIssues: [],
      averageScore: null,
    };
  }
  
  const good = feedbacks.filter(f => f.rating === "good").length;
  const bad = feedbacks.filter(f => f.rating === "bad").length;
  const neutral = feedbacks.filter(f => f.rating === "neutral").length;
  
  // Count by type
  const byType: Record<string, number> = {};
  for (const f of feedbacks) {
    if (f.feedback_type) {
      byType[f.feedback_type] = (byType[f.feedback_type] || 0) + 1;
    }
  }
  
  // Count issues
  const issueCount: Record<string, number> = {};
  for (const f of feedbacks) {
    for (const issue of f.issues || []) {
      issueCount[issue] = (issueCount[issue] || 0) + 1;
    }
  }
  const commonIssues = Object.entries(issueCount)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Average score
  const scores = feedbacks.filter(f => f.rating_score).map(f => f.rating_score!);
  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;
  
  return {
    total: feedbacks.length,
    good,
    bad,
    neutral,
    byType,
    commonIssues,
    averageScore,
  };
}

/**
 * Get cost summary
 */
export async function getCostSummary(
  supabase: SupabaseClient,
  ownerId: string,
  period: "day" | "week" | "month" = "month"
): Promise<{
  totalCostCents: number;
  totalTokens: number;
  byModel: Record<string, { cost: number; tokens: number }>;
  byDay: { date: string; cost: number }[];
  budget?: AICostBudget;
}> {
  const now = new Date();
  let since: Date;
  
  switch (period) {
    case "day":
      since = new Date(now);
      since.setHours(0, 0, 0, 0);
      break;
    case "week":
      since = new Date(now);
      since.setDate(since.getDate() - 7);
      break;
    case "month":
      since = new Date(now);
      since.setMonth(since.getMonth() - 1);
      break;
  }
  
  const { data: costs } = await supabase
    .from("ai_costs")
    .select("*")
    .eq("owner_id", ownerId)
    .gte("created_at", since.toISOString());
  
  if (!costs || costs.length === 0) {
    return {
      totalCostCents: 0,
      totalTokens: 0,
      byModel: {},
      byDay: [],
    };
  }
  
  let totalCostCents = 0;
  let totalTokens = 0;
  const byModel: Record<string, { cost: number; tokens: number }> = {};
  const byDayMap: Record<string, number> = {};
  
  for (const cost of costs) {
    totalCostCents += cost.total_cost_cents;
    totalTokens += cost.total_tokens;
    
    if (!byModel[cost.model]) {
      byModel[cost.model] = { cost: 0, tokens: 0 };
    }
    byModel[cost.model].cost += cost.total_cost_cents;
    byModel[cost.model].tokens += cost.total_tokens;
    
    const day = cost.period_date;
    byDayMap[day] = (byDayMap[day] || 0) + cost.total_cost_cents;
  }
  
  const byDay = Object.entries(byDayMap)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Get current budget
  const { data: budget } = await supabase
    .from("ai_cost_budgets")
    .select("*")
    .eq("owner_id", ownerId)
    .single();
  
  return {
    totalCostCents,
    totalTokens,
    byModel,
    byDay,
    budget: budget || undefined,
  };
}

/**
 * Check if budget is exceeded
 */
export async function checkBudget(
  supabase: SupabaseClient,
  ownerId: string
): Promise<{
  hasbudget: boolean;
  exceeded: boolean;
  nearLimit: boolean;
  percentUsed: number;
  action?: "warn" | "block" | "downgrade_model";
}> {
  const { data: budget } = await supabase
    .from("ai_cost_budgets")
    .select("*")
    .eq("owner_id", ownerId)
    .single();
  
  if (!budget) {
    return { hasbudget: false, exceeded: false, nearLimit: false, percentUsed: 0 };
  }
  
  const percentUsed = (budget.current_usage_cents / budget.budget_cents) * 100;
  const exceeded = budget.current_usage_cents >= budget.budget_cents;
  const nearLimit = percentUsed >= budget.alert_threshold_percent;
  
  // Send alert if near limit and not already sent
  if (nearLimit && !budget.alert_sent) {
    await supabase
      .from("ai_cost_budgets")
      .update({ alert_sent: true })
      .eq("id", budget.id);
    // Would trigger notification here
  }
  
  return {
    hasbudget: true,
    exceeded,
    nearLimit,
    percentUsed,
    action: exceeded ? budget.on_exceed : undefined,
  };
}

/**
 * Set or update budget
 */
export async function setBudget(
  supabase: SupabaseClient,
  ownerId: string,
  budgetConfig: {
    periodType: "daily" | "weekly" | "monthly";
    budgetCents: number;
    alertThresholdPercent?: number;
    onExceed?: "warn" | "block" | "downgrade_model";
  }
): Promise<AICostBudget | null> {
  const now = new Date();
  let periodStart: Date;
  
  switch (budgetConfig.periodType) {
    case "daily":
      periodStart = new Date(now);
      periodStart.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - periodStart.getDay());
      periodStart.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  
  const { data, error } = await supabase
    .from("ai_cost_budgets")
    .upsert({
      owner_id: ownerId,
      period_type: budgetConfig.periodType,
      budget_cents: budgetConfig.budgetCents,
      alert_threshold_percent: budgetConfig.alertThresholdPercent || 80,
      on_exceed: budgetConfig.onExceed || "warn",
      period_start: periodStart.toISOString().split("T")[0],
      current_usage_cents: 0,
      alert_sent: false,
    }, {
      onConflict: "owner_id",
    })
    .select()
    .single();
  
  if (error) {
    console.error("Failed to set budget:", error);
    return null;
  }
  
  return data;
}

/**
 * Model pricing (cents per 1K tokens)
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.5, output: 1.5 },
  "gpt-4o-mini": { input: 0.015, output: 0.06 },
  "gpt-4-turbo": { input: 1.0, output: 3.0 },
  "gpt-3.5-turbo": { input: 0.05, output: 0.15 },
  "claude-3-opus": { input: 1.5, output: 7.5 },
  "claude-3-sonnet": { input: 0.3, output: 1.5 },
  "claude-3-haiku": { input: 0.025, output: 0.125 },
  "text-embedding-3-small": { input: 0.002, output: 0 },
  "text-embedding-3-large": { input: 0.013, output: 0 },
};

/**
 * Calculate cost for tokens
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCostCents: number; outputCostCents: number; totalCostCents: number } {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["gpt-4o"];
  
  const inputCostCents = Math.ceil((inputTokens / 1000) * pricing.input);
  const outputCostCents = Math.ceil((outputTokens / 1000) * pricing.output);
  
  return {
    inputCostCents,
    outputCostCents,
    totalCostCents: inputCostCents + outputCostCents,
  };
}
