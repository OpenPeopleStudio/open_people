import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  createPasswordVerification,
  generateDEK,
  wrapDEK,
  generateKeyId,
  generateRecoveryCodes,
  hashRecoveryCode,
  bufferToBase64,
} from "@/lib/vault/encryption";
import type { VaultSetupResponse } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/setup
   Initialize a new vault for a super admin
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
    
    // Verify user is super admin
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can create vaults" },
        { status: 403 }
      );
    }
    
    // Check if vault already exists
    const { data: existingVault } = await supabase
      .from("vault_spaces")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    
    if (existingVault) {
      return NextResponse.json(
        { error: "Vault already exists for this user" },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { password, vault_name } = body;
    
    if (!password || typeof password !== "string" || password.length < 12) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters" },
        { status: 400 }
      );
    }
    
    // Create password verification hash
    const verification = await createPasswordVerification(password);
    
    // Create the vault
    const { data: vault, error: vaultError } = await supabase
      .from("vault_spaces")
      .insert({
        owner_id: user.id,
        name: vault_name || "My Vault",
        key_verification_hash: verification.hash,
        key_verification_salt: verification.salt,
      })
      .select()
      .single();
    
    if (vaultError || !vault) {
      console.error("Failed to create vault:", vaultError);
      return NextResponse.json(
        { error: "Failed to create vault" },
        { status: 500 }
      );
    }
    
    // Generate and wrap the Data Encryption Key (DEK)
    const dek = generateDEK();
    const wrappedKey = await wrapDEK(dek, password);
    const keyId = generateKeyId();
    
    // Store the encrypted DEK
    const { error: keyError } = await supabase
      .from("vault_encryption_keys")
      .insert({
        id: keyId,
        vault_id: vault.id,
        encrypted_dek: wrappedKey.encryptedDek,
        encryption_iv: wrappedKey.iv,
        encryption_salt: wrappedKey.salt,
        is_active: true,
      });
    
    if (keyError) {
      console.error("Failed to store encryption key:", keyError);
      // Rollback vault creation
      await supabase.from("vault_spaces").delete().eq("id", vault.id);
      return NextResponse.json(
        { error: "Failed to setup encryption" },
        { status: 500 }
      );
    }
    
    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    
    // Store hashed recovery codes
    const recoveryInserts = recoveryCodes.map(code => ({
      vault_id: vault.id,
      code_hash: hashRecoveryCode(code),
    }));
    
    const { error: recoveryError } = await supabase
      .from("vault_recovery_codes")
      .insert(recoveryInserts);
    
    if (recoveryError) {
      console.error("Failed to store recovery codes:", recoveryError);
    }
    
    // Create default folders
    const defaultFolders = [
      { name: "Invoices", path: "/Invoices", icon: "invoice" },
      { name: "Receipts", path: "/Receipts", icon: "receipt" },
      { name: "Contracts", path: "/Contracts", icon: "contract" },
      { name: "Statements", path: "/Statements", icon: "statement" },
      { name: "Tax Documents", path: "/Tax Documents", icon: "tax" },
      { name: "ID Documents", path: "/ID Documents", icon: "id" },
      { name: "Correspondence", path: "/Correspondence", icon: "mail" },
      { name: "Other", path: "/Other", icon: "folder" },
    ];
    
    await supabase
      .from("vault_folders")
      .insert(defaultFolders.map(f => ({
        vault_id: vault.id,
        name: f.name,
        path: f.path,
        icon: f.icon,
      })));
    
    // Create smart folders
    const smartFolders = [
      {
        name: "Recent",
        path: "/.smart/Recent",
        is_smart_folder: true,
        smart_folder_query: { date_range: "this_week" },
        icon: "clock",
      },
      {
        name: "From Email",
        path: "/.smart/From Email",
        is_smart_folder: true,
        smart_folder_query: { source_type: "email" },
        icon: "mail",
      },
    ];
    
    await supabase
      .from("vault_folders")
      .insert(smartFolders.map(f => ({
        vault_id: vault.id,
        ...f,
      })));
    
    // Log vault creation
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "vault_create",
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
      });
    
    const response: VaultSetupResponse = {
      vault_id: vault.id,
      recovery_codes: recoveryCodes,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Vault setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
