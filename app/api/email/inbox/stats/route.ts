import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Inbox Stats API
   GET /api/email/inbox/stats - Get inbox statistics
   
   Supports:
   - Tenant users: stats for their tenant's messages
   - Super admins: stats for all or specific tenant
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
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenant_id");
    const accountId = searchParams.get("accountId");

    // Determine tenant
    let tenantId: string | null = profile?.tenant_id || null;
    if (isSuperAdmin && requestedTenantId) {
      tenantId = requestedTenantId;
    }

    // Non-super-admins must have a tenant
    if (!isSuperAdmin && !tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const queryClient = isSuperAdmin ? adminSupabase : supabase;

    if (accountId) {
      // Get stats for specific account
      const { data: stats, error } = await queryClient
        .rpc("get_email_inbox_stats", { p_account_id: accountId });

      if (error) {
        console.error("Get inbox stats error:", error);
        return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
      }

      return NextResponse.json({ stats: stats?.[0] || getEmptyStats() });
    } else {
      // Get aggregate stats across all accounts
      let messagesQuery = queryClient
        .from("email_messages")
        .select("is_read, is_starred, is_archived, is_spam, is_deleted, direction, status");

      if (tenantId) {
        messagesQuery = messagesQuery.eq("tenant_id", tenantId);
      } else if (isSuperAdmin) {
        // Super admin viewing platform-level messages
        messagesQuery = messagesQuery.is("tenant_id", null);
      }

      const { data: messages } = await messagesQuery;

      const stats = {
        total_messages: 0,
        unread_messages: 0,
        starred_messages: 0,
        draft_messages: 0,
        sent_messages: 0,
        spam_messages: 0,
        archived_messages: 0,
      };

      for (const msg of messages || []) {
        if (!msg.is_deleted) {
          stats.total_messages++;
          if (!msg.is_read && msg.direction === "inbound") stats.unread_messages++;
          if (msg.is_starred) stats.starred_messages++;
          if (msg.is_archived) stats.archived_messages++;
          if (msg.is_spam) stats.spam_messages++;
        }
        if (msg.status === "draft") stats.draft_messages++;
        if (msg.direction === "outbound" && ["sent", "delivered"].includes(msg.status)) {
          stats.sent_messages++;
        }
      }

      return NextResponse.json({ stats });
    }
  } catch (error) {
    console.error("Get inbox stats error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

function getEmptyStats() {
  return {
    total_messages: 0,
    unread_messages: 0,
    starred_messages: 0,
    draft_messages: 0,
    sent_messages: 0,
    spam_messages: 0,
    archived_messages: 0,
  };
}
