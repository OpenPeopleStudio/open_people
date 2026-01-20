/**
 * Explainable Retrieval
 *
 * Search with explainability - every result includes "why these chunks"
 * with confidence scores and detailed reasoning.
 */

import OpenAI from "openai";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getChunksWithLineage } from "./lineage";
import type {
  RetrievalSession,
  RetrievalResult,
  RetrievalResultChunk,
  SelectionReason,
  ConfidenceFactors,
  ChunkWithLineage,
  ExplainableSearchRequest,
  ExplainableSearchResponse,
} from "@/types/rag";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_TOP_K = 10;
const DEFAULT_MIN_SCORE = 0.65;

// ═══════════════════════════════════════════════════════════════════════════
// Retrieval Sessions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a retrieval session for grouping related queries.
 */
export async function createRetrievalSession(options: {
  tenantId?: string;
  userId?: string;
  conversationId?: string;
  applicationId?: string;
  sessionType?: "interactive" | "batch" | "eval";
}): Promise<RetrievalSession> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("kb_retrieval_sessions")
    .insert({
      tenant_id: options.tenantId,
      user_id: options.userId,
      conversation_id: options.conversationId,
      application_id: options.applicationId,
      session_type: options.sessionType ?? "interactive",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create retrieval session: ${error.message}`);
  }

  return data as RetrievalSession;
}

/**
 * End a retrieval session.
 */
export async function endRetrievalSession(sessionId: string): Promise<void> {
  const supabase = await createSupabaseAdmin();

  await supabase
    .from("kb_retrieval_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);
}

// ═══════════════════════════════════════════════════════════════════════════
// Explainable Search
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Perform explainable semantic search.
 * Returns results with detailed explanations of why each chunk was selected.
 */
export async function explainableSearch(
  request: ExplainableSearchRequest & {
    tenantId?: string;
    userId?: string;
    sessionId?: string;
  }
): Promise<ExplainableSearchResponse> {
  const supabase = await createSupabaseAdmin();
  const startTime = Date.now();

  // 1. Generate query embedding
  const embeddingStart = Date.now();
  const embedding = await generateEmbedding(request.query);
  const embeddingLatency = Date.now() - embeddingStart;

  // 2. Extract query features for explanation
  const queryFeatures = extractQueryFeatures(request.query);

  // 3. Perform semantic search
  const searchStart = Date.now();
  const { data: searchResults, error } = await supabase.rpc("search_knowledge", {
    p_owner_id: request.userId,
    p_embedding: embedding,
    p_limit: request.top_k ?? DEFAULT_TOP_K * 2, // Get more for filtering
    p_threshold: request.min_score ?? DEFAULT_MIN_SCORE,
  });
  const searchLatency = Date.now() - searchStart;

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  // 4. Filter to requested knowledge bases if specified
  let filteredResults = searchResults || [];
  if (request.knowledge_base_ids && request.knowledge_base_ids.length > 0) {
    // Get document KB mappings
    const docIds = filteredResults.map((r: { document_id: string }) => r.document_id);
    const { data: docs } = await supabase
      .from("knowledge_documents")
      .select("id, category") // Assuming category maps to KB
      .in("id", docIds);

    const docKbMap = new Map((docs || []).map((d) => [d.id, d.category]));
    filteredResults = filteredResults.filter((r: { document_id: string }) => {
      const kb = docKbMap.get(r.document_id);
      return !kb || request.knowledge_base_ids!.includes(kb);
    });
  }

  // 5. Limit to top_k
  const topResults = filteredResults.slice(0, request.top_k ?? DEFAULT_TOP_K);

  // 6. Get lineage if requested
  let chunksWithLineage: ChunkWithLineage[] = [];
  if (request.include_lineage) {
    const chunkIds = topResults.map((r: { chunk_id: string }) => r.chunk_id);
    chunksWithLineage = await getChunksWithLineage(chunkIds);
  }

  // 7. Build explainable results
  const explainedResults = topResults.map((result: {
    chunk_id: string;
    document_id: string;
    document_title: string;
    content: string;
    similarity: number;
  }, index: number) => {
    const explanation = request.explain
      ? buildExplanation(result, queryFeatures, index + 1)
      : undefined;

    const lineage = chunksWithLineage.find((c) => c.chunk_id === result.chunk_id);

    return {
      chunk: lineage || {
        chunk_id: result.chunk_id,
        content: result.content,
        document_id: result.document_id,
        document_title: result.document_title,
        source_type: "unknown",
      },
      score: result.similarity,
      rank: index + 1,
      explanation,
      pii_info: request.include_pii_info && lineage
        ? {
            classification: lineage.pii_classification || "none",
            contains_pii: !!lineage.pii_classification && lineage.pii_classification !== "none",
          }
        : undefined,
    };
  });

  // 8. Log retrieval for analytics
  const retrievalId = await logRetrievalResult({
    tenantId: request.tenantId,
    sessionId: request.sessionId,
    queryText: request.query,
    queryEmbedding: embedding,
    results: explainedResults,
    searchConfig: {
      top_k: request.top_k ?? DEFAULT_TOP_K,
      min_score: request.min_score ?? DEFAULT_MIN_SCORE,
      rerank: request.rerank ?? false,
    },
    latency: {
      embedding: embeddingLatency,
      search: searchLatency,
      total: Date.now() - startTime,
    },
  });

  return {
    retrieval_id: retrievalId,
    query: request.query,
    results: explainedResults as ExplainableSearchResponse["results"],
    metadata: {
      total_searched: filteredResults.length,
      above_threshold: topResults.length,
      latency_ms: Date.now() - startTime,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Explanation Building
// ═══════════════════════════════════════════════════════════════════════════

interface QueryFeatures {
  terms: string[];
  entities: string[];
  intent?: string;
}

/**
 * Extract features from query for explanation building.
 */
function extractQueryFeatures(query: string): QueryFeatures {
  // Simple term extraction (could be enhanced with NER)
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .filter((t) => !STOPWORDS.has(t));

  // Simple entity detection (capitalized words not at start)
  const entities = query
    .split(/\s+/)
    .filter((t, i) => i > 0 && /^[A-Z]/.test(t))
    .map((t) => t.replace(/[^\w]/g, ""));

  return { terms, entities };
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "must", "can",
  "this", "that", "these", "those", "what", "which", "who",
  "whom", "where", "when", "why", "how", "all", "each", "every",
  "both", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "same", "so", "than", "too", "very",
  "just", "and", "but", "or", "for", "with", "about", "from",
]);

/**
 * Build explanation for why a chunk was selected.
 */
function buildExplanation(
  result: { content: string; similarity: number },
  queryFeatures: QueryFeatures,
  rank: number
): { reasons: SelectionReason[]; confidence: number; confidence_factors: ConfidenceFactors } {
  const reasons: SelectionReason[] = [];
  const factors: ConfidenceFactors = { semantic: result.similarity };

  // 1. Semantic similarity reason
  if (result.similarity >= 0.85) {
    reasons.push({
      type: "semantic_match",
      detail: "Very high semantic similarity to query",
      score: result.similarity,
    });
  } else if (result.similarity >= 0.75) {
    reasons.push({
      type: "semantic_match",
      detail: "Strong semantic similarity to query",
      score: result.similarity,
    });
  } else {
    reasons.push({
      type: "semantic_match",
      detail: "Moderate semantic similarity to query",
      score: result.similarity,
    });
  }

  // 2. Keyword match reason
  const contentLower = result.content.toLowerCase();
  const matchedTerms = queryFeatures.terms.filter((t) => contentLower.includes(t));

  if (matchedTerms.length > 0) {
    const keywordScore = matchedTerms.length / queryFeatures.terms.length;
    factors.keyword = keywordScore;
    reasons.push({
      type: "keyword_match",
      detail: `Contains ${matchedTerms.length} query terms`,
      keywords: matchedTerms,
      score: keywordScore,
    });
  }

  // 3. Entity match reason
  const matchedEntities = queryFeatures.entities.filter((e) =>
    contentLower.includes(e.toLowerCase())
  );

  if (matchedEntities.length > 0) {
    factors.entity = matchedEntities.length / Math.max(queryFeatures.entities.length, 1);
    reasons.push({
      type: "entity_match",
      detail: `Contains ${matchedEntities.length} mentioned entities`,
      entities: matchedEntities,
      score: factors.entity,
    });
  }

  // 4. Calculate overall confidence
  const confidence = calculateConfidence(factors, rank);

  return {
    reasons,
    confidence,
    confidence_factors: factors,
  };
}

/**
 * Calculate overall confidence from factors.
 */
function calculateConfidence(factors: ConfidenceFactors, rank: number): number {
  // Weighted combination of factors
  const weights = {
    semantic: 0.5,
    keyword: 0.2,
    entity: 0.2,
    recency: 0.05,
    source_quality: 0.05,
  };

  let weightedSum = factors.semantic * weights.semantic;
  let totalWeight = weights.semantic;

  if (factors.keyword !== undefined) {
    weightedSum += factors.keyword * weights.keyword;
    totalWeight += weights.keyword;
  }

  if (factors.entity !== undefined) {
    weightedSum += factors.entity * weights.entity;
    totalWeight += weights.entity;
  }

  // Normalize
  let confidence = weightedSum / totalWeight;

  // Rank penalty (slight decrease for lower ranks)
  confidence *= Math.pow(0.98, rank - 1);

  return Math.min(Math.max(confidence, 0), 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// Logging
// ═══════════════════════════════════════════════════════════════════════════

interface LogRetrievalOptions {
  tenantId?: string;
  sessionId?: string;
  queryText: string;
  queryEmbedding: number[];
  results: Array<{
    chunk: { chunk_id: string };
    score: number;
    rank: number;
    explanation?: {
      reasons: SelectionReason[];
      confidence: number;
      confidence_factors?: ConfidenceFactors;
    };
  }>;
  searchConfig: Record<string, unknown>;
  latency: {
    embedding: number;
    search: number;
    total: number;
  };
}

/**
 * Log retrieval result for analytics and debugging.
 */
async function logRetrievalResult(options: LogRetrievalOptions): Promise<string> {
  const supabase = await createSupabaseAdmin();

  // Format chunks for the RPC function
  const chunks = options.results.map((r) => ({
    chunk_id: r.chunk.chunk_id,
    rank: r.rank,
    semantic_score: r.score,
    final_score: r.score,
    selection_reasons: r.explanation?.reasons || [],
    confidence: r.explanation?.confidence || r.score,
    included: true,
  }));

  const { data, error } = await supabase.rpc("log_retrieval_result", {
    p_tenant_id: options.tenantId || null,
    p_session_id: options.sessionId || null,
    p_query_text: options.queryText,
    p_query_embedding: options.queryEmbedding,
    p_chunks: chunks,
    p_search_config: options.searchConfig,
    p_latency_ms: options.latency.total,
  });

  if (error) {
    console.error("Failed to log retrieval result:", error);
    return "unknown";
  }

  return data as string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Feedback
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Submit feedback on a retrieval result.
 */
export async function submitRetrievalFeedback(options: {
  retrievalId: string;
  resultChunkId?: string;
  feedbackSource: "user" | "implicit" | "eval" | "admin";
  userId?: string;
  feedbackType: "helpful" | "not_helpful" | "incorrect" | "outdated" | "irrelevant" | "missing";
  rating?: number;
  comment?: string;
  expectedContent?: string;
  expectedDocumentId?: string;
}): Promise<void> {
  const supabase = await createSupabaseAdmin();

  const { error } = await supabase.from("kb_retrieval_feedback").insert({
    retrieval_id: options.retrievalId,
    result_chunk_id: options.resultChunkId,
    feedback_source: options.feedbackSource,
    user_id: options.userId,
    feedback_type: options.feedbackType,
    rating: options.rating,
    comment: options.comment,
    expected_content: options.expectedContent,
    expected_document_id: options.expectedDocumentId,
  });

  if (error) {
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate embedding for text.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}
