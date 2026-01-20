/**
 * GET /api/ai/drift/probes/packs - List available probe packs
 * POST /api/ai/drift/probes/packs - Install a probe pack
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantForUser } from "@/lib/tenant";
import {
  listProbePacks,
  getInstalledProbePacks,
  installProbePack,
} from "@/lib/observability/drift";

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
    const category = searchParams.get("category") || undefined;
    const installed = searchParams.get("installed") === "true";

    if (installed) {
      // Return installed packs with their configurations
      const installedPacks = await getInstalledProbePacks(supabase, tenantId);
      return NextResponse.json({ packs: installedPacks, installed: true });
    }

    // Return available packs
    const packs = await listProbePacks(supabase, {
      tenantId,
      category,
    });

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("Error fetching probe packs:", error);
    return NextResponse.json(
      { error: "Failed to fetch probe packs" },
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
    if (!body.pack_id) {
      return NextResponse.json(
        { error: "Missing required field: pack_id" },
        { status: 400 }
      );
    }

    const install = await installProbePack(supabase, tenantId, body.pack_id, {
      frequencyOverride: body.frequency,
      thresholdOverride: body.threshold,
      enabledProbes: body.enabled_probes,
      applicationId: body.application_id,
      modelId: body.model_id,
      installedBy: user.id,
    });

    if (!install) {
      return NextResponse.json(
        { error: "Failed to install probe pack" },
        { status: 500 }
      );
    }

    return NextResponse.json({ install }, { status: 201 });
  } catch (error) {
    console.error("Error installing probe pack:", error);
    return NextResponse.json(
      { error: "Failed to install probe pack" },
      { status: 500 }
    );
  }
}
