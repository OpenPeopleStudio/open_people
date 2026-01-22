/**
 * AI Run Tracing
 * 
 * Record and explain every AI invocation
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { AIRun, AIRunContextItem, ContextSource } from "@/types/mlf";

interface CreateRunParams {
  supabase: SupabaseClient;
  ownerId: string;
  tenantId?: string;
  conversationId?: string;
  messageId?: string;
  runType: AIRun["run_type"];
  parentRunId?: string;
  model: string;
  provider?: string;
}

interface RunHandle {
  runId: string;
  
  // Set input
  setInput: (type: AIRun["input_type"], preview: string, tokens: number) => Promise<void>;
  
  // Set system prompt
  setSystemPrompt: (prompt: string) => Promise<void>;
  
  // Add context items
  addContextItems: (sources: ContextSource[]) => Promise<void>;
  
  // Set context summary
  setContextSummary: (summary: string) => Promise<void>;
  
  // Complete the run
  complete: (params: {
    output: string;
    outputTokens: number;
    totalTokens: number;
    reasoning?: string;
    confidence?: number;
    latencyMs: number;
    timeToFirstTokenMs?: number;
    costUsd?: number;
  }) => Promise<void>;
  
  // Fail the run
  fail: (error: { code: string; message: string }) => Promise<void>;
  
  // Get the run record
  getRun: () => Promise<AIRun | null>;
}

/**
 * Start a new AI run trace
 */
export async function startAIRun({
  supabase,
  ownerId,
  tenantId,
  conversationId,
  messageId,
  runType,
  parentRunId,
  model,
  provider = "openai",
}: CreateRunParams): Promise<RunHandle> {
  // Create the run record
  const { data: run, error } = await supabase
    .from("ai_runs")
    .insert({
      owner_id: ownerId,
      tenant_id: tenantId,
      conversation_id: conversationId,
      message_id: messageId,
      run_type: runType,
      parent_run_id: parentRunId,
      model,
      provider,
      status: "pending",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error || !run) {
    throw new Error(`Failed to create AI run: ${error?.message}`);
  }
  
  const runId = run.id;
  
  return {
    runId,
    
    async setInput(type, preview, tokens) {
      await supabase
        .from("ai_runs")
        .update({
          input_type: type,
          input_preview: preview.slice(0, 500),
          input_tokens: tokens,
          status: "streaming",
        })
        .eq("id", runId);
    },
    
    async setSystemPrompt(prompt) {
      await supabase
        .from("ai_runs")
        .update({
          system_prompt: prompt,
        })
        .eq("id", runId);
    },
    
    async addContextItems(sources) {
      // Build context_used summary
      const contextUsed: AIRun["context_used"] = {
        memories: [],
        notes: [],
        files: [],
        chunks: [],
        facts: [],
      };
      
      const contextItems: Partial<AIRunContextItem>[] = [];
      
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        
        // Add to context_used
        if (source.type === "memory") {
          contextUsed.memories?.push({
            id: source.id,
            content: source.content,
            similarity: source.relevance || 0,
          });
        } else if (source.type === "note") {
          contextUsed.notes?.push({
            id: source.id,
            title: source.title || "",
            excerpt: source.content.slice(0, 200),
          });
        } else if (source.type === "file") {
          contextUsed.files?.push({
            id: source.id,
            filename: source.title || "",
            summary: source.content.slice(0, 200),
          });
        } else if (source.type === "chunk") {
          contextUsed.chunks?.push({
            id: source.id,
            document_title: source.title || "",
            content: source.content.slice(0, 200),
            similarity: source.relevance || 0,
          });
        } else if (source.type === "fact") {
          contextUsed.facts?.push({
            id: source.id,
            fact: source.content,
            type: source.title || "",
            similarity: source.relevance || 0,
          });
        }
        
        // Prepare detailed context item
        const contextItem = {
          run_id: runId,
          source_type: source.type,
          source_id: source.id,
          content_preview: source.content.slice(0, 500),
          token_count: Math.ceil(source.content.length * 0.25),
          context_position: i,
          ...(source.title ? { source_name: source.title } : {}),
          ...(source.relevance !== undefined ? { relevance_score: source.relevance } : {}),
        };
        contextItems.push(contextItem);
      }
      
      // Update run with context_used
      await supabase
        .from("ai_runs")
        .update({ context_used: contextUsed })
        .eq("id", runId);
      
      // Insert detailed context items
      if (contextItems.length > 0) {
        await supabase
          .from("ai_run_context_items")
          .insert(contextItems);
      }
    },
    
    async setContextSummary(summary) {
      await supabase
        .from("ai_runs")
        .update({ context_summary: summary })
        .eq("id", runId);
    },
    
    async complete({
      output,
      outputTokens,
      totalTokens,
      reasoning,
      confidence,
      latencyMs,
      timeToFirstTokenMs,
      costUsd,
    }) {
      await supabase
        .from("ai_runs")
        .update({
          output_preview: output.slice(0, 500),
          output_tokens: outputTokens,
          total_tokens: totalTokens,
          reasoning,
          confidence,
          latency_ms: latencyMs,
          time_to_first_token_ms: timeToFirstTokenMs,
          estimated_cost_usd: costUsd,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
    },
    
    async fail(error) {
      await supabase
        .from("ai_runs")
        .update({
          status: "failed",
          error_code: error.code,
          error_message: error.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
    },
    
    async getRun() {
      const { data } = await supabase
        .from("ai_runs")
        .select("*, context_items:ai_run_context_items(*)")
        .eq("id", runId)
        .single();
      
      return data;
    },
  };
}

/**
 * Get AI runs for a conversation
 */
export async function getConversationRuns(
  supabase: SupabaseClient,
  conversationId: string
): Promise<AIRun[]> {
  const { data, error } = await supabase
    .from("ai_runs")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Failed to fetch conversation runs:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Get run details with context items
 */
export async function getRunDetails(
  supabase: SupabaseClient,
  runId: string
): Promise<AIRun | null> {
  const { data, error } = await supabase
    .from("ai_runs")
    .select("*, context_items:ai_run_context_items(*)")
    .eq("id", runId)
    .single();
  
  if (error) {
    console.error("Failed to fetch run details:", error);
    return null;
  }
  
  return data;
}

/**
 * Get why AI said something (for a specific message)
 */
export async function explainResponse(
  supabase: SupabaseClient,
  messageId: string
): Promise<{
  run: AIRun | null;
  contextItems: AIRunContextItem[];
  explanation: string;
}> {
  const { data: run } = await supabase
    .from("ai_runs")
    .select("*, context_items:ai_run_context_items(*)")
    .eq("message_id", messageId)
    .single();
  
  if (!run) {
    return {
      run: null,
      contextItems: [],
      explanation: "No trace found for this message.",
    };
  }
  
  const contextItems = run.context_items || [];
  
  // Build explanation
  let explanation = `Model: ${run.model}\n`;
  explanation += `Tokens: ${run.total_tokens || "unknown"}\n`;
  explanation += `Latency: ${run.latency_ms || "unknown"}ms\n\n`;
  
  if (run.reasoning) {
    explanation += `Reasoning: ${run.reasoning}\n\n`;
  }
  
  if (contextItems.length > 0) {
    explanation += "Context used:\n";
    for (const item of contextItems) {
      explanation += `- [${item.source_type}] ${item.source_name || item.source_id}`;
      if (item.relevance_score) {
        explanation += ` (relevance: ${(item.relevance_score * 100).toFixed(0)}%)`;
      }
      explanation += "\n";
    }
  } else {
    explanation += "No additional context was used.\n";
  }
  
  return {
    run,
    contextItems,
    explanation,
  };
}

/**
 * Calculate estimated cost for a model
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Prices per 1K tokens (approximate, as of early 2026)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 0.005, output: 0.015 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "gpt-4-turbo": { input: 0.01, output: 0.03 },
    "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
    "claude-3-opus": { input: 0.015, output: 0.075 },
    "claude-3-sonnet": { input: 0.003, output: 0.015 },
    "claude-3-haiku": { input: 0.00025, output: 0.00125 },
  };
  
  const modelPricing = pricing[model] || pricing["gpt-4o"];
  
  return (inputTokens / 1000) * modelPricing.input + 
         (outputTokens / 1000) * modelPricing.output;
}
