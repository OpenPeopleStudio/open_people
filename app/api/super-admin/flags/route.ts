import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Feature Flags API
   CRUD operations for feature flags across all tenants
   ═══════════════════════════════════════════════════════════════════════════ */

// GET - List all flags (or for a specific tenant)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id");

    // Verify super admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("feature_flags")
      .select("*, tenant:tenants(id, name)")
      .order("created_at", { ascending: false });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: flags, error } = await query;

    if (error) {
      console.error("Failed to fetch flags:", error);
      return NextResponse.json({ error: "Failed to fetch flags" }, { status: 500 });
    }

    return NextResponse.json({ flags });
  } catch (error) {
    console.error("Flags fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new flag for a tenant
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verify super admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { tenant_id, name, key, description, enabled = false, rollout_percentage = 100 } = body;

    if (!tenant_id || !name || !key) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the flag
    const { data: flag, error } = await supabase
      .from("feature_flags")
      .insert({
        tenant_id,
        name,
        key,
        description,
        enabled,
        rollout_percentage,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create flag:", error);
      return NextResponse.json({ error: "Failed to create flag" }, { status: 500 });
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Flag create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a flag (toggle enabled, update rollout, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Verify super admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, tenant_id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing flag ID" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
    if (updates.rollout_percentage !== undefined) updateData.rollout_percentage = updates.rollout_percentage;

    const { data: flag, error } = await supabase
      .from("feature_flags")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update flag:", error);
      return NextResponse.json({ error: "Failed to update flag" }, { status: 500 });
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Flag update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a flag
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Verify super admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing flag ID" }, { status: 400 });
    }

    const { error } = await supabase.from("feature_flags").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete flag:", error);
      return NextResponse.json({ error: "Failed to delete flag" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Flag delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
