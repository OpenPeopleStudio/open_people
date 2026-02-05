import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin, createSupabaseServer } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";
import { errors } from "@/lib/http/responses";
import { parseJsonBody } from "@/lib/http/validation";
import { userInviteSchema } from "@/lib/schemas/v1-users";

function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}

function canInvite(role?: string | null) {
  return role === UserRole.SUPER_ADMIN || role === UserRole.OWNER || role === UserRole.ADMIN;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return errors.unauthorized("Authentication required");
  }

  const supabase = await createSupabaseServer();

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, tenant_id, created_at");

  if (!isSuperAdmin(auth.user.profile.role)) {
    if (!auth.user.profile.tenant_id) {
      return errors.badRequest("Tenant context required");
    }
    query = query.eq("tenant_id", auth.user.profile.tenant_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to list users", error);
    return errors.serverError("Failed to list users");
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return errors.unauthorized("Authentication required");
  }
  if (!canInvite(auth.user.profile.role)) {
    return errors.forbidden("Insufficient role");
  }

  const bodyResult = await parseJsonBody(request, userInviteSchema);
  if ("error" in bodyResult) {
    return bodyResult.error;
  }
  const body = bodyResult.data;

  const tenantId = body.tenant_id || auth.user.profile.tenant_id;
  if (!tenantId) {
    return errors.badRequest("tenant_id is required");
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
    return errors.serverError("Failed to invite user");
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
