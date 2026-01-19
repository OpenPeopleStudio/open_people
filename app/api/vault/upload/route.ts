import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUploadUrl } from "@/lib/storage/r2";
import { generateRandomBytes, bufferToBase64, generateKeyId } from "@/lib/vault/encryption";
import type { VaultUploadRequest, VaultUploadResponse } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/upload
   Get presigned upload URL and encryption details for client-side upload
   
   Flow:
   1. Client requests upload URL with file metadata
   2. Server returns presigned URL + encryption key/IV
   3. Client encrypts file locally with provided key
   4. Client uploads encrypted file to presigned URL
   5. Client calls POST /api/vault/files/confirm to finalize
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
    
    // Get active encryption key
    const { data: encryptionKey } = await supabase
      .from("vault_encryption_keys")
      .select("id")
      .eq("vault_id", vault.id)
      .eq("is_active", true)
      .single();
    
    if (!encryptionKey) {
      return NextResponse.json(
        { error: "No active encryption key" },
        { status: 500 }
      );
    }
    
    // Parse request body
    const body: VaultUploadRequest = await request.json();
    const { filename, content_type, size_bytes, folder_id } = body;
    
    if (!filename || !content_type || !size_bytes) {
      return NextResponse.json(
        { error: "filename, content_type, and size_bytes are required" },
        { status: 400 }
      );
    }
    
    // Verify folder exists if specified
    if (folder_id) {
      const { data: folder } = await supabase
        .from("vault_folders")
        .select("id")
        .eq("vault_id", vault.id)
        .eq("id", folder_id)
        .single();
      
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }
    }
    
    // Generate file ID and presigned upload URL
    const fileId = crypto.randomUUID();
    const { url: uploadUrl, key: r2Key } = await getUploadUrl(
      vault.id,
      "vault-files",
      `${fileId}.enc`,
      content_type,
      3600 // 1 hour expiry
    );
    
    // Generate encryption IV for this file
    const iv = generateRandomBytes(12);
    const ivBase64 = bufferToBase64(iv);
    
    // Create pending file record
    const { error: fileError } = await supabase
      .from("vault_files")
      .insert({
        id: fileId,
        vault_id: vault.id,
        folder_id: folder_id || null,
        r2_key: r2Key,
        filename,
        content_type,
        size_bytes,
        encryption_key_id: encryptionKey.id,
        encryption_iv: ivBase64,
        content_hash: "", // Will be set after upload
        source_type: "manual",
        source_metadata: {
          upload_ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          upload_device: request.headers.get("user-agent"),
        },
        status: "pending",
      });
    
    if (fileError) {
      console.error("Failed to create file record:", fileError);
      return NextResponse.json(
        { error: "Failed to create file record" },
        { status: 500 }
      );
    }
    
    const response: VaultUploadResponse = {
      file_id: fileId,
      upload_url: uploadUrl,
      encryption_key: encryptionKey.id, // Client will use session key to encrypt
      encryption_iv: ivBase64,
    };
    
    // Update session activity
    await supabase
      .from("vault_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sessionId);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Vault upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
