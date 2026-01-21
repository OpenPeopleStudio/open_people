import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { AiCompanyGroup, AiCompanyGroupMember } from "@/types/ai-companies";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const groupId = request.nextUrl.pathname.split("/").pop();

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_company_groups")
    .select(
      `
        *,
        members:ai_company_group_members(
          company_id,
          role,
          company:ai_companies(id, name, tags, contact_email)
        )
      `,
    )
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    console.error("[super-admin/email/groups/:id] fetch error:", error);
    return NextResponse.json({ error: "Failed to load group" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    group: {
      ...(data as AiCompanyGroup),
      members: (Array.isArray((data as any).members) ? (data as any).members : []) as AiCompanyGroupMember[],
    },
  });
});

export const PUT = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const groupId = request.nextUrl.pathname.split("/").pop();

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  const updates = await request.json();
  const { companyIds } = updates;

  const { data: group, error } = await supabase
    .from("ai_company_groups")
    .update({
      ...updates,
      companyIds: undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .select("*")
    .single();

  if (error) {
    console.error("[super-admin/email/groups/:id] update error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }

  if (Array.isArray(companyIds)) {
    // Replace members
    const { error: deleteErr } = await supabase
      .from("ai_company_group_members")
      .delete()
      .eq("group_id", groupId);

    if (deleteErr) {
      console.error("[super-admin/email/groups/:id] clear members error:", deleteErr);
      return NextResponse.json({ error: "Group updated but member reset failed" }, { status: 500 });
    }

    if (companyIds.length > 0) {
      const { error: memberErr } = await supabase
        .from("ai_company_group_members")
        .insert(
          companyIds.map((companyId: string) => ({
            group_id: groupId,
            company_id: companyId,
          })),
        );

      if (memberErr) {
        console.error("[super-admin/email/groups/:id] member insert error:", memberErr);
        return NextResponse.json({ error: "Group updated but member insert failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ group: group as AiCompanyGroup });
});

export const DELETE = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const groupId = request.nextUrl.pathname.split("/").pop();

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("ai_company_groups").delete().eq("id", groupId);

  if (error) {
    console.error("[super-admin/email/groups/:id] delete error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { AiCompanyGroup, AiCompanyGroupMember } from "@/types/ai-companies";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const groupId = request.nextUrl.pathname.split("/").pop();

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_company_groups")
    .select(
      `
        *,
        members:ai_company_group_members(
          company_id,
          role,
          company:ai_companies(id, name, tags, contact_email)
        )
      `,
    )
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    console.error("[super-admin/email/groups/:id] fetch error:", error);
    return NextResponse.json({ error: "Failed to load group" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    group: {
      ...(data as AiCompanyGroup),
      members: (Array.isArray((data as any).members) ? (data as any).members : []) as AiCompanyGroupMember[],
    },
  });
});

export const PUT = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const groupId = request.nextUrl.pathname.split("/").pop();

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  const updates = await request.json();
  const { companyIds } = updates;

  const { data: group, error } = await supabase
    .from("ai_company_groups")
    .update({
      ...updates,
      companyIds: undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .select("*")
    .single();

  if (error) {
    console.error("[super-admin/email/groups/:id] update error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }

  if (Array.isArray(companyIds)) {
    // Replace members
    const { error: deleteErr } = await supabase
      .from("ai_company_group_members")
      .delete()
      .eq("group_id", groupId);

    if (deleteErr) {
      console.error("[super-admin/email/groups/:id] clear members error:", deleteErr);
      return NextResponse.json({ error: "Group updated but member reset failed" }, { status: 500 });
    }

    if (companyIds.length > 0) {
      const { error: memberErr } = await supabase
        .from("ai_company_group_members")
        .insert(
          companyIds.map((companyId: string) => ({
            group_id: groupId,
            company_id: companyId,
          })),
        );

      if (memberErr) {
        console.error("[super-admin/email/groups/:id] member insert error:", memberErr);
        return NextResponse.json({ error: "Group updated but member insert failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ group: group as AiCompanyGroup });
});

export const DELETE = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const groupId = request.nextUrl.pathname.split("/").pop();

  if (!groupId) {
    return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("ai_company_groups").delete().eq("id", groupId);

  if (error) {
    console.error("[super-admin/email/groups/:id] delete error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

