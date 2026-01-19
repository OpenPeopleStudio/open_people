import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { VaultFolder, FolderTreeNode } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/folders
   List vault folders with optional tree structure
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
    
    // Get folders
    const { data: folders, error: foldersError } = await supabase
      .from("vault_folders")
      .select("*")
      .eq("vault_id", vault.id)
      .order("path", { ascending: true });
    
    if (foldersError) {
      console.error("Failed to fetch folders:", foldersError);
      return NextResponse.json(
        { error: "Failed to fetch folders" },
        { status: 500 }
      );
    }
    
    // Get file counts per folder
    const { data: fileCounts } = await supabase
      .from("vault_files")
      .select("folder_id")
      .eq("vault_id", vault.id)
      .eq("status", "active");
    
    const countMap = new Map<string, number>();
    (fileCounts || []).forEach(f => {
      if (f.folder_id) {
        countMap.set(f.folder_id, (countMap.get(f.folder_id) || 0) + 1);
      }
    });
    
    // Check if tree format is requested
    const asTree = request.nextUrl.searchParams.get("tree") === "true";
    
    if (asTree) {
      // Build tree structure
      const tree = buildFolderTree(folders || [], countMap);
      return NextResponse.json({ folders: tree });
    }
    
    // Return flat list with file counts
    const foldersWithCounts = (folders || []).map(f => ({
      ...f,
      file_count: countMap.get(f.id) || 0,
    }));
    
    // Update session activity
    await supabase
      .from("vault_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sessionId);
    
    return NextResponse.json({ folders: foldersWithCounts });
    
  } catch (error) {
    console.error("Vault folders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/folders
   Create a new folder
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
    const { name, parent_id, icon, color } = body;
    
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }
    
    // Sanitize name (no path separators)
    const sanitizedName = name.trim().replace(/[\/\\]/g, "-");
    
    // Build path
    let path = `/${sanitizedName}`;
    
    if (parent_id) {
      // Get parent folder
      const { data: parent } = await supabase
        .from("vault_folders")
        .select("path")
        .eq("vault_id", vault.id)
        .eq("id", parent_id)
        .single();
      
      if (!parent) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }
      
      path = `${parent.path}/${sanitizedName}`;
    }
    
    // Check for duplicate path
    const { data: existing } = await supabase
      .from("vault_folders")
      .select("id")
      .eq("vault_id", vault.id)
      .eq("path", path)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: "A folder with this name already exists in this location" },
        { status: 400 }
      );
    }
    
    // Create folder
    const { data: folder, error: folderError } = await supabase
      .from("vault_folders")
      .insert({
        vault_id: vault.id,
        parent_id: parent_id || null,
        name: sanitizedName,
        path,
        icon: icon || "folder",
        color: color || null,
      })
      .select()
      .single();
    
    if (folderError) {
      console.error("Failed to create folder:", folderError);
      return NextResponse.json(
        { error: "Failed to create folder" },
        { status: 500 }
      );
    }
    
    // Log folder creation
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "folder_create",
        resource_type: "folder",
        resource_id: folder.id,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { name: sanitizedName, path },
      });
    
    return NextResponse.json(folder);
    
  } catch (error) {
    console.error("Vault create folder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper: Build folder tree structure
   ═══════════════════════════════════════════════════════════════════════════ */

function buildFolderTree(
  folders: VaultFolder[],
  countMap: Map<string, number>
): FolderTreeNode[] {
  const nodeMap = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];
  
  // First pass: create all nodes
  for (const folder of folders) {
    nodeMap.set(folder.id, {
      ...folder,
      children: [],
      file_count: countMap.get(folder.id) || 0,
    });
  }
  
  // Second pass: build tree
  for (const folder of folders) {
    const node = nodeMap.get(folder.id)!;
    
    if (folder.parent_id && nodeMap.has(folder.parent_id)) {
      nodeMap.get(folder.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  
  // Sort children alphabetically
  const sortChildren = (nodes: FolderTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };
  
  sortChildren(roots);
  
  return roots;
}
