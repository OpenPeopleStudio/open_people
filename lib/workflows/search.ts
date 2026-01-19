/**
 * Unified Search
 * 
 * Search across all entities with relevance explanation
 */

import { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { SearchResult, SearchFilters, SearchableEntityType } from "@/types/workflows";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SearchOptions {
  supabase: SupabaseClient;
  userId: string;
  query: string;
  filters?: SearchFilters;
  limit?: number;
  includeSemantic?: boolean;
  explainRelevance?: boolean;
}

interface SearchReturn {
  results: SearchResult[];
  totalCount: number;
  searchTimeMs: number;
}

/**
 * Perform unified search across all entities
 */
export async function unifiedSearch({
  supabase,
  userId,
  query,
  filters = {},
  limit = 20,
  includeSemantic = true,
  explainRelevance = false,
}: SearchOptions): Promise<SearchReturn> {
  const startTime = Date.now();
  
  // Generate embedding for semantic search
  let embedding: number[] | null = null;
  if (includeSemantic) {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
        dimensions: 1536,
      });
      embedding = response.data[0].embedding;
    } catch (err) {
      console.error("Failed to generate search embedding:", err);
    }
  }
  
  // Use the unified_search function
  const { data: rawResults, error } = await supabase.rpc("unified_search", {
    p_user_id: userId,
    p_query: query,
    p_embedding: embedding,
    p_entity_types: filters.entity_types || null,
    p_limit: limit,
  });
  
  if (error) {
    console.error("Search error:", error);
    return { results: [], totalCount: 0, searchTimeMs: Date.now() - startTime };
  }
  
  let results: SearchResult[] = rawResults || [];
  
  // Apply additional filters
  if (filters.tags?.length) {
    // Would need to join with search_index to filter by tags
  }
  
  if (filters.date_from) {
    results = results.filter(r => {
      // Would need created_at in result
      return true;
    });
  }
  
  // Add relevance explanations if requested
  if (explainRelevance && results.length > 0) {
    results = await addRelevanceExplanations(query, results);
  }
  
  // Log the search query
  await supabase.from("search_queries").insert({
    user_id: userId,
    query,
    query_embedding: embedding,
    filters,
    result_count: results.length,
    search_time_ms: Date.now() - startTime,
  });
  
  return {
    results,
    totalCount: results.length,
    searchTimeMs: Date.now() - startTime,
  };
}

/**
 * Add explanations for why results are relevant
 */
async function addRelevanceExplanations(
  query: string,
  results: SearchResult[]
): Promise<SearchResult[]> {
  // For efficiency, explain top 5 results
  const topResults = results.slice(0, 5);
  
  const explanationPrompt = `Given the search query: "${query}"

Explain briefly (1 sentence each) why these results are relevant:

${topResults.map((r, i) => `${i + 1}. [${r.entity_type}] ${r.title || "Untitled"}: ${r.content_preview?.slice(0, 100) || ""}`).join("\n")}

Return JSON array of explanations:
["explanation 1", "explanation 2", ...]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You explain search result relevance concisely." },
        { role: "user", content: explanationPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500,
    });
    
    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    const explanations = parsed.explanations || [];
    
    // Add explanations to results
    return results.map((result, i) => ({
      ...result,
      relevance_explanation: i < explanations.length ? explanations[i] : undefined,
    }));
  } catch (err) {
    console.error("Failed to generate explanations:", err);
    return results;
  }
}

/**
 * Quick search (text only, no semantic)
 */
export async function quickSearch(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  entityType?: SearchableEntityType,
  limit: number = 10
): Promise<SearchResult[]> {
  let dbQuery = supabase
    .from("search_index")
    .select("entity_type, entity_id, title, content_preview")
    .eq("owner_id", userId)
    .textSearch("content", query, { type: "websearch" })
    .limit(limit);
  
  if (entityType) {
    dbQuery = dbQuery.eq("entity_type", entityType);
  }
  
  const { data, error } = await dbQuery;
  
  if (error) {
    console.error("Quick search error:", error);
    return [];
  }
  
  return (data || []).map(row => ({
    entity_type: row.entity_type as SearchableEntityType,
    entity_id: row.entity_id,
    title: row.title,
    content_preview: row.content_preview,
    relevance: 1,
    match_type: "text" as const,
  }));
}

/**
 * Index an entity for search
 */
export async function indexEntity(
  supabase: SupabaseClient,
  ownerId: string,
  entityType: SearchableEntityType,
  entityId: string,
  title: string,
  content: string,
  tags?: string[],
  category?: string
): Promise<void> {
  // Generate embedding
  let embedding: number[] | null = null;
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${title} ${content}`.slice(0, 8000),
      dimensions: 1536,
    });
    embedding = response.data[0].embedding;
  } catch (err) {
    console.error("Failed to generate index embedding:", err);
  }
  
  // Upsert into search index
  await supabase.rpc("update_search_index", {
    p_owner_id: ownerId,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_title: title,
    p_content: content,
    p_embedding: embedding,
    p_tags: tags,
    p_category: category,
  });
}

/**
 * Remove entity from search index
 */
export async function removeFromIndex(
  supabase: SupabaseClient,
  entityType: SearchableEntityType,
  entityId: string
): Promise<void> {
  await supabase
    .from("search_index")
    .delete()
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
}

/**
 * Get search suggestions based on partial query
 */
export async function getSearchSuggestions(
  supabase: SupabaseClient,
  userId: string,
  partialQuery: string,
  limit: number = 5
): Promise<string[]> {
  // Get recent searches that match
  const { data: recentSearches } = await supabase
    .from("search_queries")
    .select("query")
    .eq("user_id", userId)
    .ilike("query", `${partialQuery}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  // Get matching titles
  const { data: matchingTitles } = await supabase
    .from("search_index")
    .select("title")
    .eq("owner_id", userId)
    .ilike("title", `%${partialQuery}%`)
    .limit(limit);
  
  const suggestions = new Set<string>();
  
  for (const search of recentSearches || []) {
    suggestions.add(search.query);
  }
  
  for (const item of matchingTitles || []) {
    if (item.title) suggestions.add(item.title);
  }
  
  return Array.from(suggestions).slice(0, limit);
}
