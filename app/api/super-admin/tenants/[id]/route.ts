import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Tenant CRUD API
   DELETE /api/super-admin/tenants/[id]
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: Request, context: any) {
  try {
    const { id } = context.params;
    const supabase = await createSupabaseServer();

    // Get all users for this tenant
    const { data: profiles } = await supabase
      .from("709_profiles")
      .select("id")
      .eq("tenant_id", id);

    // Delete auth users
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        await supabase.auth.admin.deleteUser(profile.id);
      }
    }

    // Delete tenant (cascades to billing, domains, usage, profiles via FK)
    const { error } = await supabase.from("tenants").delete().eq("id", id);

    if (error) {
      console.error("Delete tenant error:", error);
      return NextResponse.json(
        { error: "Failed to delete tenant" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tenant error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
