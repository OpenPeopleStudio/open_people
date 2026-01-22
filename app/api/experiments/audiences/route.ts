import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Audiences CRUD API
   GET /api/experiments/audiences - List audiences
   POST /api/experiments/audiences - Create audience
   PUT /api/experiments/audiences - Update audience
   DELETE /api/experiments/audiences - Delete audience
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
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const { data: audiences, error } = await supabase
      .from("audiences")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List audiences error:", error);
      return NextResponse.json(
        { error: "Failed to list audiences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ audiences: audiences || [] });
  } catch (error) {
    console.error("List audiences error:", error);
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
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, rules } = body;

    if (!name || !rules) {
      return NextResponse.json(
        { error: "Name and rules are required" },
        { status: 400 }
      );
    }

    const { data: audience, error } = await supabase
      .from("audiences")
      .insert({
        tenant_id: profile.tenant_id,
        name,
        description: description || null,
        rules: rules || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Create audience error:", error);
      return NextResponse.json(
        { error: "Failed to create audience" },
        { status: 500 }
      );
    }

    return NextResponse.json({ audience });
  } catch (error) {
    console.error("Create audience error:", error);
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
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, rules } = body;

    if (!id) {
      return NextResponse.json({ error: "Audience ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (rules !== undefined) updateData.rules = rules;

    const { data: audience, error } = await supabase
      .from("audiences")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Update audience error:", error);
      return NextResponse.json(
        { error: "Failed to update audience" },
        { status: 500 }
      );
    }

    if (!audience) {
      return NextResponse.json({ error: "Audience not found" }, { status: 404 });
    }

    return NextResponse.json({ audience });
  } catch (error) {
    console.error("Update audience error:", error);
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
      .from("709_profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Audience ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("audiences")
      .delete()
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);

    if (error) {
      console.error("Delete audience error:", error);
      return NextResponse.json(
        { error: "Failed to delete audience" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete audience error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
