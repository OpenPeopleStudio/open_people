/**
 * GET /api/ai/drift/baselines/auto - List auto-baseline configs
 * POST /api/ai/drift/baselines/auto - Create auto-baseline config or trigger collection
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantForUser } from "@/lib/tenant";
import {
  createAutoBaselineConfig,
  triggerAutoBaseline,
} from "@/lib/observability/drift";

export async function GET(request: NextRequest) {
  void request;
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

    // List all configs for tenant
    const { data: configs, error } = await supabase
      .from("auto_baseline_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching auto-baseline configs:", error);
      return NextResponse.json(
        { error: "Failed to fetch configs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ configs: configs || [] });
  } catch (error) {
    console.error("Error fetching auto-baseline configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch auto-baseline configs" },
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

    // Check if this is a trigger request or config creation
    if (body.action === "trigger") {
      // Trigger auto-baseline collection
      if (!body.trigger_type) {
        return NextResponse.json(
          { error: "Missing trigger_type for trigger action" },
          { status: 400 }
        );
      }

      const job = await triggerAutoBaseline(tenantId, {
        type: body.trigger_type,
        promptId: body.prompt_id,
        promptVersion: body.prompt_version,
        modelName: body.model_name,
        applicationId: body.application_id,
        triggeredBy: user.id,
      });

      if (!job) {
        return NextResponse.json(
          { message: "No matching auto-baseline config found", triggered: false },
          { status: 200 }
        );
      }

      return NextResponse.json({ job, triggered: true }, { status: 201 });
    }

    // Create new auto-baseline config
    if (!body.scope_type || !body.trigger_on) {
      return NextResponse.json(
        { error: "Missing required fields: scope_type, trigger_on" },
        { status: 400 }
      );
    }

    const config = await createAutoBaselineConfig(supabase, {
      tenant_id: tenantId,
      scope_type: body.scope_type,
      scope_id: body.scope_id,
      collection_duration_hours: body.collection_duration_hours || 24,
      min_samples: body.min_samples || 100,
      max_samples: body.max_samples || 1000,
      baseline_types: body.baseline_types || ["output", "quality", "behavior"],
      trigger_on: body.trigger_on,
      is_active: true,
    });

    if (!config) {
      return NextResponse.json(
        { error: "Failed to create auto-baseline config" },
        { status: 500 }
      );
    }

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error("Error in auto-baseline endpoint:", error);
    return NextResponse.json(
      { error: "Failed to process auto-baseline request" },
      { status: 500 }
    );
  }
}
