import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
import {
  buildOpsWorkerSystemPrompt,
  buildOpsWorkerUserMessage,
  parseOpsProposal,
  MAX_COMPLETION_TOKENS,
  DEFAULT_MODEL,
  CHEAP_MODEL,
  GPT4O_INPUT_COST_PER_M,
  GPT4O_OUTPUT_COST_PER_M,
  type OpsProposeRequest,
  type OpsProposeResponse,
  type OpsRunLog,
  type DecisionSource,
} from "@/lib/ai/prompts/opsWorker";
import { chatCompletion, getDefaultProvider, estimateCost } from "@/lib/ai/providers";
import type { AIProviderConfig, UserAISettings } from "@/types/ai-providers";
import { PROVIDER_TEMPLATES } from "@/types/ai-providers";
import type { TaskStatus, TaskPriority } from "@/types/workflows";
import { notifyOpsTaskFailed } from "@/lib/notifications/events";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/ops/propose
   Generate task proposals from a decision using AI
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createSupabaseServer();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request
    const body: OpsProposeRequest = await request.json();

    if (!body.decision_id) {
      return NextResponse.json({ error: "decision_id is required" }, { status: 400 });
    }

    // 3. Fetch the decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", body.decision_id)
      .eq("owner_id", user.id)
      .single();

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    // 4. Check budget
    const { data: budgetData } = await supabase
      .from("ai_cost_budgets")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    const budget = budgetData;
    let budgetWarning: string | undefined;

    if (budget) {
      const usedCents = budget.current_usage_cents || 0;
      const limitCents = budget.budget_cents || 0;
      const remaining = limitCents - usedCents;

      if (remaining <= 0 && budget.on_exceed === "block") {
        return NextResponse.json(
          { error: "Budget exceeded. Please increase your budget or wait for the next period." },
          { status: 402 }
        );
      }

      if (remaining < 50) {
        // Less than 50 cents remaining
        budgetWarning = `Low budget: ${(remaining / 100).toFixed(2)} remaining`;
      }
    }

    // 5. Fetch context: goals, projects, existing tasks
    const [goalsResult, projectsResult, tasksResult, profileResult] = await Promise.all([
      supabase
        .from("ai_user_goals")
        .select("id, title, category, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(20),
      supabase
        .from("projects")
        .select("id, name, status")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .limit(20),
      supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, project:projects(name)")
        .eq("owner_id", user.id)
        .not("status", "in", '("done","cancelled")')
        .limit(30),
      supabase
        .from("ai_user_profiles")
        .select("preferred_name, current_focus, important_context")
        .eq("user_id", user.id)
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

    // 6. Build prompts
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

    // 7. Determine model
    const model = body.cheap_mode ? CHEAP_MODEL : body.model || DEFAULT_MODEL;

    // 8. Create ops_run record (pending)
    const { data: opsRun, error: runCreateError } = await supabase
      .from("ops_runs")
      .insert({
        owner_id: user.id,
        tenant_id: decision.tenant_id,
        decision_id: decision.id,
        model,
        status: "pending",
      })
      .select()
      .single();

    if (runCreateError || !opsRun) {
      console.error("Failed to create ops run:", runCreateError);
      return NextResponse.json({ error: "Failed to create ops run" }, { status: 500 });
    }

    // 9. Get user's AI provider settings
    const { data: aiSettingsData } = await supabase
      .from("user_ai_settings")
      .select("settings")
      .eq("user_id", user.id)
      .single();

    const aiSettings = aiSettingsData?.settings as UserAISettings | undefined;

    // 10. Prepare messages
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    // 11. Call AI
    let assistantContent: string;
    let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
    let costCents = 0;

    // Determine provider
    let providerConfig: AIProviderConfig | undefined;
    let useOpenAIDirect = true;

    if (aiSettings?.providers && aiSettings.providers.length > 0) {
      providerConfig = getDefaultProvider(aiSettings.providers);
      if (providerConfig && providerConfig.type !== "openai") {
        useOpenAIDirect = false;
      }
    }

    try {
      if (useOpenAIDirect) {
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
          // Estimate cost for OpenAI
          costCents = Math.round(
            (usage.prompt_tokens * GPT4O_INPUT_COST_PER_M + usage.completion_tokens * GPT4O_OUTPUT_COST_PER_M) /
              1_000_000
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
      } else {
        // Fallback to OpenAI
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
      }
    } catch (aiError) {
      // Update run as failed
      await supabase
        .from("ops_runs")
        .update({
          status: "failed",
          error_message: aiError instanceof Error ? aiError.message : "AI call failed",
          duration_ms: Date.now() - startTime,
        })
        .eq("id", opsRun.id);

      // Send notification about the failure (if tenant context available)
      if (decision.tenant_id) {
        notifyOpsTaskFailed(
          decision.tenant_id,
          opsRun.id,
          "Ops Worker Proposal",
          aiError instanceof Error ? aiError.message : "AI call failed"
        ).catch((err) => {
          console.error("Failed to send ops failure notification:", err);
        });
      }

      throw aiError;
    }

    // 12. Parse proposal
    const proposal = parseOpsProposal(assistantContent);

    if (!proposal) {
      // Update run as failed
      await supabase
        .from("ops_runs")
        .update({
          status: "failed",
          error_message: "Failed to parse AI response",
          duration_ms: Date.now() - startTime,
        })
        .eq("id", opsRun.id);

      console.error("Failed to parse ops proposal:", assistantContent.slice(0, 500));
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // 13. Update ops_run with results
    const durationMs = Date.now() - startTime;

    await supabase
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

    // 14. Update decision status
    await supabase
      .from("decisions")
      .update({
        status: "proposed",
        ops_run_id: opsRun.id,
        summary: proposal.decision_summary,
      })
      .eq("id", decision.id);

    // 15. Update budget usage
    if (budget && costCents > 0) {
      await supabase
        .from("ai_cost_budgets")
        .update({
          current_usage_cents: (budget.current_usage_cents || 0) + costCents,
        })
        .eq("id", budget.id);
    }

    // 16. Build response
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

    const response: OpsProposeResponse = {
      run: updatedRun,
      proposal,
      budget: budget
        ? {
            used_cents: (budget.current_usage_cents || 0) + costCents,
            remaining_cents: (budget.budget_cents || 0) - (budget.current_usage_cents || 0) - costCents,
            warning: budgetWarning,
          }
        : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ops propose error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
