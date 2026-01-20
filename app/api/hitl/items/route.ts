import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/hitl/items
   List HITL items for reviewers
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get tenant and role
    const supabaseAdmin = await createSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get("queue_id");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToMe = searchParams.get("assigned_to_me") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 4. Build query
    let query = supabaseAdmin
      .from("hitl_items")
      .select(`
        *,
        queue:hitl_queues(id, name),
        policy:hitl_policies(id, name),
        assigned_user:profiles!hitl_items_assigned_to_fkey(id, name, avatar_url)
      `)
      .eq("tenant_id", profile.tenant_id)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (queueId) {
      query = query.eq("queue_id", queueId);
    }
    if (status) {
      query = query.eq("status", status);
    } else {
      // Default to pending/assigned/in_review
      query = query.in("status", ["pending", "assigned", "in_review"]);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (assignedToMe) {
      query = query.eq("assigned_to", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    // 5. Get queue stats
    const { data: queueStats } = await supabaseAdmin
      .from("hitl_items")
      .select("queue_id, status")
      .eq("tenant_id", profile.tenant_id)
      .in("status", ["pending", "assigned", "in_review"]);

    const stats = {
      total_pending: queueStats?.filter((i) => i.status === "pending").length || 0,
      total_in_progress:
        queueStats?.filter((i) => ["assigned", "in_review"].includes(i.status))
          .length || 0,
      my_assigned:
        queueStats?.filter(
          (i) => i.status === "assigned" && (data?.some((d) => d.assigned_to === user.id) ?? false)
        ).length || 0,
    };

    return NextResponse.json({
      items: data || [],
      stats,
      pagination: { limit, offset, total: data?.length || 0 },
    });
  } catch (error) {
    console.error("HITL items GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
