import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const ALLOWED_MATCH_KINDS = new Set(["exact", "contains", "prefix", "suffix", "like"]);

async function getTenantContext() {
  const supabase = await createSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { supabase, user: null, tenantId: null, error: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.tenant_id) {
    return { supabase, user, tenantId: null, error: "No tenant found" };
  }

  return { supabase, user, tenantId: profile.tenant_id, error: null };
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/company/lexicon/[entryId]
   Update a lexicon entry
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: { entryId: string } }
) {
  const { supabase, error } = await getTenantContext();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const entryId = params.entryId;
  if (!entryId) {
    return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.pattern === "string") {
    const pattern = body.pattern.trim();
    if (!pattern || pattern.length > 500) {
      return NextResponse.json({ error: "Invalid pattern" }, { status: 400 });
    }
    updates.pattern = pattern;
  }

  if (typeof body.match_kind === "string") {
    if (!ALLOWED_MATCH_KINDS.has(body.match_kind)) {
      return NextResponse.json({ error: "Invalid match_kind" }, { status: 400 });
    }
    updates.match_kind = body.match_kind;
  }

  if (typeof body.meaning === "string") {
    updates.meaning = body.meaning.trim();
  }

  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  if (typeof body.is_case_sensitive === "boolean") {
    updates.is_case_sensitive = body.is_case_sensitive;
  }

  if (Number.isFinite(body.priority)) {
    updates.priority = Math.trunc(body.priority);
  }

  if (body.trigger_payload && typeof body.trigger_payload === "object") {
    updates.trigger_payload = body.trigger_payload;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error: updateError } = await supabase
    .from("company_lexicon_entries")
    .update(updates)
    .eq("id", entryId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Failed to update lexicon entry" }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/company/lexicon/[entryId]
   Delete a lexicon entry
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { entryId: string } }
) {
  const { supabase, error } = await getTenantContext();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const entryId = params.entryId;
  if (!entryId) {
    return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("company_lexicon_entries")
    .delete()
    .eq("id", entryId);

  if (deleteError) {
    return NextResponse.json({ error: "Failed to delete lexicon entry" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
