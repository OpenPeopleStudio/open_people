import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { analyzeDocument, type DocumentContext } from "@/lib/vault/ai-analysis";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/ai/analyze-content
   Analyze decrypted file content sent from client
   
   This endpoint receives decrypted content from the client for AI analysis.
   The content is analyzed but NOT stored - only the analysis results are saved.
   
   Body: {
     file_id: string,
     content_type: string,
     text_content?: string,      // For text files
     image_base64?: string,      // For images (without data URI prefix)
   }
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Vault session required" },
        { status: 401 }
      );
    }
    
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", sessionId)
      .single();
    
    if (!session || !session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }
    
    // Parse request
    const body = await request.json();
    const { file_id, content_type, text_content, image_base64 } = body;
    
    if (!file_id) {
      return NextResponse.json(
        { error: "file_id is required" },
        { status: 400 }
      );
    }
    
    // Get file
    const { data: file, error: fileError } = await supabase
      .from("vault_files")
      .select("*")
      .eq("id", file_id)
      .eq("vault_id", session.vault_id)
      .single();
    
    if (fileError || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Build document context
    const documentContext: DocumentContext = {
      filename: file.filename,
      contentType: content_type || file.content_type,
      sizeBytes: file.size_bytes,
      textContent: text_content,
      imageBase64: image_base64,
    };
    
    // Analyze the document
    const analysis = await analyzeDocument(documentContext);
    
    // Update file with AI metadata
    const { error: updateError } = await supabase
      .from("vault_files")
      .update({
        ai_category: analysis.category,
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_extracted_data: analysis.extractedData,
        ai_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", file_id);
    
    if (updateError) {
      console.error("Failed to update file with AI analysis:", updateError);
      return NextResponse.json(
        { error: "Failed to save analysis" },
        { status: 500 }
      );
    }
    
    // Log analysis
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: session.vault_id,
        action: "ai_analysis",
        resource_type: "file",
        resource_id: file_id,
        performed_by: user.id,
        success: true,
        metadata: {
          category: analysis.category,
          confidence: analysis.confidence,
          has_content: !!(text_content || image_base64),
        },
      });
    
    return NextResponse.json({
      success: true,
      category: analysis.category,
      summary: analysis.summary,
      tags: analysis.tags,
      extracted_data: analysis.extractedData,
      confidence: analysis.confidence,
      suggested_filename: analysis.suggestedFilename,
      suggested_folder: analysis.suggestedFolder,
    });
    
  } catch (error) {
    console.error("AI content analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
