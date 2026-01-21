import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { AiCompanyGroup, AiCompanyGroupMember } from "@/types/ai-companies";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  let query = supabase
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
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      [
        `name.ilike.%${q}%`,
        `description.ilike.%${q}%`,
        `tags.cs.{${q}}`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[super-admin/email/groups] list error:", error);
    return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
  }

  return NextResponse.json({
    groups: (data || []).map((g: any) => ({
      ...(g as AiCompanyGroup),
      members: (Array.isArray(g.members) ? g.members : []) as AiCompanyGroupMember[],
    })),
  });
});

export const POST = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const body = await request.json();

  const {
    name,
    description,
    tags = [],
    strategy,
    created_via_ai = false,
    source_prompt,
    companyIds = [],
  } = body || {};

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: group, error: groupError } = await supabase
    .from("ai_company_groups")
    .insert({
      name,
      description,
      tags,
      strategy,
      created_via_ai,
      source_prompt,
    })
    .select("*")
    .single();

  if (groupError) {
    console.error("[super-admin/email/groups] create error:", groupError);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }

  if (Array.isArray(companyIds) && companyIds.length > 0) {
    const memberRows = companyIds.map((companyId: string) => ({
      group_id: group.id,
      company_id: companyId,
    }));

    const { error: memberError } = await supabase
      .from("ai_company_group_members")
      .upsert(memberRows, { onConflict: "group_id,company_id" });

    if (memberError) {
      console.error("[super-admin/email/groups] members upsert error:", memberError);
      return NextResponse.json({ error: "Group created but member linking failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ group: group as AiCompanyGroup }, { status: 201 });
});

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { AiCompanyGroup, AiCompanyGroupMember } from "@/types/ai-companies";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  let query = supabase
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
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      [
        `name.ilike.%${q}%`,
        `description.ilike.%${q}%`,
        `tags.cs.{${q}}`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[super-admin/email/groups] list error:", error);
    return NextResponse.json({ error: "Failed to load groups" }, { status: 500 });
  }

  return NextResponse.json({
    groups: (data || []).map((g: any) => ({
      ...(g as AiCompanyGroup),
      members: (Array.isArray(g.members) ? g.members : []) as AiCompanyGroupMember[],
    })),
  });
});

export const POST = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const body = await request.json();

  const {
    name,
    description,
    tags = [],
    strategy,
    created_via_ai = false,
    source_prompt,
    companyIds = [],
  } = body || {};

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: group, error: groupError } = await supabase
    .from("ai_company_groups")
    .insert({
      name,
      description,
      tags,
      strategy,
      created_via_ai,
      source_prompt,
    })
    .select("*")
    .single();

  if (groupError) {
    console.error("[super-admin/email/groups] create error:", groupError);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }

  if (Array.isArray(companyIds) && companyIds.length > 0) {
    const memberRows = companyIds.map((companyId: string) => ({
      group_id: group.id,
      company_id: companyId,
    }));

    const { error: memberError } = await supabase
      .from("ai_company_group_members")
      .upsert(memberRows, { onConflict: "group_id,company_id" });

    if (memberError) {
      console.error("[super-admin/email/groups] members upsert error:", memberError);
      return NextResponse.json({ error: "Group created but member linking failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ group: group as AiCompanyGroup }, { status: 201 });
});

