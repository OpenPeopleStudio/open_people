import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Debug API
   GET /api/email/debug - Debug email data for current tenant
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  void request;
  try {
    const supabase = await createSupabaseServer();
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

    if (!["admin", "owner", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tenantId = profile.tenant_id;

    // Get summary stats
    const { data: messageStats } = await supabase
      .from("email_messages")
      .select("direction, status, account_id")
      .eq("tenant_id", tenantId);

    const inboundCount = messageStats?.filter(m => m.direction === "inbound").length || 0;
    const outboundCount = messageStats?.filter(m => m.direction === "outbound").length || 0;

    // Get recent messages
    const { data: recentMessages } = await supabase
      .from("email_messages")
      .select(`
        id,
        direction,
        subject,
        from_address,
        to_addresses,
        status,
        created_at,
        account_id,
        thread_id
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get accounts
    const { data: accounts } = await supabase
      .from("email_accounts")
      .select("id, name, email_address, mode, is_default")
      .eq("tenant_id", tenantId);

    // Get managed domains
    const { data: domains } = await supabase
      .from("managed_email_domains")
      .select("id, domain, status, account_id")
      .eq("tenant_id", tenantId);

    // Get threads
    const { data: threads } = await supabase
      .from("email_threads")
      .select("id, subject, status, message_count, last_message_at")
      .eq("tenant_id", tenantId)
      .order("last_message_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      tenant_id: tenantId,
      summary: {
        total_messages: messageStats?.length || 0,
        inbound_messages: inboundCount,
        outbound_messages: outboundCount,
      },
      accounts: accounts || [],
      domains: domains || [],
      recent_messages: recentMessages || [],
      recent_threads: threads || [],
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
