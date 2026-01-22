import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { unifiedSearch, quickSearch, getSearchSuggestions } from "@/lib/workflows/search";
import type { SearchRequest } from "@/types/workflows";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/search
   Unified search across all entities
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: SearchRequest = await request.json();
    
    if (!body.query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    
    const { searchParams } = new URL(request.url);
    const explain = searchParams.get("explain") === "true";
    
    const searchOptions = {
      supabase,
      userId: user.id,
      query: body.query,
      limit: body.limit || 20,
      includeSemantic: body.include_semantic !== false,
      explainRelevance: explain,
      ...(body.filters ? { filters: body.filters } : {}),
    };

    const result = await unifiedSearch(searchOptions);
    
    return NextResponse.json({
      results: result.results,
      total_count: result.totalCount,
      search_time_ms: result.searchTimeMs,
    });
    
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/search
   Quick search (text only) or suggestions
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type");
    const suggestions = searchParams.get("suggestions") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");
    
    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    
    // Return suggestions
    if (suggestions) {
      const suggestionList = await getSearchSuggestions(supabase, user.id, query, limit);
      return NextResponse.json({ suggestions: suggestionList });
    }
    
    // Quick text search
    const results = await quickSearch(
      supabase,
      user.id,
      query,
      type as any,
      limit
    );
    
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error("Quick search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
