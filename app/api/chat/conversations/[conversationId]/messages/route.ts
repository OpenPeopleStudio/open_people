import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
import { generateEmbedding, extractMemories, summarizeMemory } from "@/lib/ai-chat/memory";
import { buildContext, truncateContext } from "@/lib/ai-chat/context";
import { buildPersonalizedPrompt } from "@/lib/ai-profile/personalization";
import { chatCompletion, getDefaultProvider, estimateCost } from "@/lib/ai/providers";
import { extractFacts } from "@/lib/mlf/facts";
import { applyVibeDelta, estimateTokens, recordTokenEvent, tokensToBaseDelta } from "@/lib/company/vibes";
import type { SendMessageRequest } from "@/types/ai-chat";
import type { AIUserProfile, AIUserGoal } from "@/types/ai-profile";
import type { AIProviderConfig, UserAISettings } from "@/types/ai-providers";
import { PROVIDER_TEMPLATES } from "@/types/ai-providers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/chat/conversations/[conversationId]/messages
   Send a message and get AI response
   ═══════════════════════════════════════════════════════════════════════════ */

type RouteContext = { params: { conversationId: string } | Promise<{ conversationId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { conversationId } = await Promise.resolve(context.params);
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get tenant context
    const { data: tenantProfile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();
    const tenantId = tenantProfile?.tenant_id || null;

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("owner_id", user.id)
      .single();
    
    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    // Parse request
    const body: SendMessageRequest = await request.json();
    const { content, attachments = [] } = body;
    
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }
    
    // 1. Generate embedding for memory search
    let queryEmbedding: number[] | undefined;
    if (conversation.use_memory) {
      try {
        queryEmbedding = await generateEmbedding(content);
      } catch (err) {
        console.error("Failed to generate embedding:", err);
      }
    }
    
    // 2. Get user's AI profile and goals
    const { data: profile } = await supabase
      .from("ai_user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    const { data: goals } = await supabase
      .from("ai_user_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");
    
    // 3. Build personalized prompt from profile
    let personalizedPrompt = "";
    if (profile) {
      personalizedPrompt = buildPersonalizedPrompt(
        profile as AIUserProfile,
        goals as AIUserGoal[] | undefined
      );
    }
    
    // 4. Build context from notes, files, memories
    const contextResult = await buildContext(supabase, conversation, queryEmbedding);
    const truncatedContext = truncateContext(contextResult.systemContext, 6000);
    
    // 5. Combine personalized prompt with context
    const basePrompt = conversation.system_prompt || getDefaultSystemPrompt(profile?.preferred_name);
    const fullSystemPrompt = [
      basePrompt,
      personalizedPrompt,
      truncatedContext ? `\n---\n\n# Context\n\n${truncatedContext}` : "",
    ].filter(Boolean).join("\n\n");
    
    // 6. Get conversation history
    const { data: historyMessages } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(50);
    
    // 7. Save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content,
      })
      .select()
      .single();
    
    if (userMsgError) {
      console.error("Failed to save user message:", userMsgError);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }
    
    // Save attachments if any
    if (attachments.length > 0) {
      await supabase
        .from("ai_message_attachments")
        .insert(
          attachments.map(att => ({
            message_id: userMessage.id,
            attachment_type: att.type,
            content: att.content,
            filename: att.filename,
          }))
        );
    }
    
    // 8. Build messages array for AI
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: fullSystemPrompt },
    ];
    
    // Add history
    for (const msg of historyMessages || []) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
    
    // Add current message
    messages.push({ role: "user", content });
    
    // 9. Get user's AI provider settings
    const { data: aiSettingsData } = await supabase
      .from("user_ai_settings")
      .select("settings")
      .eq("user_id", user.id)
      .single();
    
    const aiSettings = aiSettingsData?.settings as UserAISettings | undefined;
    
    // Determine which provider to use
    let providerConfig: AIProviderConfig | undefined;
    let useOpenAIDirect = true;
    
    if (aiSettings?.providers && aiSettings.providers.length > 0) {
      // Check if conversation specifies a provider via model name
      const modelName = conversation.model || "gpt-4o";
      
      // Find provider by checking if model is in their available models
      providerConfig = aiSettings.providers.find(p => 
        p.isEnabled && (
          p.availableModels.includes(modelName) ||
          p.defaultModel === modelName ||
          modelName.startsWith("local-") ||
          modelName.startsWith("llm-")
        )
      );
      
      // If no specific provider found, use default
      if (!providerConfig) {
        providerConfig = getDefaultProvider(aiSettings.providers);
      }
      
      // Check if we should use a non-OpenAI provider
      if (providerConfig && providerConfig.type !== "openai") {
        useOpenAIDirect = false;
      }
    }
    
    // 10. Call AI (either OpenAI directly or via provider abstraction)
    const startTime = Date.now();
    let assistantContent: string;
    let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
    let providerUsed = "openai";
    let estimatedCost = 0;
    
    if (useOpenAIDirect) {
      // Use OpenAI directly (existing behavior)
      const completion = await openai.chat.completions.create({
        model: conversation.model || "gpt-4o",
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: conversation.temperature || 0.7,
        max_tokens: 4000,
      });
      
      assistantContent = completion.choices[0].message.content || "";
      usage = completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      } : undefined;
      
      // Estimate cost for OpenAI
      if (usage) {
        const openaiConfig = PROVIDER_TEMPLATES.openai;
        estimatedCost = estimateCost(
          openaiConfig as AIProviderConfig,
          usage.prompt_tokens,
          usage.completion_tokens
        );
      }
    } else if (providerConfig) {
      // Use the configured provider (LLM Studio, Ollama, etc.)
      try {
        const completion = await chatCompletion(providerConfig, {
          model: conversation.model || providerConfig.defaultModel,
          messages,
          temperature: conversation.temperature || 0.7,
          max_tokens: 4000,
        });
        
        assistantContent = completion.choices[0]?.message.content || "";
        usage = completion.usage;
        providerUsed = providerConfig.name;
        
        // Calculate cost (will be 0 for local models)
        if (usage) {
          estimatedCost = estimateCost(providerConfig, usage.prompt_tokens, usage.completion_tokens);
        }
      } catch (providerError) {
        console.error(`Provider ${providerConfig.name} failed:`, providerError);
        
        // Fallback to OpenAI if enabled
        if (aiSettings?.fallbackToOpenAI) {
          console.log("Falling back to OpenAI...");
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
            temperature: conversation.temperature || 0.7,
            max_tokens: 4000,
          });
          
          assistantContent = completion.choices[0].message.content || "";
          usage = completion.usage ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          } : undefined;
          providerUsed = "openai (fallback)";
        } else {
          throw providerError;
        }
      }
    } else {
      // No provider configured, use OpenAI
      const completion = await openai.chat.completions.create({
        model: conversation.model || "gpt-4o",
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: conversation.temperature || 0.7,
        max_tokens: 4000,
      });
      
      assistantContent = completion.choices[0].message.content || "";
      usage = completion.usage ? {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens,
      } : undefined;
    }
    
    // 10. Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantContent,
        sources: contextResult.sources,
        prompt_tokens: usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
        total_tokens: usage?.total_tokens,
      })
      .select()
      .single();
    
    if (assistantMsgError) {
      console.error("Failed to save assistant message:", assistantMsgError);
    }

    // 10.5 Token accounting (vibe currency)
    if (tenantId) {
      const tokenIn = estimateTokens(content);
      const tokenOut = usage?.completion_tokens ?? estimateTokens(assistantContent);
      const inDelta = tokensToBaseDelta(tokenIn, 0);
      const outDelta = tokensToBaseDelta(0, tokenOut);
      const baseDelta = inDelta + outDelta;

      if (tokenIn > 0) {
        await recordTokenEvent(
          supabase,
          tenantId,
          user.id,
          "in",
          tokenIn,
          inDelta,
          "chat:input"
        );
      }

      if (tokenOut > 0) {
        await recordTokenEvent(
          supabase,
          tenantId,
          user.id,
          "out",
          tokenOut,
          outDelta,
          "chat:output"
        );
      }

      if (baseDelta !== 0) {
        const balanceResult = await applyVibeDelta(supabase, tenantId, baseDelta);
        await supabase.from("vibe_events").insert({
          tenant_id: tenantId,
          created_by: user.id,
          source: "tokens:chat",
          value: balanceResult.delta,
        });
      }
    }
    
    // 11. Save context snapshot
    if (assistantMessage) {
      await supabase
        .from("ai_context_snapshots")
        .insert({
          message_id: assistantMessage.id,
          included_notes: contextResult.sources.filter(s => s.type === "note"),
          included_files: contextResult.sources.filter(s => s.type === "file"),
          included_memories: contextResult.sources.filter(s => s.type === "memory"),
          full_context: truncatedContext,
          context_tokens: contextResult.tokenEstimate,
        });
    }
    
    // 12. Extract and store new memories (async, don't block response)
    if (conversation.use_memory) {
      extractAndStoreMemories(supabase, user.id, conversationId, userMessage.id, content, assistantContent)
        .catch(err => console.error("Failed to extract memories:", err));
    }
    
    // 13. Extract suggested notes/facts (async but return in response)
    const suggestions: {
      notes: { title: string; content: string }[];
      facts: { fact: string; fact_type: string }[];
    } = { notes: [], facts: [] };
    
    try {
      // Extract potential facts
      const extractedFacts = await extractFacts(content, assistantContent);
      suggestions.facts = extractedFacts.slice(0, 3).map(f => ({
        fact: f.fact,
        fact_type: f.fact_type,
      }));
      
      // Generate note suggestion if the response is substantial
      if (assistantContent.length > 200) {
        const noteSuggestion = await extractNoteSuggestion(content, assistantContent);
        if (noteSuggestion) {
          suggestions.notes = [noteSuggestion];
        }
      }
    } catch (err) {
      console.error("Failed to extract suggestions:", err);
    }
    
    return NextResponse.json({
      message: assistantMessage,
      context_used: {
        notes: contextResult.sources.filter(s => s.type === "note").length,
        files: contextResult.sources.filter(s => s.type === "file").length,
        memories: contextResult.sources.filter(s => s.type === "memory").length,
      },
      suggestions,
      provider: providerUsed,
      estimated_cost: estimatedCost,
      duration_ms: Date.now() - startTime,
    });
    
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get default system prompt
 */
function getDefaultSystemPrompt(name?: string | null): string {
  const greeting = name ? `You are speaking with ${name}. ` : "";
  return `${greeting}You are a thoughtful AI assistant focused on helping the user understand themselves better and achieve their goals.

Your approach:
- Connect conversations to the user's bigger picture (their "why", values, and goals)
- Help them see patterns and insights about themselves
- Offer perspective while respecting their autonomy
- Remember and reference what you learn about them
- Be genuine - you're here to help them grow, not just complete tasks

When the user shares something, consider:
- How does this connect to what they care about?
- What might this reveal about their values or priorities?
- Are there growth opportunities here?
- What would truly serve their long-term wellbeing?`;
}

/**
 * Extract memories from conversation and store them
 */
async function extractAndStoreMemories(
  supabase: ReturnType<typeof createSupabaseServer> extends Promise<infer T> ? T : never,
  ownerId: string,
  conversationId: string,
  messageId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    const memories = await extractMemories(userMessage, assistantResponse);
    
    for (const memory of memories) {
      // Generate embedding for the memory
      const embedding = await generateEmbedding(memory.content);
      const summary = await summarizeMemory(memory.content);
      
      await supabase
        .from("ai_memories")
        .insert({
          owner_id: ownerId,
          content: memory.content,
          summary,
          source_conversation_id: conversationId,
          source_message_id: messageId,
          source_type: "conversation",
          category: memory.category,
          importance: memory.importance,
          embedding,
        });
    }
  } catch (error) {
    console.error("Memory extraction error:", error);
  }
}

/**
 * Extract note suggestion from conversation
 */
async function extractNoteSuggestion(
  userMessage: string,
  assistantResponse: string
): Promise<{ title: string; content: string } | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Analyze this conversation exchange. If there's valuable information worth saving as a note (e.g., a decision made, a plan, key insights, action items), suggest a note.

Return JSON:
{
  "suggest_note": true/false,
  "title": "Brief descriptive title",
  "content": "The note content in markdown, summarizing the key information"
}

Only suggest notes for substantial, valuable content. Return {"suggest_note": false} if not noteworthy.`,
        },
        {
          role: "user",
          content: `User: ${userMessage}\n\nAssistant: ${assistantResponse}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    if (result.suggest_note && result.title && result.content) {
      return {
        title: result.title,
        content: result.content,
      };
    }
    return null;
  } catch {
    return null;
  }
}
