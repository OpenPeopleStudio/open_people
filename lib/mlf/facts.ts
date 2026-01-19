/**
 * Knowledge Facts Management
 * 
 * Extract, store, and retrieve verified facts separate from raw chat
 */

import { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import type { KnowledgeFact, FactType, CreateFactRequest } from "@/types/mlf";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract facts from a conversation exchange
 */
export async function extractFacts(
  userMessage: string,
  assistantResponse: string
): Promise<{
  fact: string;
  fact_type: FactType;
  subject_type?: string;
  subject_name?: string;
  confidence: number;
  source_excerpt: string;
}[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a fact extraction system. Analyze the conversation and extract concrete, verifiable facts.

Facts should be:
- Specific and actionable (not vague observations)
- About the user, their projects, preferences, or business
- Something that would be useful to remember for future conversations

Fact types:
- user_preference: How the user likes things done, style preferences
- project_detail: Specific info about their projects
- business_rule: Rules, constraints, or requirements
- contact: People, companies, relationships
- date: Important dates, deadlines, schedules
- location: Places, addresses, regions
- relationship: How things/people relate to each other
- technical: Technical specifications, stack details
- process: How things work, workflows
- decision: Decisions made, choices
- goal: Objectives, targets, aspirations
- constraint: Limitations, blockers, restrictions

Return JSON array:
[{
  "fact": "The specific fact statement",
  "fact_type": "one of the types above",
  "subject_type": "user|project|person|company|system",
  "subject_name": "name of subject if applicable",
  "confidence": 0.1-1.0,
  "source_excerpt": "the relevant text this was extracted from"
}]

Return empty array [] if no concrete facts found.`,
      },
      {
        role: "user",
        content: `User: ${userMessage}\n\nAssistant: ${assistantResponse}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.facts || [];
  } catch {
    return [];
  }
}

/**
 * Generate embedding for a fact
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
 * Store a new fact
 */
export async function storeFact(
  supabase: SupabaseClient,
  ownerId: string,
  fact: CreateFactRequest,
  tenantId?: string
): Promise<KnowledgeFact | null> {
  // Generate embedding
  const embedding = await generateEmbedding(fact.fact);
  
  // Check for potential contradictions
  const { data: existingFacts } = await supabase
    .rpc("search_facts", {
      p_owner_id: ownerId,
      p_embedding: embedding,
      p_limit: 5,
      p_threshold: 0.85,
      p_fact_types: [fact.fact_type],
    });
  
  // Insert the fact
  const { data: newFact, error } = await supabase
    .from("knowledge_facts")
    .insert({
      owner_id: ownerId,
      tenant_id: tenantId,
      fact: fact.fact,
      fact_type: fact.fact_type,
      subject_type: fact.subject_type,
      subject_name: fact.subject_name,
      confidence: fact.confidence || 0.8,
      source_type: fact.source_type || "manual",
      source_id: fact.source_id,
      source_excerpt: fact.source_excerpt,
      category: fact.category,
      tags: fact.tags || [],
      embedding,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Failed to store fact:", error);
    return null;
  }
  
  // Record potential contradictions
  if (existingFacts && existingFacts.length > 0) {
    for (const existing of existingFacts) {
      // Check if it might contradict
      const contradiction = await checkContradiction(fact.fact, existing.fact);
      if (contradiction) {
        await supabase
          .from("fact_contradictions")
          .insert({
            fact_id: newFact.id,
            contradicts_fact_id: existing.fact_id,
            contradiction_type: contradiction.type,
            description: contradiction.description,
          });
      }
    }
  }
  
  return newFact;
}

/**
 * Check if two facts contradict each other
 */
async function checkContradiction(
  factA: string,
  factB: string
): Promise<{ type: "direct" | "temporal" | "conditional"; description: string } | null> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Determine if these two facts contradict each other.

Return JSON:
{
  "contradicts": true/false,
  "type": "direct" | "temporal" | "conditional",
  "description": "brief explanation of the contradiction"
}

Types:
- direct: Facts directly oppose each other
- temporal: Facts were true at different times
- conditional: Facts are true under different conditions`,
      },
      {
        role: "user",
        content: `Fact A: ${factA}\n\nFact B: ${factB}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content || "{}");
    if (result.contradicts) {
      return {
        type: result.type || "direct",
        description: result.description || "Potential contradiction detected",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verify a fact (mark as confirmed)
 */
export async function verifyFact(
  supabase: SupabaseClient,
  factId: string,
  verifiedBy: string
): Promise<boolean> {
  const { error } = await supabase
    .from("knowledge_facts")
    .update({
      is_verified: true,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      confidence: 1.0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", factId);
  
  return !error;
}

/**
 * Supersede a fact (mark old as not current, add new)
 */
export async function supersedeFact(
  supabase: SupabaseClient,
  oldFactId: string,
  newFact: CreateFactRequest,
  ownerId: string,
  tenantId?: string
): Promise<KnowledgeFact | null> {
  // Mark old fact as not current
  await supabase
    .from("knowledge_facts")
    .update({
      is_current: false,
      valid_until: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", oldFactId);
  
  // Store new fact
  return storeFact(supabase, ownerId, {
    ...newFact,
    source_type: "manual",
  }, tenantId);
}

/**
 * Get facts by type
 */
export async function getFactsByType(
  supabase: SupabaseClient,
  ownerId: string,
  factType: FactType,
  limit: number = 50
): Promise<KnowledgeFact[]> {
  const { data, error } = await supabase
    .from("knowledge_facts")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("fact_type", factType)
    .eq("is_active", true)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Failed to fetch facts:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Get facts about a subject
 */
export async function getFactsAboutSubject(
  supabase: SupabaseClient,
  ownerId: string,
  subjectType: string,
  subjectName?: string
): Promise<KnowledgeFact[]> {
  let query = supabase
    .from("knowledge_facts")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("subject_type", subjectType)
    .eq("is_active", true)
    .eq("is_current", true);
  
  if (subjectName) {
    query = query.ilike("subject_name", `%${subjectName}%`);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  
  if (error) {
    console.error("Failed to fetch subject facts:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Get unresolved contradictions
 */
export async function getUnresolvedContradictions(
  supabase: SupabaseClient,
  ownerId: string
): Promise<{
  contradiction: {
    id: string;
    fact_id: string;
    contradicts_fact_id: string;
    contradiction_type: string;
    description: string;
  };
  factA: KnowledgeFact;
  factB: KnowledgeFact;
}[]> {
  const { data: contradictions } = await supabase
    .from("fact_contradictions")
    .select(`
      *,
      factA:knowledge_facts!fact_contradictions_fact_id_fkey(*),
      factB:knowledge_facts!fact_contradictions_contradicts_fact_id_fkey(*)
    `)
    .eq("resolution_status", "unresolved");
  
  if (!contradictions) return [];
  
  // Filter to only user's facts
  return contradictions
    .filter(c => c.factA?.owner_id === ownerId)
    .map(c => ({
      contradiction: {
        id: c.id,
        fact_id: c.fact_id,
        contradicts_fact_id: c.contradicts_fact_id,
        contradiction_type: c.contradiction_type,
        description: c.description,
      },
      factA: c.factA,
      factB: c.factB,
    }));
}

/**
 * Resolve a contradiction
 */
export async function resolveContradiction(
  supabase: SupabaseClient,
  contradictionId: string,
  resolvedBy: string,
  resolution: "keep_both" | "keep_first" | "keep_second" | "ignore",
  notes?: string
): Promise<boolean> {
  // Get the contradiction
  const { data: contradiction } = await supabase
    .from("fact_contradictions")
    .select("*")
    .eq("id", contradictionId)
    .single();
  
  if (!contradiction) return false;
  
  // Update contradiction status
  await supabase
    .from("fact_contradictions")
    .update({
      resolution_status: resolution === "ignore" ? "ignored" : "resolved",
      resolved_by: resolvedBy,
      resolution_notes: notes,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", contradictionId);
  
  // Deactivate facts based on resolution
  if (resolution === "keep_first") {
    await supabase
      .from("knowledge_facts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", contradiction.contradicts_fact_id);
  } else if (resolution === "keep_second") {
    await supabase
      .from("knowledge_facts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", contradiction.fact_id);
  }
  
  return true;
}
