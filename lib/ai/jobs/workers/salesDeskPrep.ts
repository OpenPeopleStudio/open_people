import OpenAI from "openai";

import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildSalesDeskSystemPrompt,
  buildSalesDeskUserMessage,
  parseSalesPrepResponse,
  DEFAULT_MODEL,
  CHEAP_MODEL,
  MAX_COMPLETION_TOKENS,
  GPT4O_INPUT_COST_PER_M,
  GPT4O_OUTPUT_COST_PER_M,
  GPT4O_MINI_INPUT_COST_PER_M,
  GPT4O_MINI_OUTPUT_COST_PER_M,
  type SalesPrepRequest,
  type SalesPrepResponse,
} from "@/lib/ai/prompts/salesDesk";
import { chatCompletion, getDefaultProvider, estimateCost } from "@/lib/ai/providers";
import type { AIProviderConfig, UserAISettings } from "@/types/ai-providers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSalesPrepForUser(params: {
  ownerId: string;
  tenantId: string;
  request: SalesPrepRequest;
}): Promise<SalesPrepResponse> {
  const startTime = Date.now();
  const supabaseAdmin = await createSupabaseAdmin();

  const { ownerId, tenantId, request } = params;
  const cheapMode = request.cheap_mode === true;

  // 1) Get user profile for personalization
  const { data: profile } = await supabaseAdmin
    .from("ai_user_profiles")
    .select("preferred_name")
    .eq("user_id", ownerId)
    .single();

  // 2) Budget check
  const { data: budgetData } = await supabaseAdmin
    .from("ai_cost_budgets")
    .select("*")
    .eq("owner_id", ownerId)
    .single();

  const budget = budgetData;

  // 3) Build prompts
  const systemPrompt = buildSalesDeskSystemPrompt(profile?.preferred_name);
  const userMessage = buildSalesDeskUserMessage(request);

  const model = cheapMode ? CHEAP_MODEL : DEFAULT_MODEL;

  // 4) Provider settings
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

  // 5) Call AI
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
      const inputCost = cheapMode ? GPT4O_MINI_INPUT_COST_PER_M : GPT4O_INPUT_COST_PER_M;
      const outputCost = cheapMode ? GPT4O_MINI_OUTPUT_COST_PER_M : GPT4O_OUTPUT_COST_PER_M;
      costCents = Math.round(
        (usage.prompt_tokens * inputCost + usage.completion_tokens * outputCost) / 1_000_000
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

  // 6) Parse response
  const response = parseSalesPrepResponse(assistantContent);
  if (!response) {
    throw new Error("Failed to parse AI response for sales prep");
  }

  const durationMs = Date.now() - startTime;

  // 7) Log AI run
  await supabaseAdmin.from("ai_runs").insert({
    owner_id: ownerId,
    tenant_id: tenantId,
    worker_id: "sales-desk",
    job_type: "sales_prep",
    model,
    prompt_tokens: usage?.prompt_tokens || 0,
    completion_tokens: usage?.completion_tokens || 0,
    total_tokens: usage?.total_tokens || 0,
    cost_cents: costCents,
    duration_ms: durationMs,
    status: "completed",
  });

  // 8) Update budget
  if (budget && costCents > 0) {
    await supabaseAdmin
      .from("ai_cost_budgets")
      .update({
        current_usage_cents: (budget.current_usage_cents || 0) + costCents,
      })
      .eq("id", budget.id);
  }

  return response;
}
