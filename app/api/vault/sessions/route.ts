import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/sessions
   List all active sessions for the vault
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
    
    // Get all sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from("vault_sessions")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("is_active", true)
      .order("last_activity_at", { ascending: false });
    
    if (sessionsError) {
      console.error("Failed to fetch sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ sessions: sessions || [] });
    
  } catch (error) {
    console.error("Sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/vault/sessions
   Revoke all sessions except current
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
    
    // Revoke all other sessions
    const { error: updateError } = await supabase
      .from("vault_sessions")
      .update({ is_active: false })
      .eq("vault_id", vault.id)
      .neq("id", sessionId);
    
    if (updateError) {
      console.error("Failed to revoke sessions:", updateError);
      return NextResponse.json(
        { error: "Failed to revoke sessions" },
        { status: 500 }
      );
    }
    
    // Log action
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "sessions_revoked",
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { except_session: sessionId },
      });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Revoke sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
