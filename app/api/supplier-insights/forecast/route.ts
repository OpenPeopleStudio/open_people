import { NextRequest, NextResponse } from "next/server";
import { buildForecast } from "@/lib/supplier/insights";
import type { ForecastRequest } from "@/types/supplier";

/**
 * Supplier Insights - Forecast & Reorder Suggestions
 *
 * POST /api/supplier-insights/forecast
 *
 * Body (application/json):
 * {
 *   "sku": "WINE-CHARD-001", // optional
 *   "daysForward": 14,       // optional, default 14
 *   "targetServiceDays": 21  // optional, default 21
 * }
 *
 * Returns reorder guidance per SKU using velocity + lead time + safety stock.
 */

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ForecastRequest;
    const forecast = buildForecast(body);

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("supplier-insights forecast error:", error);
    return NextResponse.json(
      { error: "Failed to build forecast recommendations" },
      { status: 500 }
    );
  }
}
