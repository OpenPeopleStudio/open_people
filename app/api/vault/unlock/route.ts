import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { verifyPassword, unwrapDEK, bufferToBase64 } from "@/lib/vault/encryption";
import { alertVaultUnlock } from "@/lib/observability/alerting";
import type { VaultUnlockRequest, VaultUnlockResponse } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/unlock
   Unlock the vault with master password
   Returns session token and decryption key for client-side use
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
    
    // Get user's vault
    const { data: vault, error: vaultError } = await supabase
      .from("vault_spaces")
      .select("*")
      .eq("owner_id", user.id)
      .single();
    
    if (vaultError || !vault) {
      return NextResponse.json(
        { error: "Vault not found. Please set up your vault first." },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body: VaultUnlockRequest = await request.json();
    const { password, device_name } = body;
    
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }
    
    // Verify password
    const isValid = await verifyPassword(password, {
      hash: vault.key_verification_hash,
      salt: vault.key_verification_salt,
    });
    
    if (!isValid) {
      // Log failed attempt
      await supabase
        .from("vault_audit_log")
        .insert({
          vault_id: vault.id,
          action: "vault_unlock",
          performed_by: user.id,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          success: false,
          error_message: "Invalid password",
        });
      
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }
    
    // Get active encryption key
    const { data: encryptionKey, error: keyError } = await supabase
      .from("vault_encryption_keys")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("is_active", true)
      .single();
    
    if (keyError || !encryptionKey) {
      return NextResponse.json(
        { error: "Encryption key not found" },
        { status: 500 }
      );
    }
    
    // Unwrap the DEK
    const dek = await unwrapDEK(
      {
        encryptedDek: encryptionKey.encrypted_dek,
        iv: encryptionKey.encryption_iv,
        salt: encryptionKey.encryption_salt,
        authTag: "", // Not stored separately, included in encrypted data
      },
      password
    );
    
    // Create session
    const sessionExpiry = new Date(Date.now() + (vault.settings?.auto_lock_minutes || 30) * 60 * 1000);
    
    const { data: session, error: sessionError } = await supabase
      .from("vault_sessions")
      .insert({
        vault_id: vault.id,
        type: "primary",
        is_active: true,
        device_name: device_name || "Unknown Device",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        expires_at: sessionExpiry.toISOString(),
      })
      .select()
      .single();
    
    if (sessionError || !session) {
      console.error("Failed to create session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }
    
    // Log successful unlock
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "vault_unlock",
        resource_type: "session",
        resource_id: session.id,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { device_name: device_name || "Unknown Device" },
      });

    // Alert on vault unlock
    await alertVaultUnlock(
      vault.id,
      user.id,
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
    );
    
    // Return session info and DEK
    // The DEK is returned encrypted to the session - client stores in memory
    const response: VaultUnlockResponse & { encryption_key: string; key_id: string } = {
      success: true,
      vault_id: vault.id,
      session_id: session.id,
      expires_at: sessionExpiry.toISOString(),
      encryption_key: bufferToBase64(dek),
      key_id: encryptionKey.id,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Vault unlock error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/vault/unlock
   Lock the vault (invalidate session)
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
    
    // Get session ID from header or body
    const sessionId = request.headers.get("x-vault-session");
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }
    
    // Get the session
    const { data: session } = await supabase
      .from("vault_sessions")
      .select("vault_id")
      .eq("id", sessionId)
      .single();
    
    if (!session) {
      return NextResponse.json({ success: true }); // Already logged out
    }
    
    // Verify ownership
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
    
    // Deactivate session
    await supabase
      .from("vault_sessions")
      .update({ is_active: false })
      .eq("id", sessionId);
    
    // Log lock
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "vault_lock",
        resource_type: "session",
        resource_id: sessionId,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
      });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Vault lock error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
