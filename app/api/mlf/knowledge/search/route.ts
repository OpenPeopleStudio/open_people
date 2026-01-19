import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";
import type { SearchKnowledgeRequest, SearchKnowledgeResponse } from "@/types/mlf";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/mlf/knowledge/search
   Semantic search across knowledge store and facts
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: SearchKnowledgeRequest = await request.json();
    
    if (!body.query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    
    const {
      query,
      limit = 10,
      threshold = 0.7,
      include_facts = true,
      include_documents = true,
      fact_types,
    } = body;
    
    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    const response: SearchKnowledgeResponse = {
      facts: [],
      chunks: [],
    };
    
    // Search facts
    if (include_facts) {
      const { data: facts } = await supabase
        .rpc("search_facts", {
          p_owner_id: user.id,
          p_embedding: embedding,
          p_limit: limit,
          p_threshold: threshold,
          p_fact_types: fact_types || null,
        });
      
      if (facts) {
        response.facts = facts.map((f: { fact_id: string; fact: string; fact_type: string; subject_name: string; confidence: number; similarity: number }) => ({
          id: f.fact_id,
          owner_id: user.id,
          tenant_id: null,
          fact: f.fact,
          fact_type: f.fact_type,
          subject_type: null,
          subject_id: null,
          subject_name: f.subject_name,
          confidence: f.confidence,
          is_verified: false,
          verified_by: null,
          verified_at: null,
          valid_from: null,
          valid_until: null,
          is_current: true,
          source_type: "conversation" as const,
          source_id: null,
          source_excerpt: null,
          category: null,
          tags: [],
          importance: 0.5,
          access_count: 0,
          last_accessed_at: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          similarity: f.similarity,
        }));
      }
    }
    
    // Search knowledge chunks
    if (include_documents) {
      const { data: chunks } = await supabase
        .rpc("search_knowledge", {
          p_owner_id: user.id,
          p_embedding: embedding,
          p_limit: limit,
          p_threshold: threshold,
        });
      
      if (chunks) {
        // Get document details
        const docIds = [...new Set(chunks.map((c: { document_id: string }) => c.document_id))];
        const { data: documents } = await supabase
          .from("knowledge_documents")
          .select("*")
          .in("id", docIds);
        
        const docMap = new Map(documents?.map(d => [d.id, d]) || []);
        
        response.chunks = chunks.map((c: { chunk_id: string; document_id: string; document_title: string; content: string; similarity: number }) => ({
          id: c.chunk_id,
          document_id: c.document_id,
          content: c.content,
          chunk_index: 0,
          start_char: null,
          end_char: null,
          metadata: {},
          token_count: null,
          created_at: new Date().toISOString(),
          document: docMap.get(c.document_id),
          similarity: c.similarity,
        }));
      }
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Knowledge search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
