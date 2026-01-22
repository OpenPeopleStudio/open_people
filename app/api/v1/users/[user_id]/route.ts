import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";
import { errors } from "@/lib/http/responses";
import { parseJsonBody } from "@/lib/http/validation";
import { userUpdateSchema } from "@/lib/schemas/v1-users";

function canManage(role?: string | null) {
  return role === UserRole.SUPER_ADMIN || role === UserRole.OWNER || role === UserRole.ADMIN;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return errors.unauthorized("Authentication required");
  }
  if (!canManage(auth.user.profile.role)) {
    return errors.forbidden("Insufficient role");
  }

  const bodyResult = await parseJsonBody(request, userUpdateSchema);
  if ("error" in bodyResult) {
    return bodyResult.error;
  }
  const body = bodyResult.data;

  const update: Record<string, unknown> = {};
  if (body.role) update.role = body.role;
  if (body.status) update.status = body.status;

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("709_profiles")
    .update(update)
    .eq("id", user_id)
    .select("id, email, full_name, role, tenant_id, created_at")
    .maybeSingle();

  if (error) {
    console.error("Failed to update user", error);
    return errors.serverError("Failed to update user");
  }

  if (!data) {
    return errors.notFound("User not found");
  }

  return NextResponse.json(data);
}
