import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { applyVibeDelta, ensureVibeBalance } from "@/lib/company/vibes";

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
   GET /api/company/vibes
   Summary and recent vibe events
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  const { supabase, tenantId, error } = await getTenantContext();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "8", 10), 25);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    count7Res,
    count30Res,
    lastRes,
    recentRes,
    balanceRes,
    tokenInRes,
    tokenOutRes,
    tokenInTodayRes,
    tokenOutTodayRes,
    tokenIn7Res,
    tokenOut7Res,
    tokenIn14Res,
    tokenOut14Res,
  ] =
    await Promise.all([
    supabase
      .from("vibe_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("vibe_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("vibe_events")
      .select("created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("vibe_events")
      .select("id, created_at, note, source, value")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("company_vibe_balances")
      .select("balance")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "in")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "out")
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "in")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "out")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "in")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "out")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "in")
      .gte("created_at", fourteenDaysAgo.toISOString()),
    supabase
      .from("token_events")
      .select("token_count")
      .eq("tenant_id", tenantId)
      .eq("direction", "out")
      .gte("created_at", fourteenDaysAgo.toISOString()),
  ]);

  if (
    count7Res.error ||
    count30Res.error ||
    lastRes.error ||
    recentRes.error ||
    balanceRes.error ||
    tokenInRes.error ||
    tokenOutRes.error ||
    tokenInTodayRes.error ||
    tokenOutTodayRes.error ||
    tokenIn7Res.error ||
    tokenOut7Res.error ||
    tokenIn14Res.error ||
    tokenOut14Res.error
  ) {
    return NextResponse.json({ error: "Failed to load vibe summary" }, { status: 500 });
  }

  const count7 = count7Res.count || 0;
  const count30 = count30Res.count || 0;
  const lastVibe = lastRes.data || null;
  const recent = recentRes.data || [];
  const balance = balanceRes.data?.balance !== undefined
    ? Number(balanceRes.data.balance)
    : await ensureVibeBalance(supabase, tenantId);
  const tokenInTotal = (tokenInRes.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );
  const tokenOutTotal = (tokenOutRes.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );
  const tokenInToday = (tokenInTodayRes.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );
  const tokenOutToday = (tokenOutTodayRes.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );
  const tokenIn7 = (tokenIn7Res.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );
  const tokenOut7 = (tokenOut7Res.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );
  const tokenIn14 = (tokenIn14Res.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );
  const tokenOut14 = (tokenOut14Res.data || []).reduce(
    (sum, row) => sum + (row.token_count || 0),
    0
  );

  return NextResponse.json({
    counts: {
      last7Days: count7 || 0,
      last30Days: count30 || 0,
    },
    lastVibeAt: lastVibe?.created_at || null,
    recent: recent || [],
    balance,
    tokenStats: {
      today: {
        in: tokenInToday,
        out: tokenOutToday,
      },
      last7Days: {
        in: tokenIn7,
        out: tokenOut7,
      },
      last14Days: {
        in: tokenIn14,
        out: tokenOut14,
      },
      last30Days: {
        in: tokenInTotal,
        out: tokenOutTotal,
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/company/vibes
   Create a manual vibe event
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  const { supabase, user, tenantId, error } = await getTenantContext();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const body = await request.json();
  const note = typeof body.note === "string" ? body.note.trim() : null;
  const source = typeof body.source === "string" ? body.source.trim() : "manual";
  const value = Number.isFinite(body.value) ? Math.trunc(body.value) : 1;

  if (note && note.length > 1000) {
    return NextResponse.json({ error: "Note too long" }, { status: 400 });
  }

  const { data, error: insertError } = await supabase
    .from("vibe_events")
    .insert({
      tenant_id: tenantId,
      created_by: user?.id || null,
      source,
      note: note || null,
      value,
    })
    .select("id, created_at, note, source, value")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create vibe event" }, { status: 500 });
  }

  const balanceResult = await applyVibeDelta(supabase, tenantId, value);

  return NextResponse.json({
    vibe: data,
    balance: balanceResult.balance,
    crashed: balanceResult.crashed,
  });
}
