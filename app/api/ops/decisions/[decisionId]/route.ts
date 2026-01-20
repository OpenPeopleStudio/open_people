import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/ops/decisions/[decisionId]
   Fetch a single decision with its ops run and proposal
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest, { params }: { params: Promise<{ decisionId: string }> }) {
  try {
    const supabase = await createSupabaseServer();
    const { decisionId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: decision, error } = await supabase
      .from("decisions")
      .select(
        `
        *,
        ops_run:ops_runs(*)
      `
      )
      .eq("id", decisionId)
      .eq("owner_id", user.id)
      .single();

    if (error || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 });
    }

    return NextResponse.json({ decision });
  } catch (error) {
    console.error("Decision fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/ops/decisions/[decisionId]
   Archive or delete a decision
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ decisionId: string }> }) {
  try {
    const supabase = await createSupabaseServer();
    const { decisionId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // Hard delete
      const { error } = await supabase.from("decisions").delete().eq("id", decisionId).eq("owner_id", user.id);

      if (error) {
        console.error("Failed to delete decision:", error);
        return NextResponse.json({ error: "Failed to delete decision" }, { status: 500 });
      }
    } else {
      // Soft delete (archive)
      const { error } = await supabase
        .from("decisions")
        .update({ status: "archived" })
        .eq("id", decisionId)
        .eq("owner_id", user.id);

      if (error) {
        console.error("Failed to archive decision:", error);
        return NextResponse.json({ error: "Failed to archive decision" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Decision delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
