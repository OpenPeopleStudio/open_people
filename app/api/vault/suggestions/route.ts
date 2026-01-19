import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateSuggestions, detectDuplicates } from "@/lib/vault/ai-analysis";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/suggestions
   Get AI-generated suggestions for vault organization
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
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
    
    // Get existing suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("vault_suggestions")
      .select("*")
      .eq("vault_id", session.vault_id)
      .eq("status", "pending")
      .order("confidence", { ascending: false })
      .limit(10);
    
    if (suggestionsError) {
      console.error("Failed to fetch suggestions:", suggestionsError);
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ suggestions: suggestions || [] });
    
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/suggestions
   Generate new suggestions using AI
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
    
    // Get files for analysis
    const { data: files, error: filesError } = await supabase
      .from("vault_files")
      .select("id, filename, ai_category, content_hash, size_bytes, ai_summary, ai_extracted_data, created_at")
      .eq("vault_id", session.vault_id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (filesError) {
      console.error("Failed to fetch files:", filesError);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }
    
    // Get folders
    const { data: folders, error: foldersError } = await supabase
      .from("vault_folders")
      .select("id, name, path")
      .eq("vault_id", session.vault_id);
    
    if (foldersError) {
      console.error("Failed to fetch folders:", foldersError);
    }
    
    // Detect duplicates first
    const duplicates = detectDuplicates(
      (files || []).map(f => ({
        id: f.id,
        filename: f.filename,
        contentHash: f.content_hash,
        sizeBytes: f.size_bytes,
        createdAt: f.created_at,
      }))
    );
    
    // Generate AI suggestions
    const aiSuggestions = await generateSuggestions({
      files: (files || []).map(f => ({
        id: f.id,
        filename: f.filename,
        category: f.ai_category,
        contentHash: f.content_hash,
        sizeBytes: f.size_bytes,
        summary: f.ai_summary,
        extractedData: f.ai_extracted_data,
        createdAt: f.created_at,
      })),
      folders: (folders || []).map(f => ({
        id: f.id,
        name: f.name,
        path: f.path,
      })),
    });
    
    // Combine duplicate suggestions with AI suggestions
    const allSuggestions = [
      ...duplicates.map(dup => ({
        type: "duplicate" as const,
        title: "Duplicate files detected",
        description: `${dup.files.length} files have identical content`,
        fileIds: dup.files.map(f => f.id),
        suggestedAction: { keepNewest: true, deleteOthers: true },
        confidence: 1.0,
      })),
      ...aiSuggestions,
    ];
    
    // Clear old pending suggestions
    await supabase
      .from("vault_suggestions")
      .delete()
      .eq("vault_id", session.vault_id)
      .eq("status", "pending");
    
    // Insert new suggestions
    if (allSuggestions.length > 0) {
      const { error: insertError } = await supabase
        .from("vault_suggestions")
        .insert(
          allSuggestions.map(s => ({
            vault_id: session.vault_id,
            type: s.type,
            title: s.title,
            description: s.description,
            file_ids: s.fileIds,
            suggested_action: s.suggestedAction,
            confidence: s.confidence,
            status: "pending",
          }))
        );
      
      if (insertError) {
        console.error("Failed to insert suggestions:", insertError);
      }
    }
    
    // Log action
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: session.vault_id,
        action: "suggestions_generated",
        performed_by: user.id,
        success: true,
        metadata: {
          count: allSuggestions.length,
          duplicates: duplicates.length,
        },
      });
    
    return NextResponse.json({
      success: true,
      suggestions: allSuggestions,
      duplicates_found: duplicates.length,
    });
    
  } catch (error) {
    console.error("Generate suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/vault/suggestions
   Update suggestion status (accept/dismiss)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: NextRequest) {
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
    const { suggestion_id, action } = body;
    
    if (!suggestion_id || !["accept", "dismiss"].includes(action)) {
      return NextResponse.json(
        { error: "suggestion_id and action (accept/dismiss) are required" },
        { status: 400 }
      );
    }
    
    // Update suggestion
    const { error: updateError } = await supabase
      .from("vault_suggestions")
      .update({
        status: action === "accept" ? "accepted" : "dismissed",
        acted_at: new Date().toISOString(),
      })
      .eq("id", suggestion_id)
      .eq("vault_id", session.vault_id);
    
    if (updateError) {
      console.error("Failed to update suggestion:", updateError);
      return NextResponse.json(
        { error: "Failed to update suggestion" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Update suggestion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
