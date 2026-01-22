import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { VaultSearchParams, VaultSearchResponse } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/files
   List vault files with search and filtering
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
    
    // Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const queryParam = searchParams.get("query") || undefined;
    const categoryParam = searchParams.get("category") as VaultSearchParams["category"] | null;
    const folderIdParam = searchParams.get("folder_id") || undefined;
    const tagsParam = searchParams.get("tags")?.split(",") || undefined;
    const sourceTypeParam =
      (searchParams.get("source_type") as VaultSearchParams["source_type"] | null) || undefined;
    const dateFromParam = searchParams.get("date_from") || undefined;
    const dateToParam = searchParams.get("date_to") || undefined;

    const params: VaultSearchParams = {
      limit,
      offset,
      ...(queryParam ? { query: queryParam } : {}),
      ...(categoryParam ? { category: categoryParam } : {}),
      ...(folderIdParam ? { folder_id: folderIdParam } : {}),
      ...(tagsParam ? { tags: tagsParam } : {}),
      ...(sourceTypeParam ? { source_type: sourceTypeParam } : {}),
      ...(dateFromParam ? { date_from: dateFromParam } : {}),
      ...(dateToParam ? { date_to: dateToParam } : {}),
    };
    
    // Build query
    let query = supabase
      .from("vault_files")
      .select(`
        *,
        folder:vault_folders(id, name, path)
      `, { count: "exact" })
      .eq("vault_id", vault.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    
    // Apply filters
    if (params.query) {
      // Full-text search on filename and ai_summary
      query = query.or(`filename.ilike.%${params.query}%,ai_summary.ilike.%${params.query}%`);
    }
    
    if (params.category) {
      query = query.eq("ai_category", params.category);
    }
    
    if (params.folder_id) {
      query = query.eq("folder_id", params.folder_id);
    }
    
    if (params.tags && params.tags.length > 0) {
      query = query.overlaps("ai_tags", params.tags);
    }
    
    if (params.source_type) {
      query = query.eq("source_type", params.source_type);
    }
    
    if (params.date_from) {
      query = query.gte("created_at", params.date_from);
    }
    
    if (params.date_to) {
      query = query.lte("created_at", params.date_to);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: files, error: filesError, count } = await query;
    
    if (filesError) {
      console.error("Failed to fetch files:", filesError);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }
    
    // Transform response
    const transformedFiles = (files || []).map(file => ({
      ...file,
      folder_path: file.folder?.path,
      folder_name: file.folder?.name,
      folder: undefined,
    }));
    
    const response: VaultSearchResponse = {
      files: transformedFiles,
      total: count || 0,
      has_more: offset + limit < (count || 0),
    };
    
    // Update session activity
    await supabase
      .from("vault_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sessionId);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Vault files error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/vault/files
   Soft delete files (move to deleted status)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: NextRequest) {
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
    const { file_ids } = body;
    
    if (!Array.isArray(file_ids) || file_ids.length === 0) {
      return NextResponse.json(
        { error: "file_ids array is required" },
        { status: 400 }
      );
    }
    
    // Soft delete files
    const { data: deletedFiles, error: deleteError } = await supabase
      .from("vault_files")
      .update({
        status: "deleted",
        deleted_at: new Date().toISOString(),
      })
      .eq("vault_id", vault.id)
      .in("id", file_ids)
      .select("id, filename");
    
    if (deleteError) {
      console.error("Failed to delete files:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete files" },
        { status: 500 }
      );
    }
    
    // Log deletion
    for (const file of deletedFiles || []) {
      await supabase
        .from("vault_audit_log")
        .insert({
          vault_id: vault.id,
          action: "file_delete",
          resource_type: "file",
          resource_id: file.id,
          performed_by: user.id,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          success: true,
          metadata: { filename: file.filename },
        });
    }
    
    return NextResponse.json({
      success: true,
      deleted_count: deletedFiles?.length || 0,
    });
    
  } catch (error) {
    console.error("Vault delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/vault/files
   Update file metadata (move, rename, update tags)
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
    const { file_id, folder_id, filename, ai_tags } = body;
    
    if (!file_id) {
      return NextResponse.json(
        { error: "file_id is required" },
        { status: 400 }
      );
    }
    
    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (folder_id !== undefined) {
      updates.folder_id = folder_id;
    }
    
    if (filename) {
      updates.filename = filename;
    }
    
    if (ai_tags) {
      updates.ai_tags = ai_tags;
    }
    
    // Update file
    const { data: updatedFile, error: updateError } = await supabase
      .from("vault_files")
      .update(updates)
      .eq("vault_id", vault.id)
      .eq("id", file_id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update file:", updateError);
      return NextResponse.json(
        { error: "Failed to update file" },
        { status: 500 }
      );
    }
    
    // Log update
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: folder_id !== undefined ? "file_move" : "file_update",
        resource_type: "file",
        resource_id: file_id,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { updates },
      });
    
    return NextResponse.json(updatedFile);
    
  } catch (error) {
    console.error("Vault update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
