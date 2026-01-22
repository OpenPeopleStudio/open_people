import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";

function canManage(role?: string | null) {
  return role === UserRole.SUPER_ADMIN || role === UserRole.OWNER || role === UserRole.ADMIN;
}

export async function PATCH(request: Request, context: any) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!canManage(auth.user.profile.role)) {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || (!body.role && !body.status)) {
    return NextResponse.json({ error: "role or status required" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.role) update.role = body.role;
  if (body.status) update.status = body.status;

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("709_profiles")
    .update(update)
    .eq("id", params.user_id)
    .select("id, email, full_name, role, tenant_id, created_at")
    .maybeSingle();

  if (error) {
    console.error("Failed to update user", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
