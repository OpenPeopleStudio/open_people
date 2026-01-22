import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/storage/r2";
import type { VaultPreviewResponse } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/files/[fileId]/preview
   Get file preview data for client-side display
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

    // Get presigned download URL for the main file
    const downloadUrl = await getDownloadUrl(file.r2_key, 3600); // 1 hour expiry

    // Check if thumbnail exists for image previews
    let thumbnailUrl: string | null = null;
    if (file.thumbnail_key && file.content_type.startsWith('image/')) {
      thumbnailUrl = await getDownloadUrl(file.thumbnail_key, 3600);
    }

    // Log preview access
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "file_preview",
        resource_type: "file",
        resource_id: fileId,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: {
          filename: file.filename,
          content_type: file.content_type,
          size_bytes: file.size_bytes
        },
      });

    const response: VaultPreviewResponse = {
      download_url: downloadUrl,
      encryption_key: file.encryption_key_id,
      encryption_iv: file.encryption_iv,
      filename: file.filename,
      content_type: file.content_type,
      size_bytes: file.size_bytes,
      thumbnail_url: thumbnailUrl,
      // Include file metadata for preview context
      ai_summary: file.ai_summary,
      ai_category: file.ai_category,
    };

    // Update session activity
    await supabase
      .from("vault_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sessionId);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Vault file preview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}