import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";

function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}

function canInvite(role?: string | null) {
  return role === UserRole.SUPER_ADMIN || role === UserRole.OWNER || role === UserRole.ADMIN;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("709_profiles")
    .select("id, email, full_name, role, tenant_id, created_at");

  if (!isSuperAdmin(auth.user.profile.role)) {
    if (!auth.user.profile.tenant_id) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 });
    }
    query = query.eq("tenant_id", auth.user.profile.tenant_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to list users", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!canInvite(auth.user.profile.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.email || !body.role) {
    return NextResponse.json(
      { error: "email and role are required" },
      { status: 400 }
    );
  }

  const tenantId = body.tenant_id || auth.user.profile.tenant_id;
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  // Soft-invite placeholder: record in invitations table if available, otherwise return accepted.
  const supabaseAdmin = await createSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("user_invitations")
    .insert({
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      tenant_id: tenantId,
      invited_by: auth.user.id,
      status: "pending",
    })
    .select()
    .maybeSingle();

  if (error && error.code !== "42P01") {
    // 42P01 = table does not exist; fall back to accepted response
    console.error("Failed to create invitation", error);
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }

  return NextResponse.json(
    data ?? {
      email: body.email,
      role: body.role,
      tenant_id: tenantId,
      status: "pending",
    },
    { status: 202 }
  );
}
