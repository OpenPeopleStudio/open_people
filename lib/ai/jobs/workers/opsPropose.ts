import OpenAI from "openai";

import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildOpsWorkerSystemPrompt,
  buildOpsWorkerUserMessage,
  parseOpsProposal,
  MAX_COMPLETION_TOKENS,
  DEFAULT_MODEL,
  CHEAP_MODEL,
  GPT4O_INPUT_COST_PER_M,
  GPT4O_OUTPUT_COST_PER_M,
  type OpsProposeResponse,
  type OpsRunLog,
  type DecisionSource,
} from "@/lib/ai/prompts/opsWorker";
import { chatCompletion, getDefaultProvider, estimateCost } from "@/lib/ai/providers";
import type { AIProviderConfig, UserAISettings } from "@/types/ai-providers";
import type { TaskStatus, TaskPriority } from "@/types/workflows";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateOpsProposalForDecision(params: {
  ownerId: string;
  decisionId: string;
  cheapMode: boolean;
}): Promise<OpsProposeResponse> {
  const startTime = Date.now();
  const supabaseAdmin = await createSupabaseAdmin();

  const ownerId = params.ownerId;

  // 1) Fetch the decision (guard by owner)
  const { data: decision, error: decisionError } = await supabaseAdmin
    .from("decisions")
    .select("*")
    .eq("id", params.decisionId)
    .eq("owner_id", ownerId)
    .single();

  if (decisionError || !decision) {
    throw new Error("Decision not found");
  }

  // 2) Budget (best-effort; reused by UI)
  const { data: budgetData } = await supabaseAdmin
    .from("ai_cost_budgets")
    .select("*")
    .eq("owner_id", ownerId)
    .single();

  const budget = budgetData;
  let budgetWarning: string | undefined;

  if (budget) {
    const usedCents = budget.current_usage_cents || 0;
    const limitCents = budget.budget_cents || 0;
    const remaining = limitCents - usedCents;
    if (remaining < 50) {
      budgetWarning = `Low budget: ${(remaining / 100).toFixed(2)} remaining`;
    }
  }

  // 3) Context (same as existing route)
  const [goalsResult, projectsResult, tasksResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from("ai_user_goals")
      .select("id, title, category, status")
      .eq("user_id", ownerId)
      .eq("status", "active")
      .limit(20),
    supabaseAdmin
      .from("projects")
      .select("id, name, status")
      .eq("owner_id", ownerId)
      .eq("status", "active")
      .limit(20),
    supabaseAdmin
      .from("tasks")
      .select("id, title, status, priority, due_date, project:projects(name)")
      .eq("owner_id", ownerId)
      .not("status", "in", '("done","cancelled")')
      .limit(30),
    supabaseAdmin
      .from("ai_user_profiles")
      .select("preferred_name, current_focus, important_context")
      .eq("user_id", ownerId)
      .single(),
  ]);

  const goals = goalsResult.data || [];
  const projects = projectsResult.data || [];
  const existingTasks = (tasksResult.data || []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as TaskStatus,
    priority: t.priority as TaskPriority,
    due_date: t.due_date,
    project_name: (Array.isArray(t.project) ? t.project[0]?.name : (t.project as { name: string } | null)?.name),
  }));
  const profile = profileResult.data;

  // 4) Prompts
  const userContext = [
    profile?.current_focus && `Current Focus: ${profile.current_focus}`,
    profile?.important_context && `Important Context: ${profile.important_context}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = buildOpsWorkerSystemPrompt(profile?.preferred_name, userContext || undefined);
  const today = new Date().toISOString().split("T")[0];

  const userMessage = buildOpsWorkerUserMessage({
    decisionId: decision.id,
    rawText: decision.raw_text,
    source: decision.source as DecisionSource,
    goals,
    projects,
    existingTasks,
    today,
  });

  // 5) Model selection (cheap mode)
  const model = params.cheapMode ? CHEAP_MODEL : DEFAULT_MODEL;

  // 6) Create ops_run row (pending)
  const { data: opsRun, error: runCreateError } = await supabaseAdmin
    .from("ops_runs")
    .insert({
      owner_id: ownerId,
      tenant_id: decision.tenant_id,
      decision_id: decision.id,
      model,
      status: "pending",
    })
    .select()
    .single();

  if (runCreateError || !opsRun) {
    throw new Error("Failed to create ops run");
  }

  // 7) Provider settings
  const { data: aiSettingsData } = await supabaseAdmin
    .from("user_ai_settings")
    .select("settings")
    .eq("user_id", ownerId)
    .single();

  const aiSettings = aiSettingsData?.settings as UserAISettings | undefined;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  // 8) Call AI
  let assistantContent = "";
  let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
  let costCents = 0;

  let providerConfig: AIProviderConfig | undefined;
  let useOpenAIDirect = true;

  if (aiSettings?.providers && aiSettings.providers.length > 0) {
    providerConfig = getDefaultProvider(aiSettings.providers);
    if (providerConfig && providerConfig.type !== "openai") {
      useOpenAIDirect = false;
    }
  }

  if (useOpenAIDirect) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set (required for OpenAI provider)");
    }
    const completion = await openai.chat.completions.create({
      model,
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: MAX_COMPLETION_TOKENS,
      response_format: { type: "json_object" },
    });

    assistantContent = completion.choices[0].message.content || "";
    usage = completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        }
      : undefined;

    if (usage) {
      costCents = Math.round(
        (usage.prompt_tokens * GPT4O_INPUT_COST_PER_M + usage.completion_tokens * GPT4O_OUTPUT_COST_PER_M) / 1_000_000
      );
    }
  } else if (providerConfig) {
    const completion = await chatCompletion(providerConfig, {
      model: providerConfig.defaultModel,
      messages,
      temperature: 0.7,
      max_tokens: MAX_COMPLETION_TOKENS,
    });

    assistantContent = completion.choices[0]?.message.content || "";
    usage = completion.usage;

    if (usage) {
      costCents = Math.round(estimateCost(providerConfig, usage.prompt_tokens, usage.completion_tokens) * 100);
    }
  }

  // 9) Parse proposal
  const proposal = parseOpsProposal(assistantContent);
  if (!proposal) {
    await supabaseAdmin
      .from("ops_runs")
      .update({
        status: "failed",
        error_message: "Failed to parse AI response",
        duration_ms: Date.now() - startTime,
      })
      .eq("id", opsRun.id);
    throw new Error("Failed to parse AI response");
  }

  const durationMs = Date.now() - startTime;

  // 10) Persist run + decision summary
  await supabaseAdmin
    .from("ops_runs")
    .update({
      proposal,
      status: "completed",
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_tokens: usage?.total_tokens,
      cost_cents: costCents,
      duration_ms: durationMs,
    })
    .eq("id", opsRun.id);

  await supabaseAdmin
    .from("decisions")
    .update({
      status: "proposed",
      ops_run_id: opsRun.id,
      summary: proposal.decision_summary,
    })
    .eq("id", decision.id);

  if (budget && costCents > 0) {
    await supabaseAdmin
      .from("ai_cost_budgets")
      .update({
        current_usage_cents: (budget.current_usage_cents || 0) + costCents,
      })
      .eq("id", budget.id);
  }

  const updatedRun: OpsRunLog = {
    id: opsRun.id,
    owner_id: opsRun.owner_id,
    tenant_id: opsRun.tenant_id,
    decision_id: opsRun.decision_id,
    model,
    proposal,
    status: "completed",
    error_message: null,
    prompt_tokens: usage?.prompt_tokens || null,
    completion_tokens: usage?.completion_tokens || null,
    total_tokens: usage?.total_tokens || null,
    cost_cents: costCents,
    duration_ms: durationMs,
    created_task_ids: [],
    updated_task_ids: [],
    committed_by: null,
    committed_at: null,
    created_at: opsRun.created_at,
  };

  const usedCents = Number(budget?.current_usage_cents ?? 0) + costCents;
  const remainingCents =
    Number(budget?.budget_cents ?? 0) - Number(budget?.current_usage_cents ?? 0) - costCents;

  const response: OpsProposeResponse = {
    run: updatedRun,
    proposal,
  };

  if (budget) {
    response.budget = {
      used_cents: usedCents,
      remaining_cents: remainingCents,
      ...(budgetWarning ? { warning: budgetWarning } : {}),
    };
  }

  return response;
}
