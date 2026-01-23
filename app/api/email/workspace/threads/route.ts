import { createClient } from "@/lib/supabase/server";
import { emailWorkspace } from "@/lib/email/workspace";
import { NextRequest, NextResponse } from "next/server";
import { logPerformance } from "@/lib/observability/logger";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Threads API
   GET /api/email/workspace/threads - Get inbox threads
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;
    const filterOptions = [
      "urgent",
      "inbox",
      "spam",
      "assigned",
      "waiting",
      "delegated",
    ] as const;
    type ThreadFilter = typeof filterOptions[number];
    const filterParam = searchParams.get("filter");
    const filter = filterParam && filterOptions.includes(filterParam as ThreadFilter)
      ? (filterParam as ThreadFilter)
      : undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startTime = Date.now();

    const threadOptions: {
      filter?: "urgent" | "inbox" | "spam" | "assigned" | "waiting" | "delegated";
      search?: string;
      limit?: number;
      offset?: number;
    } = { limit, offset };
    if (filter) {
      threadOptions.filter = filter;
    }
    if (search) {
      threadOptions.search = search;
    }

    const result = await emailWorkspace.getInboxThreads(profile.tenant_id, accountId, threadOptions);
    const durationMs = Date.now() - startTime;
    const threadCount = Array.isArray((result as { threads?: unknown[] }).threads)
      ? (result as { threads?: unknown[] }).threads!.length
      : 0;

    logPerformance("email_threads_fetch_duration", durationMs, "ms", {
      success: "true",
      filter: filter ?? "all",
      has_search: search ? "true" : "false",
      limit: limit.toString(),
    });
    logPerformance("email_threads_fetch_count", threadCount, "count", {
      filter: filter ?? "all",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get threads error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
