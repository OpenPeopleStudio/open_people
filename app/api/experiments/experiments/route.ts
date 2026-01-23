import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { EXPERIMENT_PLANS, canCreateExperiment } from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Experiments CRUD API
   GET /api/experiments/experiments - List experiments
   POST /api/experiments/experiments - Create experiment
   PUT /api/experiments/experiments - Update experiment
   DELETE /api/experiments/experiments - Delete experiment
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("experiments")
      .select("*, experiment_variants(*), audiences(name)")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: experiments, error } = await query;

    if (error) {
      console.error("List experiments error:", error);
      return NextResponse.json(
        { error: "Failed to list experiments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      experiments: (experiments || []).map((exp) => ({
        ...exp,
        audience: exp.audiences,
        variants: exp.experiment_variants,
      })),
    });
  } catch (error) {
    console.error("List experiments error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check limits
    const { data: subscription } = await supabase
      .from("experiment_subscriptions")
      .select("tier")
      .eq("tenant_id", profile.tenant_id)
      .single();

    const tier = subscription?.tier || "free";
    const plan = EXPERIMENT_PLANS[tier as keyof typeof EXPERIMENT_PLANS];

    const { count: experimentCount } = await supabase
      .from("experiments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id)
      .eq("status", "running");

    const limitCheck = canCreateExperiment(experimentCount || 0, plan);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      key,
      description,
      type,
      rolloutPercentage,
      audienceId,
      variants,
    } = body;

    if (!name || !key || !type) {
      return NextResponse.json(
        { error: "Name, key, and type are required" },
        { status: 400 }
      );
    }

    // Validate key format
    const validKey = /^[a-z0-9_-]+$/;
    if (!validKey.test(key)) {
      return NextResponse.json(
        { error: "Key must be lowercase alphanumeric with underscores/hyphens" },
        { status: 400 }
      );
    }

    // Create experiment
    const { data: experiment, error: expError } = await supabase
      .from("experiments")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        key,
        description: description || null,
        type,
        status: "draft",
        rollout_percentage: rolloutPercentage || 100,
        audience_id: audienceId || null,
      })
      .select()
      .single();

    if (expError) {
      if (expError.code === "23505") {
        return NextResponse.json(
          { error: "An experiment with this key already exists" },
          { status: 409 }
        );
      }
      console.error("Create experiment error:", expError);
      return NextResponse.json(
        { error: "Failed to create experiment" },
        { status: 500 }
      );
    }

    // Create variants
    if (variants && variants.length > 0) {
      const { error: variantsError } = await supabase
        .from("experiment_variants")
        .insert(
          variants.map((v: { name: string; key: string; weight: number; isControl: boolean }) => ({
            experiment_id: experiment.id,
            name: v.name,
            key: v.key,
            weight: v.weight,
            is_control: v.isControl || false,
          }))
        );

      if (variantsError) {
        console.error("Create variants error:", variantsError);
        // Don't fail the whole request, variants can be added later
      }
    }

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error("Create experiment error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
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
    const { id, name, description, status, rolloutPercentage, audienceId } = body;

    if (!id) {
      return NextResponse.json({ error: "Experiment ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (rolloutPercentage !== undefined)
      updateData.rollout_percentage = rolloutPercentage;
    if (audienceId !== undefined) updateData.audience_id = audienceId;

    const { data: experiment, error } = await supabase
      .from("experiments")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update experiment error:", error);
      return NextResponse.json(
        { error: "Failed to update experiment" },
        { status: 500 }
      );
    }

    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    return NextResponse.json({ experiment });
  } catch (error) {
    console.error("Update experiment error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Experiment ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("experiments")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete experiment error:", error);
      return NextResponse.json(
        { error: "Failed to delete experiment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete experiment error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
