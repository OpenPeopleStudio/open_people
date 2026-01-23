import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Experiments API
   CRUD operations for experiments across all tenants
   ═══════════════════════════════════════════════════════════════════════════ */

// GET - List all experiments (or for a specific tenant)
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
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("experiments")
      .select("*, experiment_variants(*), tenant:tenants(id, name)")
      .order("created_at", { ascending: false });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: experiments, error } = await query;

    if (error) {
      console.error("Failed to fetch experiments:", error);
      return NextResponse.json({ error: "Failed to fetch experiments" }, { status: 500 });
    }

    return NextResponse.json({ experiments });
  } catch (error) {
    console.error("Experiments fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new experiment for a tenant
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
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { tenant_id, name, key, description, type = "ab_test", rollout_percentage = 100 } = body;

    if (!tenant_id || !name || !key) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the experiment
    const { data: experiment, error } = await supabase
      .from("experiments")
      .insert({
        tenant_id,
        name,
        key,
        description,
        type,
        status: "draft",
        rollout_percentage,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create experiment:", error);
      return NextResponse.json({ error: "Failed to create experiment" }, { status: 500 });
    }

    // Create default variants (control + variant A)
    const { error: variantsError } = await supabase.from("experiment_variants").insert([
      {
        experiment_id: experiment.id,
        name: "Control",
        key: "control",
        weight: 50,
        is_control: true,
      },
      {
        experiment_id: experiment.id,
        name: "Variant A",
        key: "variant_a",
        weight: 50,
        is_control: false,
      },
    ]);

    if (variantsError) {
      console.error("Failed to create variants:", variantsError);
    }

    // Fetch the complete experiment with variants
    const { data: completeExperiment } = await supabase
      .from("experiments")
      .select("*, experiment_variants(*)")
      .eq("id", experiment.id)
      .single();

    return NextResponse.json({ experiment: completeExperiment || experiment });
  } catch (error) {
    console.error("Experiment create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update an experiment
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
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, tenant_id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing experiment ID" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.rollout_percentage !== undefined) updateData.rollout_percentage = updates.rollout_percentage;

    const { data: experiment, error } = await supabase
      .from("experiments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update experiment:", error);
      return NextResponse.json({ error: "Failed to update experiment" }, { status: 500 });
    }

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error("Experiment update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete an experiment
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
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing experiment ID" }, { status: 400 });
    }

    // Delete variants first (foreign key constraint)
    await supabase.from("experiment_variants").delete().eq("experiment_id", id);

    // Delete the experiment
    const { error } = await supabase.from("experiments").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete experiment:", error);
      return NextResponse.json({ error: "Failed to delete experiment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Experiment delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
