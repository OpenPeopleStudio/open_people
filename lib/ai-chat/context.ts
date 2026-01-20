/**
 * AI Context Builder
 * 
 * Assembles context from notes, files, and memories for chat
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { AIConversation, AIMessageSource } from "@/types/ai-chat";

interface ContextResult {
  systemContext: string;
  sources: AIMessageSource[];
  tokenEstimate: number;
}

interface NoteContext {
  id: string;
  title: string;
  content: string;
  excerpt: string;
}

interface FileContext {
  id: string;
  filename: string;
  ai_summary: string | null;
  ai_category: string | null;
}

interface MemoryContext {
  id: string;
  content: string;
  category: string;
  similarity: number;
}

interface ProjectFact {
  id: string;
  fact: string;
  fact_type: string;
}

/**
 * Build context string from conversation settings
 */
export async function buildContext(
  supabase: SupabaseClient,
  conversation: AIConversation,
  queryEmbedding?: number[]
): Promise<ContextResult> {
  const sources: AIMessageSource[] = [];
  let context = "";
  
  // 0. Add project context if set
  if (conversation.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("name, description")
      .eq("id", conversation.project_id)
      .single();
    
    if (project) {
      context += `## Current Project: ${project.name}\n`;
      if (project.description) {
        context += `${project.description}\n`;
      }
      context += "\n";
      
      // Get project-related facts
      const { data: projectFacts } = await supabase
        .from("knowledge_facts")
        .select("id, fact, fact_type")
        .eq("subject_type", "project")
        .eq("subject_name", project.name)
        .eq("is_active", true)
        .eq("is_current", true)
        .limit(10);
      
      if (projectFacts?.length) {
        context += "### Project Facts\n";
        for (const fact of projectFacts as ProjectFact[]) {
          context += `- [${fact.fact_type}] ${fact.fact}\n`;
          sources.push({
            type: "memory",
            id: fact.id,
            title: `Project fact: ${fact.fact_type}`,
            excerpt: fact.fact.slice(0, 200),
          });
        }
        context += "\n";
      }
    }
  }
  
  // 1. Add notes context
  if (conversation.attached_notes?.length > 0) {
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, content")
      .in("id", conversation.attached_notes)
      .eq("status", "published");
    
    if (notes?.length) {
      context += "## Attached Notes\n\n";
      
      for (const note of notes as NoteContext[]) {
        const excerpt = note.content.slice(0, 2000);
        context += `### ${note.title}\n${excerpt}\n\n`;
        
        sources.push({
          type: "note",
          id: note.id,
          title: note.title,
          excerpt: excerpt.slice(0, 200),
        });
      }
    }
  }
  
  // 2. Add files context (AI summaries)
  if (conversation.attached_files?.length > 0) {
    const { data: files } = await supabase
      .from("vault_files")
      .select("id, filename, ai_summary, ai_category")
      .in("id", conversation.attached_files);
    
    if (files?.length) {
      context += "## Attached Files\n\n";
      
      for (const file of files as FileContext[]) {
        if (file.ai_summary) {
          context += `### ${file.filename}\n`;
          context += `Category: ${file.ai_category || "Unknown"}\n`;
          context += `Summary: ${file.ai_summary}\n\n`;
          
          sources.push({
            type: "file",
            id: file.id,
            title: file.filename,
            excerpt: file.ai_summary.slice(0, 200),
          });
        }
      }
    }
  }
  
  // 3. Add folder contents
  if (conversation.attached_folders?.length > 0) {
    const { data: folderFiles } = await supabase
      .from("vault_files")
      .select("id, filename, ai_summary, ai_category")
      .in("folder_id", conversation.attached_folders)
      .limit(20);
    
    if (folderFiles?.length) {
      context += "## Files from Attached Folders\n\n";
      
      for (const file of folderFiles as FileContext[]) {
        if (file.ai_summary) {
          context += `- **${file.filename}**: ${file.ai_summary.slice(0, 200)}\n`;
          
          sources.push({
            type: "file",
            id: file.id,
            title: file.filename,
            excerpt: file.ai_summary?.slice(0, 100),
          });
        }
      }
      context += "\n";
    }
  }
  
  // 4. Add relevant memories (if enabled and embedding provided)
  if (conversation.use_memory && queryEmbedding) {
    const { data: memories } = await supabase
      .rpc("search_memories", {
        p_owner_id: conversation.owner_id,
        p_embedding: queryEmbedding,
        p_threshold: conversation.memory_threshold,
        p_limit: 10,
      });
    
    if (memories?.length) {
      context += "## Relevant Memories\n\n";
      
      for (const memory of memories as MemoryContext[]) {
        context += `- ${memory.content}\n`;
        
        sources.push({
          type: "memory",
          id: memory.id,
          excerpt: memory.content.slice(0, 200),
          similarity: memory.similarity,
        });
        
        // Track access
        await supabase.rpc("increment_memory_access", { p_memory_id: memory.id });
      }
      context += "\n";
    }
  }
  
  // Estimate tokens (rough: ~4 chars per token)
  const tokenEstimate = Math.ceil(context.length / 4);
  
  return {
    systemContext: context,
    sources,
    tokenEstimate,
  };
}

/**
 * Build the system prompt with context
 */
export function buildSystemPrompt(
  basePrompt: string | null,
  context: string
): string {
  const defaultPrompt = `You are a helpful AI assistant with access to the user's notes, files, and memories. Use this context to provide personalized, informed responses.

When you use information from the provided context, be specific about where it came from (e.g., "Based on your note about X..." or "From your file Y...").

If you learn something new about the user's preferences or important facts during the conversation, mention that you'll remember it for future reference.`;

  const systemPrompt = basePrompt || defaultPrompt;
  
  if (context) {
    return `${systemPrompt}\n\n---\n\n# Context\n\n${context}`;
  }
  
  return systemPrompt;
}

/**
 * Truncate context to fit within token limits
 */
export function truncateContext(context: string, maxTokens: number): string {
  const estimatedTokens = Math.ceil(context.length / 4);
  
  if (estimatedTokens <= maxTokens) {
    return context;
  }
  
  // Truncate to approximate token limit
  const maxChars = maxTokens * 4;
  return context.slice(0, maxChars) + "\n\n[Context truncated due to length...]";
}
