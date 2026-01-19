import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateQRChallenge, createQRApprovalData } from "@/lib/vault/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/qr
   Create a QR code challenge for cross-device unlock
   
   Flow:
   1. User on new device requests QR unlock
   2. Server generates challenge and returns QR data
   3. User scans QR with authenticated device (mobile app)
   4. Authenticated device calls POST /api/vault/qr/approve
   5. New device polls GET /api/vault/qr/status until approved
   6. Once approved, new device can unlock vault
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
      .select("id")
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
    const { device_name } = body;
    
    // Generate challenge
    const { challenge, expiresAt } = generateQRChallenge();
    
    // Create QR approval session
    const { data: session, error: sessionError } = await supabase
      .from("vault_sessions")
      .insert({
        vault_id: vault.id,
        type: "qr_approval",
        is_active: false, // Will be activated when approved
        qr_challenge: challenge,
        qr_device_name: device_name || "Unknown Device",
        qr_requested_at: new Date().toISOString(),
        qr_expires_at: expiresAt.toISOString(),
        qr_approved: false,
        device_name: device_name || "Unknown Device",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min session expiry
      })
      .select()
      .single();
    
    if (sessionError || !session) {
      console.error("Failed to create QR session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create QR session" },
        { status: 500 }
      );
    }
    
    // Create QR code data
    const qrData = createQRApprovalData(vault.id, challenge, device_name || "Unknown Device");
    
    // Log QR request
    await supabase
      .from("vault_audit_log")
      .insert({
        vault_id: vault.id,
        action: "qr_approval_request",
        resource_type: "session",
        resource_id: session.id,
        performed_by: user.id,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: true,
        metadata: { device_name: device_name || "Unknown Device" },
      });
    
    return NextResponse.json({
      session_id: session.id,
      qr_data: qrData,
      challenge,
      expires_at: expiresAt.toISOString(),
    });
    
  } catch (error) {
    console.error("QR request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/vault/qr
   Check QR approval status (polling endpoint)
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
    
    // Get session ID from query
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }
    
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("vault_sessions")
      .select("*, vault_spaces!inner(owner_id)")
      .eq("id", sessionId)
      .eq("type", "qr_approval")
      .single();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    
    // Verify ownership
    if (session.vault_spaces.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    // Check if expired
    if (new Date(session.qr_expires_at) < new Date()) {
      return NextResponse.json({
        status: "expired",
        approved: false,
      });
    }
    
    // Check if approved
    if (session.qr_approved) {
      return NextResponse.json({
        status: "approved",
        approved: true,
        approved_at: session.qr_approved_at,
      });
    }
    
    return NextResponse.json({
      status: "pending",
      approved: false,
      expires_at: session.qr_expires_at,
    });
    
  } catch (error) {
    console.error("QR status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
