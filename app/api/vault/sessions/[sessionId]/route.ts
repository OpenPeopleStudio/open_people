import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/vault/sessions/[sessionId]
   Revoke a specific session
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId: targetSessionId } = await params;
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
    const currentSessionId = request.headers.get("x-vault-session");
    if (!currentSessionId) {
      return NextResponse.json(
        { error: "Vault session required" },
        { status: 401 }
      );
    }
    
    const { data: currentSession } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at")
      .eq("id", currentSessionId)
      .single();
    
    if (!currentSession || !currentSession.is_active || new Date(currentSession.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }
    
    // Verify vault ownership
    const { data: vault } = await supabase
      .from("vault_spaces")
      .select("id")
      .eq("id", currentSession.vault_id)
      .eq("owner_id", user.id)
      .single();
    
    if (!vault) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Prevent revoking current session
    if (targetSessionId === currentSessionId) {
      return NextResponse.json(
        { error: "Cannot revoke current session" },
        { status: 400 }
      );
    }
    
    // Verify target session belongs to same vault
    const { data: targetSession } = await supabase
      .from("vault_sessions")
      .select("vault_id, device_name")
      .eq("id", targetSessionId)
      .single();
    
    if (!targetSession || targetSession.vault_id !== vault.id) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    
    // Revoke the session
    const { error: updateError } = await supabase
      .from("vault_sessions")
      .update({ is_active: false })
      .eq("id", targetSessionId);
    
    if (updateError) {
      console.error("Failed to revoke session:", updateError);
      return NextResponse.json(
        { error: "Failed to revoke session" },
        { status: 500 }
      );
    }
    
    // Log action
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "session_revoked",
        resource_type: "session",
        resource_id: targetSessionId,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { device_name: targetSession.device_name },
      });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
