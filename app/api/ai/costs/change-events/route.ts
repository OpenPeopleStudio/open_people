/**
 * GET /api/ai/costs/change-events - List recent change events
 * POST /api/ai/costs/change-events - Record a change event
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantForUser } from "@/lib/tenant";
import { recordChangeEvent, getRecentChangeEvents } from "@/lib/observability/cost";

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
    const hours = searchParams.get("hours");

    const events = await getRecentChangeEvents(
      supabase,
      tenantId,
      hours ? parseInt(hours, 10) : undefined
    );

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching change events:", error);
    return NextResponse.json(
      { error: "Failed to fetch change events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.change_type || !body.change_description) {
      return NextResponse.json(
        { error: "Missing required fields: change_type, change_description" },
        { status: 400 }
      );
    }

    const validTypes = [
      "prompt_deploy",
      "model_change",
      "routing_change",
      "cache_config",
      "feature_rollout",
    ];

    if (!validTypes.includes(body.change_type)) {
      return NextResponse.json(
        { error: `Invalid change_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const event = await recordChangeEvent(supabase, {
      tenant_id: tenantId,
      change_type: body.change_type,
      change_description: body.change_description,
      prompt_id: body.prompt_id,
      prompt_version: body.prompt_version,
      model_from: body.model_from,
      model_to: body.model_to,
      change_metadata: body.metadata || {},
      changed_by: user.id,
    });

    if (!event) {
      return NextResponse.json(
        { error: "Failed to record change event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error recording change event:", error);
    return NextResponse.json(
      { error: "Failed to record change event" },
      { status: 500 }
    );
  }
}
