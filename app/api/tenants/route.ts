import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenants API
   GET /api/tenants - List tenants (super-admin only)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error in /api/tenants:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS for all queries
    const adminSupabase = await createSupabaseAdmin();

    // Check if user is super-admin
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error in /api/tenants:", profileError);
      return NextResponse.json({ error: "Failed to verify permissions" }, { status: 500 });
    }

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    let query = adminSupabase
      .from("tenants")
      .select("id, name, slug, created_at")
      .order("name", { ascending: true })
      .limit(limit);

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: tenants, error } = await query;

    if (error) {
      console.error("List tenants error:", error);
      return NextResponse.json({ error: "Failed to list tenants" }, { status: 500 });
    }

    return NextResponse.json({ tenants: tenants || [] });
  } catch (error) {
    console.error("List tenants error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
