import { NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/hitl/items/:itemId
   Get single HITL item with full details
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: Request, context: any) {
  try {
    const supabase = await createSupabaseServer();
    const { itemId } = context.params;

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get tenant
    const supabaseAdmin = await createSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // 3. Get item with related data
    const { data: item, error } = await supabaseAdmin
      .from("hitl_items")
      .select(`
        *,
        queue:hitl_queues(*),
        policy:hitl_policies(id, name, triggers),
        risk_evaluation:risk_evaluations(*),
        decisions:hitl_decisions(
          *,
          reviewer:profiles!hitl_decisions_reviewer_id_fkey(id, name, avatar_url)
        )
      `)
      .eq("id", itemId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (error || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 4. Get decision options for the queue
    const { data: decisionOptions } = await supabaseAdmin
      .from("hitl_decision_options")
      .select("*")
      .eq("queue_id", item.queue_id)
      .eq("is_active", true)
      .order("sort_order");

    return NextResponse.json({
      item,
      decision_options: decisionOptions || [],
    });
  } catch (error) {
    console.error("HITL item GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/hitl/items/:itemId
   Update item (claim, release, update status)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: Request, context: any) {
  try {
    const supabase = await createSupabaseServer();
    const { itemId } = context.params;

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get tenant
    const supabaseAdmin = await createSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // 3. Parse request
    const body = await request.json();
    const { action, ...updateData } = body;

    // 4. Get current item
    const { data: item, error: itemError } = await supabaseAdmin
      .from("hitl_items")
      .select("*")
      .eq("id", itemId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 5. Handle actions
    let updates: Record<string, unknown> = {};

    switch (action) {
      case "claim":
        if (item.assigned_to && item.assigned_to !== user.id) {
          return NextResponse.json(
            { error: "Item is already assigned to another reviewer" },
            { status: 409 }
          );
        }
        updates = {
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
          status: "assigned",
        };
        break;

      case "release":
        if (item.assigned_to !== user.id && profile.role !== "admin") {
          return NextResponse.json(
            { error: "You can only release items assigned to you" },
            { status: 403 }
          );
        }
        updates = {
          assigned_to: null,
          assigned_at: null,
          status: "pending",
        };
        break;

      case "start_review":
        if (item.assigned_to !== user.id) {
          return NextResponse.json(
            { error: "You must claim this item first" },
            { status: 403 }
          );
        }
        updates = {
          status: "in_review",
        };
        break;

      default:
        // Direct update (for admins)
        if (profile.role !== "admin" && profile.role !== "super_admin") {
          return NextResponse.json(
            { error: "Admin access required for direct updates" },
            { status: 403 }
          );
        }
        updates = updateData;
    }

    // 6. Apply update
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("hitl_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("HITL item PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
