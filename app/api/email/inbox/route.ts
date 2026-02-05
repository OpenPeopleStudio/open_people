import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logPerformance } from "@/lib/observability/logger";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Inbox API
   GET /api/email/inbox - List inbox messages
   
   Supports:
   - Tenant users: see their tenant's messages
   - Super admins: see all messages (platform-level) or filter by tenant_id param
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const adminSupabase = await createSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenant_id");
    const accountId = searchParams.get("accountId");
    const mailbox = searchParams.get("mailbox") || "INBOX";
    const direction = searchParams.get("direction"); // inbound | outbound
    const status = searchParams.get("status");
    const unreadOnly = searchParams.get("unread") === "true";
    const starredOnly = searchParams.get("starred") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    // Determine tenant filter
    let tenantId: string | null = profile?.tenant_id || null;
    if (isSuperAdmin && requestedTenantId) {
      tenantId = requestedTenantId;
    }

    // Non-super-admins must have a tenant
    if (!isSuperAdmin && !tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Use admin client for super admins to bypass RLS
    const queryClient = isSuperAdmin ? adminSupabase : supabase;

    let query = queryClient
      .from("email_messages")
      .select("*, account:email_accounts(id, name, email_address)", { count: "exact" })
      .eq("is_deleted", false)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .order("received_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by tenant (super admins can see all if no tenant specified)
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    } else if (isSuperAdmin) {
      // Super admin viewing platform-level (null tenant) messages
      query = query.is("tenant_id", null);
    }

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    // Mailbox filter - "all" shows everything, otherwise filter by mailbox
    if (mailbox && mailbox !== "all") {
      query = query.eq("mailbox", mailbox);
    }

    if (direction) {
      query = query.eq("direction", direction);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (starredOnly) {
      query = query.eq("is_starred", true);
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,from_address.ilike.%${search}%,body_preview.ilike.%${search}%`);
    }

    const startTime = Date.now();
    const { data: messages, count, error } = await query;
    const durationMs = Date.now() - startTime;

    if (error) {
      console.error("List inbox error:", error);
      return NextResponse.json({ error: "Failed to list messages" }, { status: 500 });
    }

    const messageCount = (messages || []).length;
    logPerformance("email_inbox_list_duration", durationMs, "ms", {
      success: "true",
      mailbox: mailbox || "INBOX",
      direction: direction || "any",
      status: status || "any",
      has_search: search ? "true" : "false",
      unread_only: unreadOnly ? "true" : "false",
      starred_only: starredOnly ? "true" : "false",
    });
    logPerformance("email_inbox_list_count", messageCount, "count", {
      status: status || "any",
      mailbox: mailbox || "INBOX",
    });

    return NextResponse.json({
      messages: (messages || []).map((msg) => ({
        ...msg,
        account: Array.isArray(msg.account) ? msg.account[0] : msg.account,
      })),
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("List inbox error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
