import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
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

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/ai/plan/week
   Generate a weekly plan proposal using AI
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = await createSupabaseServer();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Parse request body
    const body: WeekPlanRequest = await request.json();
    
    // 3. Calculate date range (7-day rolling window)
    const startDate = body.start_date 
      ? new Date(body.start_date)
      : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);
    
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];
    
    // 4. Fetch user's AI profile for personalization
    const { data: profile } = await supabase
      .from("ai_user_profiles")
      .select("preferred_name, current_focus, important_context")
      .eq("user_id", user.id)
      .single();
    
    // 5. Fetch active goals
    const { data: goals } = await supabase
      .from("ai_user_goals")
      .select("id, title, description, why_important, category, status, progress")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);
    
    // 6. Fetch active tasks (not done/cancelled)
    const { data: tasks } = await supabase
      .from("tasks")
      .select(`
        id, title, description, status, priority, due_date, 
        project_id, tags, estimated_minutes,
        project:projects(id, name)
      `)
      .eq("owner_id", user.id)
      .not("status", "in", '("done","cancelled")')
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(50);
    
    // 7. Fetch active projects
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, status")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .limit(20);
    
    // 8. Fetch recent notes for context (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentNotes } = await supabase
      .from("notes")
      .select("title, excerpt")
      .eq("owner_id", user.id)
      .gte("updated_at", sevenDaysAgo.toISOString())
      .order("updated_at", { ascending: false })
      .limit(10);
    
    // 9. Build system prompt with user context
    const userContext = [
      profile?.current_focus && `Current Focus: ${profile.current_focus}`,
      profile?.important_context && `Important Context: ${profile.important_context}`,
    ].filter(Boolean).join("\n");
    
    const systemPrompt = buildChiefOfStaffSystemPrompt(
      profile?.preferred_name,
      userContext || undefined
    );
    
    // 10. Build user message with all context
    const userMessage = buildChiefOfStaffUserMessage({
      startDate: startDateStr,
      endDate: endDateStr,
      goals: (goals || []).map(g => ({
        id: g.id,
        title: g.title,
        description: g.description,
        why_important: g.why_important,
        category: g.category,
        status: g.status,
        progress: g.progress || 0,
      })),
      activeTasks: (tasks || []).map(t => ({
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
      projects: (projects || []).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
      })),
      recentNotes: (recentNotes || []).map(n => ({
        title: n.title,
        excerpt: n.excerpt,
      })),
      request: body,
    });
    
    // 11. Get user's AI provider settings
    const { data: aiSettingsData } = await supabase
      .from("user_ai_settings")
      .select("settings")
      .eq("user_id", user.id)
      .single();
    
    const aiSettings = aiSettingsData?.settings as UserAISettings | undefined;
    
    // 12. Prepare messages for AI
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];
    
    // 13. Call AI
    let assistantContent: string;
    let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
    let estimatedCostCents = 0;
    
    // Determine provider
    let providerConfig: AIProviderConfig | undefined;
    let useOpenAIDirect = true;
    
    if (aiSettings?.providers && aiSettings.providers.length > 0) {
      providerConfig = getDefaultProvider(aiSettings.providers);
      if (providerConfig && providerConfig.type !== "openai") {
        useOpenAIDirect = false;
      }
    }
    
    if (useOpenAIDirect) {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: MAX_COMPLETION_TOKENS,
        response_format: { type: "json_object" },
      });
      
      assistantContent = completion.choices[0].message.content || "";
      usage = completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      } : undefined;
      
      if (usage) {
        const openaiConfig = PROVIDER_TEMPLATES.openai;
        estimatedCostCents = estimateCost(
          openaiConfig as AIProviderConfig,
          usage.prompt_tokens,
          usage.completion_tokens
        ) * 100; // Convert to cents
      }
    } else if (providerConfig) {
      try {
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
      } catch (providerError) {
        console.error(`Provider ${providerConfig.name} failed:`, providerError);
        
        // Fallback to OpenAI
        if (aiSettings?.fallbackToOpenAI) {
          console.log("Falling back to OpenAI for plan generation...");
          const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
            temperature: 0.7,
            max_tokens: MAX_COMPLETION_TOKENS,
            response_format: { type: "json_object" },
          });
          
          assistantContent = completion.choices[0].message.content || "";
          usage = completion.usage ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          } : undefined;
        } else {
          throw providerError;
        }
      }
    } else {
      // No provider, use OpenAI
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: MAX_COMPLETION_TOKENS,
        response_format: { type: "json_object" },
      });
      
      assistantContent = completion.choices[0].message.content || "";
      usage = completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      } : undefined;
    }
    
    // 14. Parse the proposal
    const proposal = parsePlanProposal(assistantContent);
    
    if (!proposal) {
      console.error("Failed to parse AI response:", assistantContent.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse AI response into a valid plan proposal" },
        { status: 500 }
      );
    }
    
    // 15. Log cost warning if exceeded
    if (estimatedCostCents > COST_WARNING_THRESHOLD_CENTS) {
      console.warn(`Plan generation cost (${estimatedCostCents}¢) exceeded warning threshold (${COST_WARNING_THRESHOLD_CENTS}¢)`);
    }
    
    // 16. Return response
    const response: WeekPlanResponse = {
      proposal,
      context_used: {
        goals_count: goals?.length || 0,
        active_tasks_count: tasks?.length || 0,
        notes_count: recentNotes?.length || 0,
      },
      estimated_cost_cents: Math.round(estimatedCostCents * 100) / 100,
      duration_ms: Date.now() - startTime,
    };
    
    if (usage) {
      response.usage = usage;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Week plan generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
