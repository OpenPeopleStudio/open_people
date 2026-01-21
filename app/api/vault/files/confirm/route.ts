import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/files/confirm
   Confirm file upload completion and trigger AI analysis
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
    
    // Verify vault ownership
    const { data: vault } = await supabase
      .from("vault_spaces")
      .select("id")
      .eq("id", session.vault_id)
      .eq("owner_id", user.id)
      .single();
    
    if (!vault) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { file_id, content_hash, auth_tag, thumbnail_key } = body;
    
    if (!file_id || !content_hash) {
      return NextResponse.json(
        { error: "file_id and content_hash are required" },
        { status: 400 }
      );
    }
    
    // Verify file exists and is pending
    const { data: file, error: fileError } = await supabase
      .from("vault_files")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("id", file_id)
      .eq("status", "pending")
      .single();
    
    if (fileError || !file) {
      return NextResponse.json(
        { error: "File not found or already confirmed" },
        { status: 404 }
      );
    }
    
    // Check for duplicates
    const { data: duplicates } = await supabase
      .from("vault_files")
      .select("id, filename, created_at")
      .eq("vault_id", vault.id)
      .eq("content_hash", content_hash)
      .eq("status", "active")
      .limit(5);
    
    // Update file status to active
    const { data: updatedFile, error: updateError } = await supabase
      .from("vault_files")
      .update({
        status: "active",
        content_hash,
        thumbnail_key: thumbnail_key || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", file_id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to confirm file:", updateError);
      return NextResponse.json(
        { error: "Failed to confirm file" },
        { status: 500 }
      );
    }
    
    // Log upload
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "file_upload",
        resource_type: "file",
        resource_id: file_id,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { 
          filename: file.filename,
          size_bytes: file.size_bytes,
          has_duplicates: duplicates && duplicates.length > 0,
        },
      });
    
    // If duplicates found, create a suggestion
    if (duplicates && duplicates.length > 0) {
      await supabase
        .from("vault_suggestions")
        .insert({
          vault_id: vault.id,
          type: "duplicate",
          priority: "medium",
          title: `Duplicate file detected: ${file.filename}`,
          description: `This file appears to be a duplicate of ${duplicates.length} existing file(s). Consider removing duplicates to save space.`,
          file_ids: [file_id, ...duplicates.map(d => d.id)],
          suggested_action: {
            action: "delete",
            file_ids: [file_id], // Suggest deleting the newer one
          },
          confidence: 1.0,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });
    }
    
    // Queue AI analysis (async)
    // In production, this would trigger a background job
    // For now, we'll call it inline but not block on it
    queueAIAnalysis(vault.id, file_id, file.r2_key, file.content_type, file.filename).catch(err => {
      console.error("AI analysis error:", err);
    });
    
    return NextResponse.json({
      success: true,
      file: updatedFile,
      duplicates_found: duplicates?.length || 0,
    });
    
  } catch (error) {
    console.error("Vault confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Queue AI analysis for the uploaded file
 * Runs asynchronously after file upload confirmation
 */
async function queueAIAnalysis(
  vaultId: string,
  fileId: string,
  r2Key: string,
  contentType: string,
  filename: string
) {
  const supabase = await createSupabaseServer();
  
  console.log(`AI analysis started for file ${fileId} (${filename})`);
  
  try {
    // For client-side encrypted files, we can only do filename-based analysis
    // unless the client sends decrypted content via /api/vault/ai/analyze-content
    
    // Import and run analysis based on filename/content-type
    const { analyzeDocument } = await import("@/lib/vault/ai-analysis");
    
    const analysis = await analyzeDocument({
      filename,
      contentType,
      sizeBytes: 0, // Unknown at this point
    });
    
    // Update file with AI metadata
    await supabase
      .from("vault_files")
      .update({
        ai_category: analysis.category,
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_extracted_data: analysis.extractedData,
        ai_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId);
    
    // Log successful analysis
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vaultId,
        action: "ai_analysis",
        resource_type: "file",
        resource_id: fileId,
        performed_by: "system",
        success: true,
        metadata: {
          category: analysis.category,
          confidence: analysis.confidence,
          filename_based: true,
        },
      });
    
    console.log(`AI analysis completed for file ${fileId}: ${analysis.category}`);
    
  } catch (error) {
    console.error(`AI analysis failed for file ${fileId}:`, error);
    
    // Log failure
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vaultId,
        action: "ai_analysis",
        resource_type: "file",
        resource_id: fileId,
        performed_by: "system",
        success: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
  }
}
