import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getRecentActivities, getActivitySummary } from "@/lib/mlf/activity";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/mlf/activity
   Get activity ledger entries
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id");
    const resourceType = searchParams.get("resource_type");
    const resourceId = searchParams.get("resource_id");
    const actionCategory = searchParams.get("category");
    const summary = searchParams.get("summary") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    if (summary) {
      const summaryData = await getActivitySummary(
        supabase,
        tenantId || undefined,
        7
      );
      return NextResponse.json(summaryData);
    }
    
    const activityFilters: {
      tenantId?: string;
      resourceType?: string;
      resourceId?: string;
      actionCategory?: string;
      limit?: number;
      offset?: number;
    } = { limit, offset };
    if (tenantId) activityFilters.tenantId = tenantId;
    if (resourceType) activityFilters.resourceType = resourceType;
    if (resourceId) activityFilters.resourceId = resourceId;
    if (actionCategory) activityFilters.actionCategory = actionCategory;

    const activities = await getRecentActivities(supabase, activityFilters);
    
    return NextResponse.json({ activities });
    
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
