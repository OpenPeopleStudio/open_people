/**
 * GET /api/ai/quality/slices
 * 
 * List quality slices with low-quality clusters
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantForUser } from "@/lib/tenant";
import { getQualitySlices } from "@/lib/observability/quality";

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
    const windowStart = searchParams.get("window_start");
    const windowEnd = searchParams.get("window_end");
    const minLowQualityRate = searchParams.get("min_low_quality_rate");
    const minSampleCount = searchParams.get("min_sample_count");
    const limit = searchParams.get("limit");

    const params: {
      tenantId: string;
      windowStart?: Date;
      windowEnd?: Date;
      minLowQualityRate?: number;
      minSampleCount?: number;
      limit?: number;
    } = { tenantId };

    if (windowStart) params.windowStart = new Date(windowStart);
    if (windowEnd) params.windowEnd = new Date(windowEnd);
    if (minLowQualityRate) params.minLowQualityRate = parseFloat(minLowQualityRate);
    if (minSampleCount) params.minSampleCount = parseInt(minSampleCount, 10);
    if (limit) params.limit = parseInt(limit, 10);

    const slices = await getQualitySlices(supabase, params);

    return NextResponse.json({ slices });
  } catch (error) {
    console.error("Error fetching quality slices:", error);
    return NextResponse.json(
      { error: "Failed to fetch quality slices" },
      { status: 500 }
    );
  }
}
