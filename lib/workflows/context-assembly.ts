/**
 * Context Assembly Layer
 * 
 * Deterministic context building with rules
 */

import { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { ContextRule, ContextAssembly, RuleApplication } from "@/types/workflows";
import type { ContextSource } from "@/types/mlf";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Token limits
const DEFAULT_MAX_TOKENS = 8000;
const TOKENS_PER_CHAR = 0.25;

interface AssemblyResult {
  context: string;
  sources: ContextSource[];
  rulesApplied: RuleApplication[];
  includedItems: {
    notes: string[];
    files: string[];
    facts: string[];
    memories: string[];
    chunks: string[];
    entities: string[];
  };
  excludedItems: {
    notes: string[];
    files: string[];
    facts: string[];
    memories: string[];
    chunks: string[];
    entities: string[];
  };
  tokenCount: number;
  assemblyTimeMs: number;
}

interface AssembleContextOptions {
  supabase: SupabaseClient;
  ownerId: string;
  query: string;
  assemblyId?: string;
  conversationId?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Assemble context using rules and configuration
 */
export async function assembleContext({
  supabase,
  ownerId,
  query,
  assemblyId,
  conversationId,
  additionalContext = {},
}: AssembleContextOptions): Promise<AssemblyResult> {
  const startTime = Date.now();
  const sources: ContextSource[] = [];
  const rulesApplied: RuleApplication[] = [];
  const includedItems: AssemblyResult["includedItems"] = {
    notes: [], files: [], facts: [], memories: [], chunks: [], entities: []
  };
  const excludedItems: AssemblyResult["excludedItems"] = {
    notes: [], files: [], facts: [], memories: [], chunks: [], entities: []
  };
  
  // Load assembly config (or use defaults)
  let assembly: ContextAssembly | null = null;
  if (assemblyId) {
    const { data } = await supabase
      .from("context_assemblies")
      .select("*")
      .eq("id", assemblyId)
      .single();
    assembly = data;
  }
  
  // If no specific assembly, try to get default
  if (!assembly) {
    const { data } = await supabase
      .from("context_assemblies")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("is_default", true)
      .single();
    assembly = data;
  }
  
  const maxTokens = assembly?.max_tokens || DEFAULT_MAX_TOKENS;
  let tokenCount = 0;
  
  // Load active rules
  const { data: rules } = await supabase
    .from("context_rules")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("is_active", true)
    .order("priority", { ascending: true });
  
  // Filter rules by those in assembly (if assembly specifies rule_ids)
  const activeRules = assembly?.rule_ids?.length
    ? (rules || []).filter(r => assembly!.rule_ids.includes(r.id))
    : rules || [];
  
  // Generate embedding for semantic search
  const embedding = await generateEmbedding(query);
  
  // 1. Process static inclusions from assembly
  if (assembly) {
    // Static notes
    if (assembly.static_notes.length > 0) {
      const { data: notes } = await supabase
        .from("notes")
        .select("id, title, content")
        .in("id", assembly.static_notes);
      
      for (const note of notes || []) {
        if (!shouldExclude(note.id, "note", activeRules, rulesApplied, additionalContext)) {
          const tokens = estimateTokens(note.content);
          if (tokenCount + tokens <= maxTokens) {
            sources.push({ type: "note", id: note.id, title: note.title, content: note.content });
            includedItems.notes.push(note.id);
            tokenCount += tokens;
          }
        } else {
          excludedItems.notes.push(note.id);
        }
      }
    }
    
    // Static files (via AI summaries)
    if (assembly.static_files.length > 0) {
      const { data: files } = await supabase
        .from("vault_files")
        .select("id, filename, ai_summary")
        .in("id", assembly.static_files);
      
      for (const file of files || []) {
        if (!shouldExclude(file.id, "file", activeRules, rulesApplied, additionalContext)) {
          const content = `File: ${file.filename}\n${file.ai_summary || ""}`;
          const tokens = estimateTokens(content);
          if (tokenCount + tokens <= maxTokens) {
            sources.push({ type: "file", id: file.id, title: file.filename, content });
            includedItems.files.push(file.id);
            tokenCount += tokens;
          }
        } else {
          excludedItems.files.push(file.id);
        }
      }
    }
    
    // Static entities
    if (assembly.static_entities.length > 0) {
      const { data: entities } = await supabase
        .from("context_entities")
        .select("*")
        .in("id", assembly.static_entities);
      
      for (const entity of entities || []) {
        const content = formatEntity(entity);
        const tokens = estimateTokens(content);
        if (tokenCount + tokens <= maxTokens) {
          sources.push({ type: "entity", id: entity.id, title: entity.name, content });
          includedItems.entities.push(entity.id);
          tokenCount += tokens;
        }
      }
    }
  }
  
  // 2. Apply "always include" rules
  for (const rule of activeRules) {
    if (rule.action === "always_include" && rule.target_id) {
      const applied = await applyIncludeRule(
        supabase, rule, sources, includedItems, 
        tokenCount, maxTokens, additionalContext
      );
      if (applied.added) {
        rulesApplied.push({
          rule_id: rule.id,
          rule_name: rule.name,
          action: "always_include",
          target: `${rule.target_type}:${rule.target_id}`,
        });
        tokenCount += applied.tokens;
      }
    }
  }
  
  // 3. Semantic search for facts (if enabled)
  if (assembly?.include_facts !== false) {
    const maxFacts = assembly?.max_facts || 20;
    const factTypes = assembly?.fact_types?.length ? assembly.fact_types : null;
    
    const { data: facts } = await supabase.rpc("search_facts", {
      p_owner_id: ownerId,
      p_embedding: embedding,
      p_limit: maxFacts,
      p_threshold: 0.65,
      p_fact_types: factTypes,
    });
    
    for (const fact of facts || []) {
      if (!shouldExclude(fact.fact_id, "fact", activeRules, rulesApplied, additionalContext)) {
        const content = `[${fact.fact_type}] ${fact.fact}`;
        const tokens = estimateTokens(content);
        if (tokenCount + tokens <= maxTokens) {
          sources.push({
            type: "fact",
            id: fact.fact_id,
            title: fact.fact_type,
            content,
            relevance: fact.similarity,
          });
          includedItems.facts.push(fact.fact_id);
          tokenCount += tokens;
        }
      } else {
        excludedItems.facts.push(fact.fact_id);
      }
    }
  }
  
  // 4. Semantic search for memories (if enabled)
  if (assembly?.include_memories !== false) {
    const maxMemories = assembly?.max_memories || 15;
    const memoryCategories = assembly?.memory_categories?.length ? assembly.memory_categories : null;
    
    const { data: memories } = await supabase.rpc("search_memories", {
      p_owner_id: ownerId,
      p_embedding: embedding,
      p_limit: maxMemories,
      p_threshold: 0.7,
    });
    
    // Filter by categories if specified
    const filteredMemories = memoryCategories
      ? (memories || []).filter((m: { category: string }) => memoryCategories.includes(m.category))
      : memories || [];
    
    for (const memory of filteredMemories) {
      if (!shouldExclude(memory.id, "memory", activeRules, rulesApplied, additionalContext)) {
        const content = `[Memory: ${memory.category || "general"}] ${memory.content}`;
        const tokens = estimateTokens(content);
        if (tokenCount + tokens <= maxTokens) {
          sources.push({
            type: "memory",
            id: memory.id,
            title: memory.category,
            content,
            relevance: memory.similarity,
          });
          includedItems.memories.push(memory.id);
          tokenCount += tokens;
        }
      } else {
        excludedItems.memories.push(memory.id);
      }
    }
  }
  
  // 5. Knowledge chunks (if documents specified)
  if (assembly?.static_documents?.length) {
    const maxChunks = assembly?.max_chunks || 10;
    
    const { data: chunks } = await supabase.rpc("search_knowledge", {
      p_owner_id: ownerId,
      p_embedding: embedding,
      p_limit: maxChunks * 2,  // Get more, filter by document
      p_threshold: 0.6,
    });
    
    const relevantChunks = (chunks || [])
      .filter((c: { document_id: string }) => assembly!.static_documents.includes(c.document_id))
      .slice(0, maxChunks);
    
    for (const chunk of relevantChunks) {
      const content = `[${chunk.document_title}]\n${chunk.content}`;
      const tokens = estimateTokens(content);
      if (tokenCount + tokens <= maxTokens) {
        sources.push({
          type: "chunk",
          id: chunk.chunk_id,
          title: chunk.document_title,
          content,
          relevance: chunk.similarity,
        });
        includedItems.chunks.push(chunk.chunk_id);
        tokenCount += tokens;
      }
    }
  }
  
  // Build final context string
  const context = formatContextString(sources);
  
  // Log the assembly (if conversation provided)
  if (conversationId) {
    await supabase.from("context_assembly_logs").insert({
      assembly_id: assembly?.id,
      conversation_id: conversationId,
      query,
      rules_applied: rulesApplied,
      included_items: includedItems,
      excluded_items: excludedItems,
      total_tokens: tokenCount,
      assembly_time_ms: Date.now() - startTime,
    });
  }
  
  // Update assembly usage
  if (assembly) {
    await supabase
      .from("context_assemblies")
      .update({
        use_count: assembly.use_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", assembly.id);
  }
  
  return {
    context,
    sources,
    rulesApplied,
    includedItems,
    excludedItems,
    tokenCount,
    assemblyTimeMs: Date.now() - startTime,
  };
}

/**
 * Check if an item should be excluded by rules
 */
function shouldExclude(
  itemId: string,
  itemType: string,
  rules: ContextRule[],
  rulesApplied: RuleApplication[],
  context: Record<string, unknown>
): boolean {
  for (const rule of rules) {
    if (rule.target_type !== itemType) continue;
    
    // Check specific ID
    if (rule.target_id === itemId && rule.action === "always_exclude") {
      rulesApplied.push({
        rule_id: rule.id,
        rule_name: rule.name,
        action: "always_exclude",
        target: `${itemType}:${itemId}`,
      });
      return true;
    }
    
    // Check pattern (simplified - would need more sophisticated matching)
    if (rule.target_pattern && rule.action === "always_exclude") {
      // Pattern matching would go here
      // For now, simple tag matching
      if (rule.target_pattern.startsWith("tag:")) {
        const tag = rule.target_pattern.slice(4);
        // Would check if item has this tag
      }
    }
    
    // Conditional exclusion
    if (rule.action === "exclude_if") {
      if (evaluateConditions(rule.conditions, context)) {
        rulesApplied.push({
          rule_id: rule.id,
          rule_name: rule.name,
          action: "exclude_if",
          target: `${itemType}:${itemId}`,
        });
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Apply an include rule
 */
async function applyIncludeRule(
  supabase: SupabaseClient,
  rule: ContextRule,
  sources: ContextSource[],
  includedItems: AssemblyResult["includedItems"],
  currentTokens: number,
  maxTokens: number,
  context: Record<string, unknown>
): Promise<{ added: boolean; tokens: number }> {
  // Skip if already included
  const alreadyIncluded = sources.some(
    s => s.type === rule.target_type && s.id === rule.target_id
  );
  if (alreadyIncluded) return { added: false, tokens: 0 };
  
  // Conditional include
  if (rule.action === "include_if" && !evaluateConditions(rule.conditions, context)) {
    return { added: false, tokens: 0 };
  }
  
  // Fetch and add the item
  // This would need to be expanded for each type
  // Simplified example for notes:
  if (rule.target_type === "note" && rule.target_id) {
    const { data: note } = await supabase
      .from("notes")
      .select("id, title, content")
      .eq("id", rule.target_id)
      .single();
    
    if (note) {
      const tokens = estimateTokens(note.content);
      if (currentTokens + tokens <= maxTokens) {
        sources.push({ type: "note", id: note.id, title: note.title, content: note.content });
        includedItems.notes.push(note.id);
        return { added: true, tokens };
      }
    }
  }
  
  return { added: false, tokens: 0 };
}

/**
 * Evaluate rule conditions
 */
function evaluateConditions(
  conditions: Record<string, unknown>,
  context: Record<string, unknown>
): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (context[key] !== value) {
      return false;
    }
  }
  return true;
}

/**
 * Format entity for context
 */
function formatEntity(entity: {
  entity_type: string;
  name: string;
  description?: string;
  properties?: Record<string, unknown>;
}): string {
  let content = `${entity.entity_type}: ${entity.name}`;
  if (entity.description) {
    content += `\n${entity.description}`;
  }
  if (entity.properties && Object.keys(entity.properties).length > 0) {
    const props = Object.entries(entity.properties)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    content += `\nProperties: ${props}`;
  }
  return content;
}

/**
 * Format sources into context string
 */
function formatContextString(sources: ContextSource[]): string {
  if (sources.length === 0) return "";
  
  // Group by type
  const grouped: Record<string, ContextSource[]> = {};
  for (const source of sources) {
    if (!grouped[source.type]) grouped[source.type] = [];
    grouped[source.type].push(source);
  }
  
  let context = "";
  const order = ["entity", "note", "fact", "memory", "file", "chunk"];
  
  for (const type of order) {
    if (!grouped[type] || grouped[type].length === 0) continue;
    
    const title = {
      entity: "Entities",
      note: "Notes",
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
 * Generate embedding
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
 * Estimate tokens
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length * TOKENS_PER_CHAR);
}
