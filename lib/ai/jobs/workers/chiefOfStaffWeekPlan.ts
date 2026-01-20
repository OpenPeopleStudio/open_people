import OpenAI from "openai";

import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildChiefOfStaffSystemPrompt,
  buildChiefOfStaffUserMessage,
  parsePlanProposal,
  MAX_COMPLETION_TOKENS,
  DEFAULT_MODEL,
  COST_WARNING_THRESHOLD_CENTS,
  type WeekPlanRequest,
  type WeekPlanResponse,
} from "@/lib/ai/prompts/chiefOfStaff";
import { chatCompletion, getDefaultProvider, estimateCost } from "@/lib/ai/providers";
import type { AIProviderConfig, UserAISettings } from "@/types/ai-providers";
import { PROVIDER_TEMPLATES } from "@/types/ai-providers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateWeekPlanForUser(params: {
  ownerId: string;
  request: WeekPlanRequest;
}): Promise<WeekPlanResponse> {
  const startTime = Date.now();
  const supabaseAdmin = await createSupabaseAdmin();

  const body = params.request;
  const ownerId = params.ownerId;

  // 1) Date range (7-day window)
  const startDate = body.start_date ? new Date(body.start_date) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  endDate.setHours(23, 59, 59, 999);

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // 2) Tenant context (optional)
  const { data: profileTenant } = await supabaseAdmin
    .from("709_profiles")
    .select("tenant_id")
    .eq("id", ownerId)
    .single();

  // 3) Fetch AI profile for personalization
  const { data: profile } = await supabaseAdmin
    .from("ai_user_profiles")
    .select("preferred_name, current_focus, important_context")
    .eq("user_id", ownerId)
    .single();

  // 4) Fetch active goals
  const { data: goals } = await supabaseAdmin
    .from("ai_user_goals")
    .select("id, title, description, why_important, category, status, progress")
    .eq("user_id", ownerId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  // 5) Fetch active tasks
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select(
      `
      id, title, description, status, priority, due_date,
      project_id, tags, estimated_minutes,
      project:projects(id, name)
    `
    )
    .eq("owner_id", ownerId)
    .not("status", "in", '("done","cancelled")')
    .order("priority", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(50);

  // 6) Fetch active projects
  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, name, status")
    .eq("owner_id", ownerId)
    .eq("status", "active")
    .limit(20);

  // 7) Fetch recent notes (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentNotes } = await supabaseAdmin
    .from("notes")
    .select("title, excerpt")
    .eq("owner_id", ownerId)
    .gte("updated_at", sevenDaysAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(10);

  // 8) Build prompts
  const userContext = [
    profile?.current_focus && `Current Focus: ${profile.current_focus}`,
    profile?.important_context && `Important Context: ${profile.important_context}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = buildChiefOfStaffSystemPrompt(profile?.preferred_name, userContext || undefined);

  const userMessage = buildChiefOfStaffUserMessage({
    startDate: startDateStr,
    endDate: endDateStr,
    goals: (goals || []).map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      why_important: g.why_important,
      category: g.category,
      status: g.status,
      progress: g.progress || 0,
    })),
    activeTasks: (tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      project_id: t.project_id,
      project_name: (Array.isArray(t.project) ? t.project[0]?.name : (t.project as { name: string } | null)?.name),
      tags: t.tags,
      estimated_minutes: t.estimated_minutes,
    })),
    projects: (projects || []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
    })),
    recentNotes: (recentNotes || []).map((n) => ({
      title: n.title,
      excerpt: n.excerpt,
    })),
    request: body,
  });

  // 9) Provider settings
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

  // 10) Call AI
  let assistantContent = "";
  let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
  let estimatedCostCents = 0;

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
      model: DEFAULT_MODEL,
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
      const openaiConfig = PROVIDER_TEMPLATES.openai;
      estimatedCostCents =
        estimateCost(openaiConfig as AIProviderConfig, usage.prompt_tokens, usage.completion_tokens) * 100;
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
      estimatedCostCents = estimateCost(providerConfig, usage.prompt_tokens, usage.completion_tokens) * 100;
    }
  }

  const proposal = parsePlanProposal(assistantContent);
  if (!proposal) {
    throw new Error("Failed to parse AI response into a valid plan proposal");
  }

  if (estimatedCostCents > COST_WARNING_THRESHOLD_CENTS) {
    console.warn(
      `Plan generation cost (${estimatedCostCents}¢) exceeded warning threshold (${COST_WARNING_THRESHOLD_CENTS}¢)`
    );
  }

  return {
    proposal,
    context_used: {
      goals_count: goals?.length || 0,
      active_tasks_count: tasks?.length || 0,
      notes_count: recentNotes?.length || 0,
    },
    usage,
    estimated_cost_cents: Math.round(estimatedCostCents * 100) / 100,
    duration_ms: Date.now() - startTime,
    // helpful extra context for downstream
    ...(profileTenant?.tenant_id ? { tenant_id: profileTenant.tenant_id } : {}),
  } as unknown as WeekPlanResponse;
}

