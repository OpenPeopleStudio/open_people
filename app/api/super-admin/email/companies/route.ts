import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { AiCompany } from "@/types/ai-companies";

const requireSuperAdmin = withAuthAndAuthZ({ role: UserRole.SUPER_ADMIN });

export const GET = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Number(searchParams.get("limit") || 100);

  let query = supabase
    .from("ai_companies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));

  if (q) {
    // Basic fuzzy search across name, description, tags, and email
    query = query.or(
      [
        `name.ilike.%${q}%`,
        `description.ilike.%${q}%`,
        `contact_email.ilike.%${q}%`,
        `tags.cs.{${q}}`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[super-admin/email/companies] list error:", error);
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }

  return NextResponse.json({ companies: (data || []) as AiCompany[] });
});

export const POST = requireSuperAdmin(async (_auth, request: NextRequest) => {
  const supabase = await createSupabaseAdmin();
  const body = await request.json();

  const {
    name,
    website,
    contact_email,
    contact_name,
    description,
    tags = [],
    category,
    notes,
    created_via_ai = false,
    source_prompt,
  } = body || {};

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_companies")
    .insert({
      name,
      website,
      contact_email,
      contact_name,
      description,
      tags,
      category,
      notes,
      created_via_ai,
      source_prompt,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[super-admin/email/companies] create error:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }

  return NextResponse.json({ company: data as AiCompany }, { status: 201 });
});
