import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Policies API
   GET /api/email/workspace/policies - Get tenant email policies
   POST /api/email/workspace/policies - Update tenant email policies
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  void request;
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only allow admins and owners to view policies
    if (!["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get policies for tenant
    const { data: policies, error } = await supabase
      .from("email_policies")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Get policies error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Get policies error:", error);
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Only allow admins and owners to update policies
    if (!["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      signature_template,
      allowed_domains = [],
      blocked_domains = [],
      max_attachment_size_mb = 10,
      require_tls = true,
      dlp_patterns = [],
      auto_archive_days = 30,
      auto_delete_spam_days = 7,
    } = body;

    // Update or create policies
    const { data: policies, error } = await supabase
      .from("email_policies")
      .upsert({
        tenant_id: profile.tenant_id,
        signature_template,
        allowed_domains,
        blocked_domains,
        max_attachment_size_mb,
        require_tls,
        dlp_patterns,
        auto_archive_days,
        auto_delete_spam_days,
      })
      .select()
      .single();

    if (error) {
      console.error("Update policies error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit event
    await supabase.rpc("log_email_event", {
      p_tenant_id: profile.tenant_id,
      p_event_type: "policy",
      p_event_subtype: "updated",
      p_user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      policies,
    });
  } catch (error) {
    console.error("Update policies error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
