import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage/r2";
import type { VaultDownloadResponse } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/files/[fileId]
   Get file details and download URL
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: Request, context: any) {
  try {
    const { fileId } = context.params;
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
    
    // Get file
    const { data: file, error: fileError } = await supabase
      .from("vault_files")
      .select(`
        *,
        folder:vault_folders(id, name, path)
      `)
      .eq("vault_id", vault.id)
      .eq("id", fileId)
      .single();
    
    if (fileError || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    
    // Check if download is requested
    const isDownload = request.nextUrl.searchParams.get("download") === "true";
    
    if (isDownload) {
      // Get presigned download URL
      const downloadUrl = await getDownloadUrl(file.r2_key, 3600); // 1 hour expiry
      
      // Log download
      await supabase
        .from("vault_audit_log")
        .insert({
          vault_id: vault.id,
          action: "file_download",
          resource_type: "file",
          resource_id: fileId,
          performed_by: user.id,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          success: true,
          metadata: { filename: file.filename },
        });
      
      const response: VaultDownloadResponse = {
        download_url: downloadUrl,
        encryption_key: file.encryption_key_id,
        encryption_iv: file.encryption_iv,
        auth_tag: "", // Will be included in the encrypted file
        filename: file.filename,
        content_type: file.content_type,
        size_bytes: file.size_bytes,
      };
      
      return NextResponse.json(response);
    }
    
    // Return file metadata
    const responseFile = {
      ...file,
      folder_path: file.folder?.path,
      folder_name: file.folder?.name,
      folder: undefined,
    };
    
    // Update session activity
    await supabase
      .from("vault_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sessionId);
    
    return NextResponse.json(responseFile);
    
  } catch (error) {
    console.error("Vault file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
