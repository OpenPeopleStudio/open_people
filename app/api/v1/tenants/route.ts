import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";

function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!isSuperAdmin(auth.user.profile.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, status, settings, tier, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list tenants", error);
    return NextResponse.json({ error: "Failed to list tenants" }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!isSuperAdmin(auth.user.profile.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("tenants")
    .insert({
      name: body.name,
      slug: body.slug,
      tier: body.tier ?? null,
      settings: body.settings ?? {},
      status: body.status ?? "active",
    })
    .select("id, name, slug, status, tier, settings, created_at, updated_at")
    .single();

  if (error) {
    console.error("Failed to create tenant", error);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
