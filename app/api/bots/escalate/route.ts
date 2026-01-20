/* ═══════════════════════════════════════════════════════════════════════════
   HITL Escalation API
   Create Human-in-the-Loop escalation items from chat bot threads
   ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EscalateRequest {
  source_type: "chat_bot" | "gateway" | "workflow";
  source_id: string; // Conversation ID, request ID, etc.
  
  // Thread context to include
  thread_context?: {
    messages?: Array<{
      role: string;
      content: string;
      timestamp?: string;
    }>;
    channel_id?: string;
    channel_name?: string;
    user_name?: string;
    platform?: string;
  };
  
  // Escalation details
  reason: string;
  priority?: "normal" | "high" | "urgent";
  
  // Optional routing
  assign_to_team?: string;
  assign_to_user?: string;
}

interface EscalateResponse {
  success: boolean;
  escalation_id?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bots/escalate
// Create a new HITL escalation from a bot/integration
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Allow both authenticated users and bot tokens
    let tenantId: string | null = null;
    let createdBy: string | null = user?.id || null;

    if (user) {
      // Get tenant from user profile
      const { data: profile } = await supabase
        .from("709_profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      tenantId = profile?.tenant_id || null;
    } else {
      // Check for bot token in header
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer op_pt_")) {
        // Validate plugin token
        const adminSupabase = await createSupabaseAdmin();
        const tokenHash = await hashToken(authHeader.substring(7));
        
        const { data: tokenRecord } = await adminSupabase
          .from("plugin_tokens")
          .select("tenant_id, user_id")
          .eq("token_hash", tokenHash)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (tokenRecord) {
          tenantId = tokenRecord.tenant_id;
          createdBy = tokenRecord.user_id;
        }
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: EscalateRequest = await req.json();

    // Validate required fields
    if (!body.source_type || !body.source_id || !body.reason) {
      return NextResponse.json(
        {
          success: false,
          error: "source_type, source_id, and reason are required",
        },
        { status: 400 }
      );
    }

    const adminSupabase = await createSupabaseAdmin();

    // Create escalation record
    const { data: escalation, error } = await adminSupabase
      .from("hitl_escalations")
      .insert({
        tenant_id: tenantId,
        source_type: body.source_type,
        source_id: body.source_id,
        thread_context: body.thread_context || null,
        escalation_reason: body.reason,
        priority: body.priority || "normal",
        assigned_team: body.assign_to_team,
        assigned_to: body.assign_to_user || null,
        status: "pending",
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create escalation:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create escalation" },
        { status: 500 }
      );
    }

    // Log activity
    await adminSupabase.from("activity_ledger").insert({
      tenant_id: tenantId,
      actor_id: createdBy,
      actor_type: user ? "user" : "system",
      action: "hitl_escalation_created",
      action_category: "ai",
      resource_type: "hitl_escalation",
      resource_id: escalation.id,
      resource_name: `Escalation from ${body.source_type}`,
      context: {
        source_type: body.source_type,
        source_id: body.source_id,
        priority: body.priority || "normal",
        reason: body.reason,
      },
      success: true,
    });

    // If urgent priority, send notification (if notification system exists)
    if (body.priority === "urgent") {
      // TODO: Integrate with notification system
      console.log(`Urgent escalation created: ${escalation.id}`);
    }

    return NextResponse.json({
      success: true,
      escalation_id: escalation.id,
    } as EscalateResponse);
  } catch (error) {
    console.error("Escalation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bots/escalate
// List escalations (for admin dashboard)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 });
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    let query = supabase
      .from("hitl_escalations")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch escalations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      escalations: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching escalations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper function to hash token
// ─────────────────────────────────────────────────────────────────────────────

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
