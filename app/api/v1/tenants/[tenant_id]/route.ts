import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";
import { errors } from "@/lib/http/responses";
import { parseJsonBody } from "@/lib/http/validation";
import { tenantUpdateSchema } from "@/lib/schemas/v1-tenants";

function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  const { tenant_id } = await params;
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return errors.unauthorized("Authentication required");
  }
  if (!isSuperAdmin(auth.user.profile.role)) {
    return errors.forbidden("Insufficient role");
  }

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, status, tier, settings, created_at, updated_at")
    .eq("id", tenant_id)
    .single();

  if (error || !data) {
    return errors.notFound("Tenant not found");
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> }
) {
  const { tenant_id } = await params;
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return errors.unauthorized("Authentication required");
  }
  if (!isSuperAdmin(auth.user.profile.role)) {
    return errors.forbidden("Insufficient role");
  }

  const bodyResult = await parseJsonBody(request, tenantUpdateSchema);
  if ("error" in bodyResult) {
    return bodyResult.error;
  }
  const body = bodyResult.data;

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("tenants")
    .update({
      name: body.name,
      status: body.status,
      tier: body.tier,
      settings: body.settings,
    })
    .eq("id", tenant_id)
    .select("id, name, slug, status, tier, settings, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("Failed to update tenant", error);
    return errors.serverError("Failed to update tenant");
  }

  return NextResponse.json(data);
}
