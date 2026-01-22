/* ═══════════════════════════════════════════════════════════════════════════
   Semantic Cache
   Intelligent caching for AI responses with multi-dimensional scoping
   Supports exact match, semantic similarity, and hybrid strategies
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import OpenAI from "openai";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CacheStrategy = "exact" | "semantic" | "hybrid";

export type CacheScope = {
  tenant_id: string;
  prompt_version?: string; // Invalidate when prompt changes
  kb_version?: string; // Invalidate when knowledge base updates
  model: string;
  application_id?: string;
};

export type CachePolicy = {
  // Determinism knobs
  cache_when_temperature_lte?: number; // Only cache if temp <= X (e.g., 0.3)
  cache_when_output_validated?: boolean; // Only cache if output passes validation
  cache_ttl_seconds?: number; // Custom TTL
  
  // Strategy
  strategy?: CacheStrategy;
  similarity_threshold?: number; // For semantic matching (0.0-1.0)
  
  // Exclusions
  exclude_models?: string[];
  exclude_pii?: boolean; // Don't cache requests with PII
};

export type CacheEntry = {
  id: string;
  tenant_id: string;
  cache_key: string;
  scope_hash: string;
  
  // Request signature
  model: string;
  system_prompt_hash?: string;
  messages_hash: string;
  parameters_hash: string;
  
  // Semantic search
  embedding?: number[];
  user_message_preview: string;
  
  // Cached response
  response_content: string;
  response_metadata: {
    finish_reason?: string;
    model?: string;
    tokens?: number;
  };
  
  // Cost tracking
  original_tokens: number;
  original_cost_usd: number;
  
  // TTL
  created_at: string;
  expires_at: string;
  last_hit_at?: string;
  hit_count: number;
  
  is_valid: boolean;
};

export type CacheLookupResult = {
  hit: boolean;
  entry?: CacheEntry;
  match_type?: "exact" | "semantic";
  similarity_score?: number;
  lookup_time_ms: number;
};

export type CacheStoreResult = {
  stored: boolean;
  entry_id?: string;
  reason?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Cache Configuration
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CACHE_POLICY: CachePolicy = {
  cache_when_temperature_lte: 0.5,
  cache_when_output_validated: false,
  cache_ttl_seconds: 86400, // 24 hours
  strategy: "hybrid",
  similarity_threshold: 0.95,
  exclude_pii: true,
};

const EMBEDDING_MODEL = "text-embedding-3-small";

// ─────────────────────────────────────────────────────────────────────────────
// Hash Functions
// ─────────────────────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildScopeHash(scope: CacheScope): string {
  const scopeString = [
    scope.tenant_id,
    scope.prompt_version || "default",
    scope.kb_version || "default",
    scope.model,
    scope.application_id || "global",
  ].join(":");
  return scopeString; // Will be hashed in lookup
}

async function buildCacheKey(
  scope: CacheScope,
  systemPrompt: string | undefined,
  messages: Array<{ role: string; content: string }>,
  parameters: { temperature?: number; max_tokens?: number }
): Promise<{
  cache_key: string;
  scope_hash: string;
  system_prompt_hash?: string;
  messages_hash: string;
  parameters_hash: string;
}> {
  const scopeHash = await sha256(buildScopeHash(scope));
  const systemPromptHash = systemPrompt ? await sha256(systemPrompt) : undefined;
  
  // Hash messages (excluding system prompt if it's the first message)
  const userMessages = messages.filter((m) => m.role !== "system");
  const messagesString = JSON.stringify(userMessages);
  const messagesHash = await sha256(messagesString);
  
  // Hash relevant parameters
  const paramsString = JSON.stringify({
    temperature: parameters.temperature ?? 0.7,
    max_tokens: parameters.max_tokens,
  });
  const parametersHash = await sha256(paramsString);
  
  // Combine for exact match key
  const cacheKey = await sha256(
    [scopeHash, systemPromptHash || "", messagesHash, parametersHash].join(":")
  );
  
  return {
    cache_key: cacheKey,
    scope_hash: scopeHash,
    messages_hash: messagesHash,
    parameters_hash: parametersHash,
    ...(systemPromptHash ? { system_prompt_hash: systemPromptHash } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Embedding Generation
// ─────────────────────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000), // Limit input size
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache Lookup
// ─────────────────────────────────────────────────────────────────────────────

export async function lookupCache(
  scope: CacheScope,
  systemPrompt: string | undefined,
  messages: Array<{ role: string; content: string }>,
  parameters: { temperature?: number; max_tokens?: number },
  policy: CachePolicy = DEFAULT_CACHE_POLICY
): Promise<CacheLookupResult> {
  const startTime = Date.now();
  const supabase = await createSupabaseAdmin();
  
  // Build cache key
  const keyComponents = await buildCacheKey(scope, systemPrompt, messages, parameters);
  
  // 1. Try exact match first (fastest)
  if (policy.strategy === "exact" || policy.strategy === "hybrid") {
    const { data: exactMatch } = await supabase
      .from("cache_entries")
      .select("*")
      .eq("tenant_id", scope.tenant_id)
      .eq("cache_key", keyComponents.cache_key)
      .eq("is_valid", true)
      .gt("expires_at", new Date().toISOString())
      .single();
    
    if (exactMatch) {
      // Update hit count
      await supabase
        .from("cache_entries")
        .update({
          hit_count: (exactMatch.hit_count || 0) + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq("id", exactMatch.id);
      
      return {
        hit: true,
        entry: exactMatch as CacheEntry,
        match_type: "exact",
        lookup_time_ms: Date.now() - startTime,
      };
    }
  }
  
  // 2. Try semantic match (if not exact-only)
  if (policy.strategy === "semantic" || policy.strategy === "hybrid") {
    const userMessage = messages.find((m) => m.role === "user");
    if (userMessage?.content) {
      const embedding = await generateEmbedding(userMessage.content);
      
      if (embedding) {
        const threshold = policy.similarity_threshold ?? 0.95;
        
        // Use pgvector similarity search
        const { data: semanticMatches } = await supabase.rpc("search_cache_semantic", {
          p_tenant_id: scope.tenant_id,
          p_scope_hash: keyComponents.scope_hash,
          p_embedding: embedding,
          p_threshold: threshold,
          p_limit: 1,
        });
        
        if (semanticMatches && semanticMatches.length > 0) {
          const match = semanticMatches[0];
          
          // Update hit count
          await supabase
            .from("cache_entries")
            .update({
              hit_count: (match.hit_count || 0) + 1,
              last_hit_at: new Date().toISOString(),
            })
            .eq("id", match.id);
          
          return {
            hit: true,
            entry: match as CacheEntry,
            match_type: "semantic",
            similarity_score: match.similarity,
            lookup_time_ms: Date.now() - startTime,
          };
        }
      }
    }
  }
  
  return {
    hit: false,
    lookup_time_ms: Date.now() - startTime,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache Store
// ─────────────────────────────────────────────────────────────────────────────

export async function storeInCache(
  scope: CacheScope,
  systemPrompt: string | undefined,
  messages: Array<{ role: string; content: string }>,
  parameters: { temperature?: number; max_tokens?: number },
  response: {
    content: string;
    finish_reason?: string;
    model?: string;
    input_tokens?: number;
    output_tokens?: number;
    cost_usd?: number;
  },
  policy: CachePolicy = DEFAULT_CACHE_POLICY,
  context?: {
    contains_pii?: boolean;
    output_validated?: boolean;
  }
): Promise<CacheStoreResult> {
  const supabase = await createSupabaseAdmin();
  
  // Check determinism knobs
  const temperature = parameters.temperature ?? 0.7;
  
  // Don't cache high-temperature responses
  if (
    policy.cache_when_temperature_lte !== undefined &&
    temperature > policy.cache_when_temperature_lte
  ) {
    return {
      stored: false,
      reason: `Temperature ${temperature} exceeds threshold ${policy.cache_when_temperature_lte}`,
    };
  }
  
  // Don't cache if validation required but not validated
  if (policy.cache_when_output_validated && !context?.output_validated) {
    return {
      stored: false,
      reason: "Output validation required but not passed",
    };
  }
  
  // Don't cache PII responses
  if (policy.exclude_pii && context?.contains_pii) {
    return {
      stored: false,
      reason: "PII detected in request",
    };
  }
  
  // Don't cache excluded models
  if (policy.exclude_models?.includes(scope.model)) {
    return {
      stored: false,
      reason: `Model ${scope.model} is excluded from caching`,
    };
  }
  
  // Build cache key
  const keyComponents = await buildCacheKey(scope, systemPrompt, messages, parameters);
  
  // Generate embedding for semantic search
  const userMessage = messages.find((m) => m.role === "user");
  const embedding =
    policy.strategy !== "exact" && userMessage?.content
      ? await generateEmbedding(userMessage.content)
      : null;
  
  // Calculate expiration
  const ttlSeconds = policy.cache_ttl_seconds ?? 86400;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  
  // Calculate cost saved info
  const totalTokens = (response.input_tokens || 0) + (response.output_tokens || 0);
  const costUsd = response.cost_usd || 0;
  
  try {
    const { data, error } = await supabase
      .from("cache_entries")
      .upsert(
        {
          tenant_id: scope.tenant_id,
          cache_key: keyComponents.cache_key,
          scope_hash: keyComponents.scope_hash,
          model: scope.model,
          system_prompt_hash: keyComponents.system_prompt_hash,
          messages_hash: keyComponents.messages_hash,
          parameters_hash: keyComponents.parameters_hash,
          embedding: embedding,
          user_message_preview: userMessage?.content?.slice(0, 500) || "",
          response_content: response.content,
          response_metadata: {
            finish_reason: response.finish_reason,
            model: response.model,
            tokens: totalTokens,
          },
          original_tokens: totalTokens,
          original_cost_usd: costUsd,
          expires_at: expiresAt,
          hit_count: 0,
          is_valid: true,
        },
        {
          onConflict: "tenant_id,cache_key",
        }
      )
      .select()
      .single();
    
    if (error) {
      console.error("Failed to store cache entry:", error);
      return {
        stored: false,
        reason: error.message,
      };
    }
    
    return {
      stored: true,
      entry_id: data?.id,
    };
  } catch (error) {
    console.error("Cache store error:", error);
    return {
      stored: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Tenant Cache Config
// ─────────────────────────────────────────────────────────────────────────────

export async function loadCacheConfig(tenantId: string): Promise<CachePolicy> {
  const supabase = await createSupabaseAdmin();
  
  const { data } = await supabase
    .from("cache_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();
  
  if (!data) {
    return DEFAULT_CACHE_POLICY;
  }
  
  return {
    cache_when_temperature_lte: data.cache_when_temperature_lte,
    cache_when_output_validated: data.cache_when_output_validated,
    cache_ttl_seconds: data.default_ttl_seconds,
    strategy: data.strategy as CacheStrategy,
    similarity_threshold: data.similarity_threshold,
    exclude_models: data.exclude_models,
    exclude_pii: data.exclude_pii ?? true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Cache Stats
// ─────────────────────────────────────────────────────────────────────────────

export async function getCacheStats(
  tenantId: string,
  period: "day" | "week" | "month" = "day"
): Promise<{
  total_entries: number;
  total_hits: number;
  hit_rate: number;
  tokens_saved: number;
  cost_saved_usd: number;
  avg_similarity_score: number | null;
}> {
  const supabase = await createSupabaseAdmin();
  
  const periodStart = new Date();
  switch (period) {
    case "day":
      periodStart.setDate(periodStart.getDate() - 1);
      break;
    case "week":
      periodStart.setDate(periodStart.getDate() - 7);
      break;
    case "month":
      periodStart.setMonth(periodStart.getMonth() - 1);
      break;
  }
  
  // Get metrics from cache_metrics table
  const { data: metrics } = await supabase
    .from("cache_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("bucket_timestamp", periodStart.toISOString())
    .order("bucket_timestamp", { ascending: false });
  
  if (!metrics || metrics.length === 0) {
    // Fall back to counting entries directly
    const { count: entryCount } = await supabase
      .from("cache_entries")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_valid", true);
    
    const { data: entries } = await supabase
      .from("cache_entries")
      .select("hit_count, original_tokens, original_cost_usd")
      .eq("tenant_id", tenantId)
      .eq("is_valid", true);
    
    const totalHits = entries?.reduce((sum, e) => sum + (e.hit_count || 0), 0) || 0;
    const tokensSaved = entries?.reduce(
      (sum, e) => sum + (e.hit_count || 0) * (e.original_tokens || 0),
      0
    ) || 0;
    const costSaved = entries?.reduce(
      (sum, e) => sum + (e.hit_count || 0) * (e.original_cost_usd || 0),
      0
    ) || 0;
    
    return {
      total_entries: entryCount || 0,
      total_hits: totalHits,
      hit_rate: 0, // Can't calculate without request count
      tokens_saved: tokensSaved,
      cost_saved_usd: costSaved,
      avg_similarity_score: null,
    };
  }
  
  // Aggregate metrics
  const totalRequests = metrics.reduce((sum, m) => sum + (m.total_requests || 0), 0);
  const totalHits = metrics.reduce((sum, m) => sum + (m.cache_hits || 0), 0);
  const tokensSaved = metrics.reduce((sum, m) => sum + (m.tokens_saved || 0), 0);
  const costSaved = metrics.reduce((sum, m) => sum + (m.cost_saved || 0), 0);
  
  const similarityScores = metrics
    .filter((m) => m.avg_similarity_score != null)
    .map((m) => m.avg_similarity_score);
  const avgSimilarity =
    similarityScores.length > 0
      ? similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length
      : null;
  
  return {
    total_entries: metrics[0]?.total_entries || 0,
    total_hits: totalHits,
    hit_rate: totalRequests > 0 ? totalHits / totalRequests : 0,
    tokens_saved: tokensSaved,
    cost_saved_usd: costSaved,
    avg_similarity_score: avgSimilarity,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Version Strings (for scoping)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPromptVersion(
  tenantId: string,
  promptId: string
): Promise<string> {
  const supabase = await createSupabaseAdmin();
  
  const { data } = await supabase
    .from("prompts")
    .select("updated_at, version")
    .eq("id", promptId)
    .eq("tenant_id", tenantId)
    .single();
  
  if (!data) return "v0";
  return data.version || data.updated_at || "v0";
}

export async function getKnowledgeBaseVersion(
  tenantId: string,
  kbId?: string
): Promise<string> {
  const supabase = await createSupabaseAdmin();
  
  // Get the latest update timestamp from knowledge base chunks
  let query = supabase
    .from("knowledge_chunks")
    .select("updated_at")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false })
    .limit(1);
  
  if (kbId) {
    query = query.eq("knowledge_base_id", kbId);
  }
  
  const { data } = await query.single();
  
  if (!data) return "v0";
  return data.updated_at || "v0";
}
