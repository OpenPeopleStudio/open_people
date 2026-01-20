import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Event Dead Letter Queue API
   GET    /api/events/dlq          - List DLQ entries
   POST   /api/events/dlq          - Replay a DLQ entry
   DELETE /api/events/dlq          - Purge DLQ entries
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);

    // Get current user to verify permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for tenant context
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role, is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build query based on permissions
    let query = supabase
      .from("event_dlq")
      .select(
        `
        id,
        event_type,
        tenant_id,
        payload,
        final_error,
        total_attempts,
        can_replay,
        replayed_at,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    // Filter by tenant unless super admin
    if (!profile.is_super_admin) {
      query = query.eq("tenant_id", profile.tenant_id);
    }

    // Optional filters
    const eventType = searchParams.get("event_type");
    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    const canReplay = searchParams.get("can_replay");
    if (canReplay === "true") {
      query = query.eq("can_replay", true).is("replayed_at", null);
    }

    // Pagination
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    query = query.range(offset, offset + limit - 1);

    const { data: dlqEntries, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      entries: dlqEntries,
      pagination: {
        limit,
        offset,
        total: count,
      },
    });
  } catch (error) {
    console.error("[api/events/dlq] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch DLQ entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const supabaseAdmin = await createSupabaseAdmin();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role, is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile || (!profile.is_super_admin && !["admin", "owner"].includes(profile.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { dlq_id, dlq_ids } = body;

    // Support single or batch replay
    const idsToReplay = dlq_ids || (dlq_id ? [dlq_id] : []);

    if (idsToReplay.length === 0) {
      return NextResponse.json({ error: "No DLQ ID(s) provided" }, { status: 400 });
    }

    const results: Array<{ dlq_id: string; success: boolean; new_event_id?: string; error?: string }> = [];

    for (const id of idsToReplay) {
      try {
        // Verify access to this DLQ entry
        const { data: dlqEntry } = await supabase
          .from("event_dlq")
          .select("id, tenant_id")
          .eq("id", id)
          .single();

        if (!dlqEntry) {
          results.push({ dlq_id: id, success: false, error: "Not found" });
          continue;
        }

        // Check tenant access (unless super admin)
        if (!profile.is_super_admin && dlqEntry.tenant_id !== profile.tenant_id) {
          results.push({ dlq_id: id, success: false, error: "Forbidden" });
          continue;
        }

        // Replay using admin client (bypasses RLS)
        const { data: newEventId, error: replayError } = await supabaseAdmin.rpc("replay_dlq_event", {
          p_dlq_id: id,
        });

        if (replayError) {
          results.push({ dlq_id: id, success: false, error: replayError.message });
        } else {
          results.push({ dlq_id: id, success: true, new_event_id: newEventId });
        }
      } catch (err) {
        results.push({
          dlq_id: id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: successCount === idsToReplay.length,
      replayed: successCount,
      total: idsToReplay.length,
      results,
    });
  } catch (error) {
    console.error("[api/events/dlq] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to replay DLQ entries" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const supabaseAdmin = await createSupabaseAdmin();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role, is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile || (!profile.is_super_admin && !["admin", "owner"].includes(profile.role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dlqId = searchParams.get("id");
    const olderThanDays = parseInt(searchParams.get("older_than_days") || "0");

    if (dlqId) {
      // Delete single entry
      const { data: dlqEntry } = await supabase
        .from("event_dlq")
        .select("id, tenant_id")
        .eq("id", dlqId)
        .single();

      if (!dlqEntry) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (!profile.is_super_admin && dlqEntry.tenant_id !== profile.tenant_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await supabaseAdmin.from("event_dlq").delete().eq("id", dlqId);

      return NextResponse.json({ success: true, deleted: 1 });
    } else if (olderThanDays > 0) {
      // Purge old entries
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      let query = supabaseAdmin
        .from("event_dlq")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      // Restrict to tenant unless super admin
      if (!profile.is_super_admin) {
        query = query.eq("tenant_id", profile.tenant_id);
      }

      const result = await query;
      const count = result.count || 0;

      return NextResponse.json({ success: true, deleted: count || 0 });
    } else {
      return NextResponse.json(
        { error: "Provide either id or older_than_days parameter" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[api/events/dlq] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete DLQ entries" },
      { status: 500 }
    );
  }
}
