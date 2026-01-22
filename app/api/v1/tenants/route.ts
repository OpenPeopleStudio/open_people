import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/authorization";
import { errors } from "@/lib/http/responses";
import { parseJsonBody } from "@/lib/http/validation";
import { tenantCreateSchema } from "@/lib/schemas/v1-tenants";

function isSuperAdmin(role?: string | null) {
  return role === UserRole.SUPER_ADMIN;
}

export async function GET(request: NextRequest) {
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
    .select("id, name, slug, status, settings, tier, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list tenants", error);
    return errors.serverError("Failed to list tenants");
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateUser(request);
  if (!auth?.user?.profile) {
    return errors.unauthorized("Authentication required");
  }
  if (!isSuperAdmin(auth.user.profile.role)) {
    return errors.forbidden("Insufficient role");
  }

  const bodyResult = await parseJsonBody(request, tenantCreateSchema);
  if ("error" in bodyResult) {
    return bodyResult.error;
  }
  const body = bodyResult.data;

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
    return errors.serverError("Failed to create tenant");
  }

  return NextResponse.json(data, { status: 201 });
}
