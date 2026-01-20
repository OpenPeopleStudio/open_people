import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { OpsIngestRequest, OpsIngestResponse, Decision } from "@/lib/ai/prompts/opsWorker";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/ops/ingest
   List decisions (with optional filters)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sourceType = searchParams.get("source_type");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("decisions")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    if (sourceType) {
      query = query.eq("source->type", sourceType);
    }

    const { data: decisions, error } = await query;

    if (error) {
      console.error("Failed to fetch decisions:", error);
      return NextResponse.json({ error: "Failed to fetch decisions" }, { status: 500 });
    }

    return NextResponse.json({ decisions: decisions || [] });
  } catch (error) {
    console.error("Decisions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/ops/ingest
   Store a new decision for processing
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: OpsIngestRequest = await request.json();

    // Validate required fields
    if (!body.raw_text?.trim()) {
      return NextResponse.json({ error: "raw_text is required" }, { status: 400 });
    }

    if (!body.source?.type) {
      return NextResponse.json({ error: "source.type is required" }, { status: 400 });
    }

    // Get user's tenant (optional)
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    // Create decision
    const { data: decision, error } = await supabase
      .from("decisions")
      .insert({
        owner_id: user.id,
        tenant_id: profile?.tenant_id || null,
        raw_text: body.raw_text.trim(),
        source: body.source,
        context_assembly_id: body.context_assembly_id || null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create decision:", error);
      return NextResponse.json({ error: "Failed to create decision" }, { status: 500 });
    }

    const response: OpsIngestResponse = {
      decision: decision as Decision,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Decision ingest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
