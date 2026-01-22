import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { AiCompany, AiCompanyGroupMember } from "@/types/ai-companies";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const companyId = request.nextUrl.pathname.split("/").pop();

  if (!companyId) {
    return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_companies")
    .select(
      `
        *,
        groups:ai_company_group_members(
          group_id,
          role,
          group:ai_company_groups(id, name, tags, strategy)
        )
      `,
    )
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("[super-admin/email/companies/:id] fetch error:", error);
    return NextResponse.json({ error: "Failed to load company" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    company: {
      ...(data as AiCompany),
      groups: (Array.isArray((data as any).groups) ? (data as any).groups : []) as AiCompanyGroupMember[],
    },
  });
});

export const PUT = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const companyId = request.nextUrl.pathname.split("/").pop();

  if (!companyId) {
    return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
  }

  const updates = await request.json();

  const { data, error } = await supabase
    .from("ai_companies")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)
    .select("*")
    .single();

  if (error) {
    console.error("[super-admin/email/companies/:id] update error:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }

  return NextResponse.json({ company: data as AiCompany });
});

export const DELETE = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const companyId = request.nextUrl.pathname.split("/").pop();

  if (!companyId) {
    return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("ai_companies").delete().eq("id", companyId);

  if (error) {
    console.error("[super-admin/email/companies/:id] delete error:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
