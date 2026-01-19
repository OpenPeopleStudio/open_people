import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/folders/[folderId]
   Get folder details
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
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
    
    // Get folder
    const { data: folder, error: folderError } = await supabase
      .from("vault_folders")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("id", folderId)
      .single();
    
    if (folderError || !folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(folder);
    
  } catch (error) {
    console.error("Get folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/vault/folders/[folderId]
   Update folder (rename, move, change icon/color)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
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
    
    // Get current folder
    const { data: folder } = await supabase
      .from("vault_folders")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("id", folderId)
      .single();
    
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, parent_id, icon, color } = body;
    
    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    let newPath = folder.path;
    
    if (name !== undefined) {
      const sanitizedName = name.trim().replace(/[\/\\]/g, "-");
      updates.name = sanitizedName;
      
      // Update path
      const pathParts = folder.path.split("/");
      pathParts[pathParts.length - 1] = sanitizedName;
      newPath = pathParts.join("/");
      updates.path = newPath;
    }
    
    if (parent_id !== undefined) {
      if (parent_id === null) {
        // Move to root
        updates.parent_id = null;
        updates.path = `/${folder.name}`;
        newPath = `/${folder.name}`;
      } else {
        // Move to new parent
        const { data: newParent } = await supabase
          .from("vault_folders")
          .select("path")
          .eq("vault_id", vault.id)
          .eq("id", parent_id)
          .single();
        
        if (!newParent) {
          return NextResponse.json(
            { error: "Parent folder not found" },
            { status: 404 }
          );
        }
        
        updates.parent_id = parent_id;
        newPath = `${newParent.path}/${name || folder.name}`;
        updates.path = newPath;
      }
    }
    
    if (icon !== undefined) {
      updates.icon = icon;
    }
    
    if (color !== undefined) {
      updates.color = color;
    }
    
    // Check for duplicate path
    if (updates.path) {
      const { data: existing } = await supabase
        .from("vault_folders")
        .select("id")
        .eq("vault_id", vault.id)
        .eq("path", updates.path)
        .neq("id", folderId)
        .single();
      
      if (existing) {
        return NextResponse.json(
          { error: "A folder with this name already exists in this location" },
          { status: 400 }
        );
      }
    }
    
    // Update folder
    const { data: updatedFolder, error: updateError } = await supabase
      .from("vault_folders")
      .update(updates)
      .eq("id", folderId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update folder:", updateError);
      return NextResponse.json(
        { error: "Failed to update folder" },
        { status: 500 }
      );
    }
    
    // Update child folder paths if path changed
    if (updates.path && updates.path !== folder.path) {
      const oldPrefix = folder.path;
      const newPrefix = newPath;
      
      // Get all descendants
      const { data: descendants } = await supabase
        .from("vault_folders")
        .select("id, path")
        .eq("vault_id", vault.id)
        .like("path", `${oldPrefix}/%`);
      
      // Update each descendant's path
      for (const desc of descendants || []) {
        const updatedPath = desc.path.replace(oldPrefix, newPrefix);
        await supabase
          .from("vault_folders")
          .update({ path: updatedPath })
          .eq("id", desc.id);
      }
    }
    
    // Log update
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "folder_rename",
        resource_type: "folder",
        resource_id: folderId,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { updates },
      });
    
    return NextResponse.json(updatedFolder);
    
  } catch (error) {
    console.error("Update folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/vault/folders/[folderId]
   Delete folder (and optionally move files)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
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
    
    // Get folder
    const { data: folder } = await supabase
      .from("vault_folders")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("id", folderId)
      .single();
    
    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }
    
    // Check for files in folder
    const { count: fileCount } = await supabase
      .from("vault_files")
      .select("*", { count: "exact", head: true })
      .eq("folder_id", folderId)
      .eq("status", "active");
    
    if (fileCount && fileCount > 0) {
      // Move files to root instead of blocking
      await supabase
        .from("vault_files")
        .update({ folder_id: null })
        .eq("folder_id", folderId);
    }
    
    // Delete folder (cascade will handle children due to FK)
    const { error: deleteError } = await supabase
      .from("vault_folders")
      .delete()
      .eq("id", folderId);
    
    if (deleteError) {
      console.error("Failed to delete folder:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete folder" },
        { status: 500 }
      );
    }
    
    // Log deletion
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "folder_delete",
        resource_type: "folder",
        resource_id: folderId,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { name: folder.name, path: folder.path, files_moved: fileCount || 0 },
      });
    
    return NextResponse.json({ 
      success: true,
      files_moved: fileCount || 0,
    });
    
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
