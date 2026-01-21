import { NextRequest, NextResponse } from "next/server";
import { buildKpis, supplierSample } from "@/lib/supplier/insights";

/**
 * Supplier Insights - Metrics & Trends
 *
 * GET /api/supplier-insights
 *
 * Query params:
 * - from: ISO date (optional, default: now - 30d)
 * - to: ISO date (optional, default: now)
 * - sku: filter to a single SKU
 *
 * Returns KPIs including sales velocity, days-of-cover, mix, and inventory status.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const sku = searchParams.get("sku") || undefined;

    const kpis = buildKpis({ from, to, sku });

    return NextResponse.json({
      summary: {
        timeRange: kpis.timeRange,
        totalRevenue: kpis.totalRevenue,
        totalUnits: kpis.totalUnits,
      },
      topMovers: kpis.topMovers,
      laggards: kpis.laggards,
      mix: kpis.mix,
      inventory: kpis.inventory,
      sampleData: {
        // Exposed for easy prototyping; remove when wired to real data.
        sales: supplierSample.sales.length,
        inventory: supplierSample.inventory.length,
      },
    });
  } catch (error) {
    console.error("supplier-insights GET error:", error);
    return NextResponse.json(
      { error: "Failed to build supplier insights" },
      { status: 500 }
    );
  }
}
