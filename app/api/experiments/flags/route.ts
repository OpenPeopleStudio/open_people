import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { EXPERIMENT_PLANS, canCreateFlag } from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Feature Flags CRUD API
   GET /api/experiments/flags - List flags
   POST /api/experiments/flags - Create flag
   PUT /api/experiments/flags - Update flag
   DELETE /api/experiments/flags - Delete flag
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  void request;
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

    const { data: flags, error } = await supabase
      .from("feature_flags")
      .select("*, audiences(name)")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List flags error:", error);
      return NextResponse.json({ error: "Failed to list flags" }, { status: 500 });
    }

    return NextResponse.json({
      flags: (flags || []).map((flag) => ({
        ...flag,
        audience: flag.audiences,
      })),
    });
  } catch (error) {
    console.error("List flags error:", error);
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

    const { count: flagCount } = await supabase
      .from("feature_flags")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    const limitCheck = canCreateFlag(flagCount || 0, plan);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.reason }, { status: 403 });
    }

    const body = await request.json();
    const { name, key, description, enabled, rolloutPercentage, audienceId } = body;

    if (!name || !key) {
      return NextResponse.json({ error: "Name and key are required" }, { status: 400 });
    }

    // Validate key format
    const validKey = /^[a-z0-9_-]+$/;
    if (!validKey.test(key)) {
      return NextResponse.json(
        { error: "Key must be lowercase alphanumeric with underscores/hyphens" },
        { status: 400 }
      );
    }

    const { data: flag, error } = await supabase
      .from("feature_flags")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        key,
        description: description || null,
        enabled: enabled || false,
        rollout_percentage: rolloutPercentage || 100,
        audience_id: audienceId || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A flag with this key already exists" },
          { status: 409 }
        );
      }
      console.error("Create flag error:", error);
      return NextResponse.json({ error: "Failed to create flag" }, { status: 500 });
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Create flag error:", error);
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
    const { id, name, description, enabled, rolloutPercentage, audienceId } = body;

    if (!id) {
      return NextResponse.json({ error: "Flag ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (rolloutPercentage !== undefined)
      updateData.rollout_percentage = rolloutPercentage;
    if (audienceId !== undefined) updateData.audience_id = audienceId;

    const { data: flag, error } = await supabase
      .from("feature_flags")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update flag error:", error);
      return NextResponse.json({ error: "Failed to update flag" }, { status: 500 });
    }

    if (!flag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error("Update flag error:", error);
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
      return NextResponse.json({ error: "Flag ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("feature_flags")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete flag error:", error);
      return NextResponse.json({ error: "Failed to delete flag" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete flag error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
