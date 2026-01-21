import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace SLAs API
   GET /api/email/workspace/slas - Get SLAs for tenant
   POST /api/email/workspace/slas - Create/update SLA
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Get SLAs for tenant
    const { data: slas, error } = await supabase
      .from("email_slas")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("priority", { ascending: true });

    if (error) {
      console.error("Get SLAs error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slas: slas || [] });
  } catch (error) {
    console.error("Get SLAs error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, priority, response_time_hours, resolution_time_hours, is_active = true } = body;

    if (!name || !priority || !response_time_hours) {
      return NextResponse.json(
        { error: "Missing required fields: name, priority, response_time_hours" },
        { status: 400 }
      );
    }

    // Create or update SLA
    const { data: sla, error } = await supabase
      .from("email_slas")
      .upsert({
        tenant_id: profile.tenant_id,
        name,
        description,
        priority,
        response_time_hours,
        resolution_time_hours: resolution_time_hours || response_time_hours * 2,
        is_active,
      }, {
        onConflict: "tenant_id,priority"
      })
      .select()
      .single();

    if (error) {
      console.error("Create SLA error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit event
    await supabase.rpc("log_email_event", {
      p_tenant_id: profile.tenant_id,
      p_event_type: "sla",
      p_event_subtype: "created",
      p_user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      sla,
    });
  } catch (error) {
    console.error("Create SLA error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}