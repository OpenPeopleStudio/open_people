import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  verifyPassword,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/vault/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/recovery-codes
   Get count of remaining recovery codes
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
    
    // Count remaining codes
    const { count, error: countError } = await supabase
      .from("vault_recovery_codes")
      .select("*", { count: "exact", head: true })
      .eq("vault_id", vault.id)
      .eq("is_used", false);
    
    if (countError) {
      console.error("Failed to count recovery codes:", countError);
      return NextResponse.json(
        { error: "Failed to get recovery codes count" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ remaining_codes: count || 0 });
    
  } catch (error) {
    console.error("Recovery codes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/recovery-codes
   Regenerate recovery codes (requires password)
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
    
    // Get vault with verification data
    const { data: vault } = await supabase
      .from("vault_spaces")
      .select("*")
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
    const { password } = body;
    
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
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }
    
    // Delete existing codes
    await supabase
      .from("vault_recovery_codes")
      .delete()
      .eq("vault_id", vault.id);
    
    // Generate new codes
    const newCodes = generateRecoveryCodes(10);
    
    const recoveryInserts = newCodes.map(code => ({
      vault_id: vault.id,
      code_hash: hashRecoveryCode(code),
    }));
    
    const { error: insertError } = await supabase
      .from("vault_recovery_codes")
      .insert(recoveryInserts);
    
    if (insertError) {
      console.error("Failed to insert recovery codes:", insertError);
      return NextResponse.json(
        { error: "Failed to generate recovery codes" },
        { status: 500 }
      );
    }
    
    // Log action
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "recovery_codes_regenerated",
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
      });
    
    return NextResponse.json({ recovery_codes: newCodes });
    
  } catch (error) {
    console.error("Regenerate recovery codes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
