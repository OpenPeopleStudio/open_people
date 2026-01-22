import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { applyVibeDelta, estimateTokens, recordTokenEvent, tokensToBaseDelta } from "@/lib/company/vibes";

const MAX_MATCHES = 5;
const MAX_TEXT_LENGTH = 5000;

type LexiconEntry = {
  id: string;
  pattern: string;
  match_kind: string;
  meaning: string | null;
  trigger_type: string;
  trigger_payload: Record<string, unknown> | null;
  is_case_sensitive: boolean;
  priority: number;
};

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

function toComparable(text: string, caseSensitive: boolean) {
  return caseSensitive ? text : text.toLowerCase();
}

function toLikeRegex(pattern: string, caseSensitive: boolean) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regexBody = `^${escaped.replace(/%/g, ".*").replace(/_/g, ".")}$`;
  return new RegExp(regexBody, caseSensitive ? "" : "i");
}

function isMatch(entry: LexiconEntry, text: string) {
  const caseSensitive = entry.is_case_sensitive;
  const pattern = entry.pattern;
  const haystack = toComparable(text, caseSensitive);
  const needle = toComparable(pattern, caseSensitive);

  switch (entry.match_kind) {
    case "exact":
      return haystack === needle;
    case "contains":
      return haystack.includes(needle);
    case "prefix":
      return haystack.startsWith(needle);
    case "suffix":
      return haystack.endsWith(needle);
    case "like":
      return toLikeRegex(pattern, caseSensitive).test(text);
    default:
      return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/company/lexicon/evaluate
   Evaluate text against lexicon entries and trigger events
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  const { supabase, user, tenantId, error } = await getTenantContext();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const body = await request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "lexicon";

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const safeText = text.slice(0, MAX_TEXT_LENGTH);
  const tokenCount = estimateTokens(safeText);

  const { data: entries, error: fetchError } = await supabase
    .from("company_lexicon_entries")
    .select("id, pattern, match_kind, meaning, trigger_type, trigger_payload, is_case_sensitive, priority")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch lexicon entries" }, { status: 500 });
  }

  const matches: LexiconEntry[] = [];
  for (const entry of (entries || []) as LexiconEntry[]) {
    if (matches.length >= MAX_MATCHES) break;
    if (entry.trigger_type !== "vibe") continue;
    if (isMatch(entry, safeText)) {
      matches.push(entry);
    }
  }

  const baseDelta = tokensToBaseDelta(tokenCount, 0);
  const tokenBalanceResult = baseDelta !== 0
    ? await applyVibeDelta(supabase, tenantId, baseDelta)
    : null;

  if (tokenCount > 0) {
    await recordTokenEvent(
      supabase,
      tenantId,
      user?.id || null,
      "in",
      tokenCount,
      baseDelta,
      `lexicon:${source}`
    );
  }

  if (tokenBalanceResult && tokenBalanceResult.delta !== 0) {
    await supabase.from("vibe_events").insert({
      tenant_id: tenantId,
      created_by: user?.id || null,
      source: `tokens:${source}`,
      value: tokenBalanceResult.delta,
    });
  }

  if (matches.length === 0) {
    return NextResponse.json({
      matches: [],
      created: 0,
      tokenCount,
      balance: tokenBalanceResult?.balance ?? null,
      crashed: tokenBalanceResult?.crashed ?? false,
    });
  }

  const inserts = matches.map((entry) => {
    const payload = entry.trigger_payload || {};
    const value = typeof payload.value === "number" ? payload.value : 1;
    return {
      tenant_id: tenantId,
      created_by: user?.id || null,
      source: `lexicon:${source}`,
      lexicon_entry_id: entry.id,
      value,
    };
  });

  const lexiconValue = inserts.reduce((sum, entry) => sum + (entry.value || 0), 0);

  const { data: createdRows, error: insertError } = await supabase
    .from("vibe_events")
    .insert(inserts)
    .select("id, lexicon_entry_id, created_at");

  if (insertError) {
    return NextResponse.json({ error: "Failed to create vibe events" }, { status: 500 });
  }

  const lexiconBalanceResult = await applyVibeDelta(supabase, tenantId, lexiconValue || 0);

  return NextResponse.json({
    matches: matches.map((entry) => ({
      id: entry.id,
      pattern: entry.pattern,
      match_kind: entry.match_kind,
      meaning: entry.meaning,
    })),
    created: createdRows?.length || 0,
    tokenCount,
    balance: lexiconBalanceResult.balance,
    crashed: lexiconBalanceResult.crashed,
  });
}
