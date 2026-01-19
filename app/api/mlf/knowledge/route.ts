import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logActivity } from "@/lib/mlf/activity";
import OpenAI from "openai";
import type { CreateKnowledgeDocumentRequest } from "@/types/mlf";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/mlf/knowledge
   List knowledge documents
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status") || "active";
    const limit = parseInt(searchParams.get("limit") || "50");
    
    let query = supabase
      .from("knowledge_documents")
      .select("*")
      .eq("owner_id", user.id)
      .eq("status", status)
      .order("updated_at", { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq("category", category);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    const { data: documents, error } = await query;
    
    if (error) {
      console.error("Failed to fetch documents:", error);
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
    
    return NextResponse.json({ documents: documents || [] });
    
  } catch (error) {
    console.error("Knowledge fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/mlf/knowledge
   Create a knowledge document with automatic chunking
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateKnowledgeDocumentRequest = await request.json();
    
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    // Create document
    const { data: document, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({
        owner_id: user.id,
        title: body.title,
        content: body.content,
        content_type: body.content_type || "markdown",
        source_type: body.source_type || "manual",
        source_url: body.source_url,
        category: body.category,
        tags: body.tags || [],
        visibility: body.visibility || "private",
        word_count: body.content.split(/\s+/).length,
      })
      .select()
      .single();
    
    if (docError || !document) {
      console.error("Failed to create document:", docError);
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
    }
    
    // Chunk the document
    const chunks = chunkText(body.content, 1000, 100);
    
    // Generate embeddings and create chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.content,
        dimensions: 1536,
      });
      
      await supabase
        .from("knowledge_chunks")
        .insert({
          document_id: document.id,
          content: chunk.content,
          chunk_index: i,
          start_char: chunk.start,
          end_char: chunk.end,
          embedding: embeddingResponse.data[0].embedding,
          token_count: Math.ceil(chunk.content.length * 0.25),
        });
    }
    
    // Log activity
    await logActivity({
      supabase,
      actorId: user.id,
      action: "knowledge.create",
      actionCategory: "data",
      resourceType: "knowledge_document",
      resourceId: document.id,
      resourceName: body.title,
      context: { chunk_count: chunks.length },
      request,
    });
    
    return NextResponse.json({ 
      document,
      chunks_created: chunks.length,
    });
    
  } catch (error) {
    console.error("Knowledge create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Chunk text into overlapping segments
 */
function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): { content: string; start: number; end: number }[] {
  const chunks: { content: string; start: number; end: number }[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";
  let currentStart = 0;
  let charIndex = 0;
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        start: currentStart,
        end: charIndex,
      });
      
      // Start new chunk with overlap
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(" ") + "\n\n" + paragraph;
      currentStart = charIndex - overlapWords.join(" ").length;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
    
    charIndex += paragraph.length + 2;
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      start: currentStart,
      end: text.length,
    });
  }
  
  return chunks;
}
