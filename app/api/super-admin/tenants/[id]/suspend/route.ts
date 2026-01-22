import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Suspend/Unsuspend Tenant API
   POST /api/super-admin/tenants/[id]/suspend
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: Request, context: any) {
  void request;
  try {
    const { id } = context.params;
    const supabase = await createSupabaseServer();

    // Get current tenant status
    const { data: tenant, error: fetchError } = await supabase
      .from("tenants")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Toggle status
    const newStatus = tenant.status === "suspended" ? "active" : "suspended";

    const { error } = await supabase
      .from("tenants")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Suspend tenant error:", error);
      return NextResponse.json(
        { error: "Failed to update tenant status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Suspend tenant error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
