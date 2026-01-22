/**
 * Deterministic Context Builder
 * 
 * Builds AI context from multiple sources with citations and tracing
 */

import { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { 
  ContextConfig, 
  BuiltContext, 
  ContextSource,
} from "@/types/mlf";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Token limits
const MAX_CONTEXT_TOKENS = 8000;
const TOKENS_PER_CHAR = 0.25; // Rough estimate

interface BuildContextOptions {
  supabase: SupabaseClient;
  ownerId: string;
  query: string;
  config: ContextConfig;
  maxTokens?: number;
}

/**
 * Build context deterministically from configured sources
 */
export async function buildContext({
  supabase,
  ownerId,
  query,
  config,
  maxTokens = MAX_CONTEXT_TOKENS,
}: BuildContextOptions): Promise<BuiltContext> {
  const sources: ContextSource[] = [];
  let tokenCount = 0;
  let truncated = false;
  
  // Generate embedding for semantic search
  const embedding = await generateEmbedding(query);
  
  // 1. Load explicit context sources (deterministic order)
  
  // Notes
  if (config.notes.length > 0) {
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, content")
      .in("id", config.notes)
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    
    for (const note of notes || []) {
      const tokens = estimateTokens(note.content);
      if (tokenCount + tokens > maxTokens) {
        truncated = true;
        break;
      }
      
      sources.push({
        type: "note",
        id: note.id,
        title: note.title,
        content: note.content,
      });
      tokenCount += tokens;
    }
  }
  
  // Files (via AI summaries)
  if (config.files.length > 0) {
    const { data: files } = await supabase
      .from("vault_files")
      .select("id, filename, ai_summary, ai_category")
      .in("id", config.files)
      .not("ai_summary", "is", null);
    
    for (const file of files || []) {
      const content = `File: ${file.filename}\nCategory: ${file.ai_category || "Unknown"}\nSummary: ${file.ai_summary}`;
      const tokens = estimateTokens(content);
      if (tokenCount + tokens > maxTokens) {
        truncated = true;
        break;
      }
      
      sources.push({
        type: "file",
        id: file.id,
        title: file.filename,
        content,
      });
      tokenCount += tokens;
    }
  }
  
  // Folders (all files in folder)
  if (config.folders.length > 0) {
    const { data: folderFiles } = await supabase
      .from("vault_files")
      .select("id, filename, ai_summary")
      .in("folder_id", config.folders)
      .not("ai_summary", "is", null)
      .limit(20);
    
    for (const file of folderFiles || []) {
      const content = `- ${file.filename}: ${file.ai_summary?.slice(0, 200)}`;
      const tokens = estimateTokens(content);
      if (tokenCount + tokens > maxTokens) {
        truncated = true;
        break;
      }
      
      sources.push({
        type: "file",
        id: file.id,
        title: file.filename,
        content,
      });
      tokenCount += tokens;
    }
  }
  
  // Entities
  if (config.entities.length > 0) {
    const { data: entities } = await supabase
      .from("context_entities")
      .select("*")
      .in("id", config.entities)
      .eq("is_active", true);
    
    for (const entity of entities || []) {
      const propsStr = Object.entries(entity.properties || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      const content = `${entity.entity_type}: ${entity.name}\n${entity.description || ""}\nProperties: ${propsStr}`;
      const tokens = estimateTokens(content);
      if (tokenCount + tokens > maxTokens) {
        truncated = true;
        break;
      }
      
      sources.push({
        type: "entity",
        id: entity.id,
        title: entity.name,
        content,
      });
      tokenCount += tokens;
    }
  }
  
  // Knowledge documents (chunks via semantic search)
  if (config.documents.length > 0) {
    const { data: chunks } = await supabase
      .rpc("search_knowledge", {
        p_owner_id: ownerId,
        p_embedding: embedding,
        p_limit: 10,
        p_threshold: 0.6,
      });
    
    // Filter to only configured documents
    const relevantChunks = (chunks || []).filter((c: { document_id: string }) => 
      config.documents.includes(c.document_id)
    );
    
    for (const chunk of relevantChunks) {
      const content = `[${chunk.document_title}]\n${chunk.content}`;
      const tokens = estimateTokens(content);
      if (tokenCount + tokens > maxTokens) {
        truncated = true;
        break;
      }
      
      sources.push({
        type: "chunk",
        id: chunk.chunk_id,
        title: chunk.document_title,
        content,
        relevance: chunk.similarity,
      });
      tokenCount += tokens;
    }
  }
  
  // 2. Semantic retrieval (memories, facts)
  
  // Facts
  if (config.use_facts) {
    const { data: facts } = await supabase
      .rpc("search_facts", {
        p_owner_id: ownerId,
        p_embedding: embedding,
        p_limit: 15,
        p_threshold: 0.65,
        p_fact_types: config.fact_types.length > 0 ? config.fact_types : null,
      });
    
    for (const fact of facts || []) {
      const content = `[${fact.fact_type}] ${fact.fact}${fact.subject_name ? ` (about: ${fact.subject_name})` : ""}`;
      const tokens = estimateTokens(content);
      if (tokenCount + tokens > maxTokens) {
        truncated = true;
        break;
      }
      
      sources.push({
        type: "fact",
        id: fact.fact_id,
        title: fact.fact_type,
        content,
        relevance: fact.similarity,
      });
      tokenCount += tokens;
      
      // Track fact access
      await supabase.rpc("increment_fact_access", { p_fact_id: fact.fact_id });
    }
  }
  
  // Memories (from ai_memories)
  if (config.use_memories) {
    const { data: memories } = await supabase
      .rpc("search_memories", {
        p_owner_id: ownerId,
        p_embedding: embedding,
        p_limit: 10,
        p_threshold: 0.7,
      });
    
    // Filter by categories if specified
    const filteredMemories = config.memory_categories.length > 0
      ? (memories || []).filter((m: { category: string }) => config.memory_categories.includes(m.category))
      : memories || [];
    
    for (const memory of filteredMemories) {
      const content = `[Memory: ${memory.category || "general"}] ${memory.content}`;
      const tokens = estimateTokens(content);
      if (tokenCount + tokens > maxTokens) {
        truncated = true;
        break;
      }
      
      sources.push({
        type: "memory",
        id: memory.id,
        title: memory.category || "memory",
        content,
        relevance: memory.similarity,
      });
      tokenCount += tokens;
      
      // Track memory access
      await supabase.rpc("increment_memory_access", { p_memory_id: memory.id });
    }
  }
  
  // 3. Build the context string
  const systemContext = formatContextString(sources);
  
  return {
    system_context: systemContext,
    sources,
    token_estimate: tokenCount,
    truncated,
  };
}

/**
 * Format sources into a context string
 */
function formatContextString(sources: ContextSource[]): string {
  if (sources.length === 0) return "";
  
  // Group by type
  const grouped: Record<string, ContextSource[]> = {};
  for (const source of sources) {
    if (!grouped[source.type]) grouped[source.type] = [];
    grouped[source.type].push(source);
  }
  
  let context = "# Context\n\n";
  
  // Order: notes, entities, facts, memories, files, chunks
  const order = ["note", "entity", "fact", "memory", "file", "chunk"];
  
  for (const type of order) {
    if (!grouped[type] || grouped[type].length === 0) continue;
    
    const title = {
      note: "Notes",
      entity: "Entities",
      fact: "Known Facts",
      memory: "Memories",
      file: "Files",
      chunk: "Documents",
    }[type];
    
    context += `## ${title}\n\n`;
    
    for (const source of grouped[type]) {
      if (type === "fact" || type === "memory") {
        context += `${source.content}\n`;
      } else {
        context += `### ${source.title}\n${source.content}\n\n`;
      }
    }
    
    context += "\n";
  }
  
  return context.trim();
}

/**
 * Generate embedding for text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  
  return response.data[0].embedding;
}

/**
 * Estimate tokens from character count
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length * TOKENS_PER_CHAR);
}

/**
 * Load a context preset
 */
export async function loadContextPreset(
  supabase: SupabaseClient,
  presetId: string
): Promise<ContextConfig | null> {
  const { data: preset, error } = await supabase
    .from("context_presets")
    .select("*")
    .eq("id", presetId)
    .single();
  
  if (error || !preset) return null;
  
  // Update usage
  await supabase
    .from("context_presets")
    .update({
      use_count: preset.use_count + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", presetId);
  
  return {
    notes: preset.included_notes || [],
    files: preset.included_files || [],
    folders: preset.included_folders || [],
    entities: preset.included_entities || [],
    documents: preset.included_documents || [],
    use_facts: preset.use_facts ?? true,
    use_memories: preset.use_memories ?? true,
    fact_types: preset.fact_types || [],
    memory_categories: preset.memory_categories || [],
    preset_id: presetId,
  };
}

/**
 * Create default context config
 */
export function createDefaultConfig(): ContextConfig {
  return {
    notes: [],
    files: [],
    folders: [],
    entities: [],
    documents: [],
    use_facts: true,
    use_memories: true,
    fact_types: [],
    memory_categories: [],
  };
}
