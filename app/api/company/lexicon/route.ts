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
   GET /api/company/lexicon
   List lexicon entries for the current tenant
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  const { supabase, tenantId, error } = await getTenantContext();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("active") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10), 500);

  let query = supabase
    .from("company_lexicon_entries")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error: fetchError } = await query;
  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch lexicon entries" }, { status: 500 });
  }

  return NextResponse.json({ entries: data || [] });
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/company/lexicon
   Create a lexicon entry for the current tenant
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  const { supabase, user, tenantId, error } = await getTenantContext();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const body = await request.json();
  const pattern = typeof body.pattern === "string" ? body.pattern.trim() : "";
  const matchKind = typeof body.match_kind === "string" ? body.match_kind : "contains";
  const meaning = typeof body.meaning === "string" ? body.meaning.trim() : null;
  const triggerType = typeof body.trigger_type === "string" ? body.trigger_type : "vibe";
  const triggerPayload = body.trigger_payload && typeof body.trigger_payload === "object"
    ? body.trigger_payload
    : {};
  const isActive = body.is_active !== false;
  const isCaseSensitive = body.is_case_sensitive === true;
  const priority = Number.isFinite(body.priority) ? Math.trunc(body.priority) : 0;

  if (!pattern || pattern.length > 500) {
    return NextResponse.json({ error: "Invalid pattern" }, { status: 400 });
  }

  if (!ALLOWED_MATCH_KINDS.has(matchKind)) {
    return NextResponse.json({ error: "Invalid match_kind" }, { status: 400 });
  }

  if (triggerType !== "vibe") {
    return NextResponse.json({ error: "Unsupported trigger_type" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("company_lexicon_entries")
    .insert({
      tenant_id: tenantId,
      pattern,
      match_kind: matchKind,
      meaning,
      trigger_type: triggerType,
      trigger_payload: triggerPayload,
      is_active: isActive,
      is_case_sensitive: isCaseSensitive,
      priority,
      created_by: user?.id || null,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create lexicon entry" }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}
