import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  verifyPassword,
  createPasswordVerification,
  generateDEK,
  wrapDEK,
  unwrapDEK,
  generateKeyId,
  generateRecoveryCodes,
  hashRecoveryCode,
  bufferToBase64,
} from "@/lib/vault/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/password
   Change master password
   
   Process:
   1. Verify current password
   2. Unwrap DEK with old password
   3. Re-wrap DEK with new password
   4. Update password verification hash
   5. Optionally regenerate recovery codes
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
    
    // Get vault
    const { data: vault, error: vaultError } = await supabase
      .from("vault_spaces")
      .select("*")
      .eq("id", session.vault_id)
      .eq("owner_id", user.id)
      .single();
    
    if (vaultError || !vault) {
      return NextResponse.json(
        { error: "Vault not found" },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { current_password, new_password, regenerate_recovery_codes } = body;
    
    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 }
      );
    }
    
    if (new_password.length < 12) {
      return NextResponse.json(
        { error: "New password must be at least 12 characters" },
        { status: 400 }
      );
    }
    
    if (current_password === new_password) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }
    
    // Verify current password
    const isValid = await verifyPassword(current_password, {
      hash: vault.key_verification_hash,
      salt: vault.key_verification_salt,
    });
    
    if (!isValid) {
      // Log failed attempt
      await supabase
        .from("vault_audit_log")
        .insert({
          vault_id: vault.id,
          action: "password_change",
          performed_by: user.id,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          success: false,
          error_message: "Invalid current password",
        });
      
      return NextResponse.json(
        { error: "Current password is incorrect" },
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
    
    // Unwrap DEK with current password
    const dek = await unwrapDEK(
      {
        encryptedDek: encryptionKey.encrypted_dek,
        iv: encryptionKey.encryption_iv,
        salt: encryptionKey.encryption_salt,
        authTag: "",
      },
      current_password
    );
    
    // Re-wrap DEK with new password
    const newWrappedKey = await wrapDEK(dek, new_password);
    
    // Create new password verification
    const newVerification = await createPasswordVerification(new_password);
    
    // Update encryption key
    const { error: updateKeyError } = await supabase
      .from("vault_encryption_keys")
      .update({
        encrypted_dek: newWrappedKey.encryptedDek,
        encryption_iv: newWrappedKey.iv,
        encryption_salt: newWrappedKey.salt,
        rotated_at: new Date().toISOString(),
      })
      .eq("id", encryptionKey.id);
    
    if (updateKeyError) {
      console.error("Failed to update encryption key:", updateKeyError);
      return NextResponse.json(
        { error: "Failed to update encryption key" },
        { status: 500 }
      );
    }
    
    // Update vault verification hash
    const { error: updateVaultError } = await supabase
      .from("vault_spaces")
      .update({
        key_verification_hash: newVerification.hash,
        key_verification_salt: newVerification.salt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vault.id);
    
    if (updateVaultError) {
      console.error("Failed to update vault:", updateVaultError);
      return NextResponse.json(
        { error: "Failed to update vault" },
        { status: 500 }
      );
    }
    
    // Optionally regenerate recovery codes
    let newRecoveryCodes: string[] | null = null;
    
    if (regenerate_recovery_codes) {
      // Delete old recovery codes
      await supabase
        .from("vault_recovery_codes")
        .delete()
        .eq("vault_id", vault.id);
      
      // Generate new codes
      newRecoveryCodes = generateRecoveryCodes(10);
      
      const recoveryInserts = newRecoveryCodes.map(code => ({
        vault_id: vault.id,
        code_hash: hashRecoveryCode(code),
      }));
      
      await supabase
        .from("vault_recovery_codes")
        .insert(recoveryInserts);
    }
    
    // Invalidate all other sessions
    await supabase
      .from("vault_sessions")
      .update({ is_active: false })
      .eq("vault_id", vault.id)
      .neq("id", sessionId);
    
    // Log successful password change
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "password_change",
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: {
          recovery_codes_regenerated: !!regenerate_recovery_codes,
          sessions_invalidated: true,
        },
      });
    
    return NextResponse.json({
      success: true,
      recovery_codes: newRecoveryCodes,
      sessions_invalidated: true,
    });
    
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
