import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logPerformance } from "@/lib/observability/logger";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Message API
   GET    /api/email/messages/[id] - Get message detail
   PUT    /api/email/messages/[id] - Update message (mark read, star, etc.)
   DELETE /api/email/messages/[id] - Delete message
   ═══════════════════════════════════════════════════════════════════════════ */

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  void request;
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServer();
    const startTime = Date.now();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const { data: message, error } = await supabase
      .from("email_messages")
      .select("*, account:email_accounts(id, name, email_address), attachments:email_attachments(*)")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error || !message) {
      logPerformance("email_message_detail_fetch_duration", Date.now() - startTime, "ms", {
        success: "false",
        status: "not_found",
      });
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Mark as read automatically when viewing
    if (!message.is_read) {
      await supabase
        .from("email_messages")
        .update({ is_read: true })
        .eq("id", id);
    }

    const attachmentCount = Array.isArray(message.attachments) ? message.attachments.length : 0;
    logPerformance("email_message_detail_fetch_duration", Date.now() - startTime, "ms", {
      success: "true",
      has_attachments: attachmentCount > 0 ? "true" : "false",
      attachments_count: attachmentCount.toString(),
      status: message.status || "unknown",
    });
    logPerformance("email_message_detail_attachments_count", attachmentCount, "count", {
      status: message.status || "unknown",
    });

    return NextResponse.json({
      message: {
        ...message,
        account: Array.isArray(message.account) ? message.account[0] : message.account,
        is_read: true, // We just marked it
      },
    });
  } catch (error) {
    console.error("Get message error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      "is_read",
      "is_starred",
      "is_archived",
      "is_deleted",
      "is_spam",
      "mailbox",
      "labels",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("email_messages")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update message error:", error);
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Update message error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Soft delete by default
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      const { error } = await supabase
        .from("email_messages")
        .delete()
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id);

      if (error) {
        console.error("Delete message error:", error);
        return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("email_messages")
        .update({ is_deleted: true, mailbox: "Trash" })
        .eq("id", id)
        .eq("tenant_id", profile.tenant_id);

      if (error) {
        console.error("Delete message error:", error);
        return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
