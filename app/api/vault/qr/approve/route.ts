import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { parseQRApprovalData } from "@/lib/vault/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/qr/approve
   Approve a QR unlock request from an authenticated device
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
    
    // This request must come from an already-unlocked vault session
    const sessionId = request.headers.get("x-vault-session");
    if (!sessionId) {
      return NextResponse.json(
        { error: "Active vault session required to approve QR requests" },
        { status: 401 }
      );
    }
    
    // Verify the approving session is valid
    const { data: approvingSession } = await supabase
      .from("vault_sessions")
      .select("vault_id, is_active, expires_at, type")
      .eq("id", sessionId)
      .single();
    
    if (!approvingSession || !approvingSession.is_active || 
        new Date(approvingSession.expires_at) < new Date() ||
        approvingSession.type !== "primary") {
      return NextResponse.json(
        { error: "Valid primary session required to approve" },
        { status: 401 }
      );
    }
    
    // Verify vault ownership
    const { data: vault } = await supabase
      .from("vault_spaces")
      .select("id")
      .eq("id", approvingSession.vault_id)
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
    const { qr_data, challenge, approve } = body;
    
    if (!challenge) {
      return NextResponse.json(
        { error: "challenge is required" },
        { status: 400 }
      );
    }
    
    // If QR data is provided, validate it
    if (qr_data) {
      const parsed = parseQRApprovalData(qr_data);
      if (!parsed.valid) {
        return NextResponse.json(
          { error: parsed.error || "Invalid QR code" },
          { status: 400 }
        );
      }
      
      if (parsed.vaultId !== vault.id) {
        return NextResponse.json(
          { error: "QR code is for a different vault" },
          { status: 400 }
        );
      }
      
      if (parsed.challenge !== challenge) {
        return NextResponse.json(
          { error: "Challenge mismatch" },
          { status: 400 }
        );
      }
    }
    
    // Find the pending QR session
    const { data: qrSession, error: qrError } = await supabase
      .from("vault_sessions")
      .select("*")
      .eq("vault_id", vault.id)
      .eq("qr_challenge", challenge)
      .eq("type", "qr_approval")
      .eq("qr_approved", false)
      .single();
    
    if (qrError || !qrSession) {
      return NextResponse.json(
        { error: "QR request not found or already processed" },
        { status: 404 }
      );
    }
    
    // Check if expired
    if (new Date(qrSession.qr_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "QR request has expired" },
        { status: 400 }
      );
    }
    
    if (approve === false) {
      // Reject the request
      await supabase
        .from("vault_sessions")
        .delete()
        .eq("id", qrSession.id);
      
      // Log rejection
      await supabase
        .from("vault_audit_log")
        .insert({
          vault_id: vault.id,
          action: "qr_approval_grant",
          resource_type: "session",
          resource_id: qrSession.id,
          performed_by: user.id,
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
          user_agent: request.headers.get("user-agent"),
          success: false,
          error_message: "Request rejected by user",
          metadata: { device_name: qrSession.qr_device_name },
        });
      
      return NextResponse.json({
        success: true,
        action: "rejected",
      });
    }
    
    // Approve the request
    const { error: updateError } = await supabase
      .from("vault_sessions")
      .update({
        qr_approved: true,
        qr_approved_at: new Date().toISOString(),
        is_active: true,
      })
      .eq("id", qrSession.id);
    
    if (updateError) {
      console.error("Failed to approve QR request:", updateError);
      return NextResponse.json(
        { error: "Failed to approve request" },
        { status: 500 }
      );
    }
    
    // Log approval
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "qr_approval_grant",
        resource_type: "session",
        resource_id: qrSession.id,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { 
          device_name: qrSession.qr_device_name,
          approver_session: sessionId,
        },
      });
    
    return NextResponse.json({
      success: true,
      action: "approved",
      device_name: qrSession.qr_device_name,
    });
    
  } catch (error) {
    console.error("QR approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
