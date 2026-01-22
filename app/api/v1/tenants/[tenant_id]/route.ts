import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";

function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}

export async function GET(request: Request, context: any) {
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
    .select("id, name, slug, status, tier, settings, created_at, updated_at")
    .eq("id", params.tenant_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request, context: any) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!isSuperAdmin(auth.user.profile.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("tenants")
    .update({
      name: body.name,
      status: body.status,
      tier: body.tier,
      settings: body.settings,
    })
    .eq("id", params.tenant_id)
    .select("id, name, slug, status, tier, settings, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("Failed to update tenant", error);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }

  return NextResponse.json(data);
}
