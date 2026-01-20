/**
 * GET /api/ai/costs/outcomes
 * 
 * Get cost-per-outcome analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantForUser } from "@/lib/tenant";
import { getCostOutcomeSummary } from "@/lib/observability/cost";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await getTenantForUser(user.id);
    if (!tenant) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 });
    }
    const tenantId = tenant.id;

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get("days");
    const groupBy = searchParams.get("group_by") as "application" | "model" | "prompt" | undefined;

    const summary = await getCostOutcomeSummary(
      supabase,
      tenantId,
      days ? parseInt(days, 10) : undefined,
      groupBy
    );

    // Format response with human-readable values
    return NextResponse.json({
      summary: {
        total_cost_usd: (summary.totalCostCents / 100).toFixed(2),
        total_requests: summary.totalRequests,
        avg_cost_per_request_usd: (summary.avgCostPerRequest / 100).toFixed(4),
        avg_cost_per_success_usd: (summary.avgCostPerSuccess / 100).toFixed(4),
        avg_cost_per_high_quality_usd: (summary.avgCostPerHighQuality / 100).toFixed(4),
        success_rate: (summary.successRate * 100).toFixed(1) + "%",
      },
      by_dimension: summary.byDimension
        ? Object.fromEntries(
            Object.entries(summary.byDimension).map(([key, val]) => [
              key,
              {
                total_cost_usd: (val.costCents / 100).toFixed(2),
                total_requests: val.requests,
                cost_per_success_usd: (val.costPerSuccess / 100).toFixed(4),
              },
            ])
          )
        : undefined,
    });
  } catch (error) {
    console.error("Error fetching cost outcomes:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost outcomes" },
      { status: 500 }
    );
  }
}
