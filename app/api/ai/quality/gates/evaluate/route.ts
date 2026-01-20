/**
 * POST /api/ai/quality/gates/evaluate
 * 
 * Evaluate regression gates for a deployment
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantForUser } from "@/lib/tenant";
import { checkDeploymentGates } from "@/lib/observability/quality";

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
    if (!body.type || !["prompt_deploy", "model_change"].includes(body.type)) {
      return NextResponse.json(
        { error: "Missing or invalid type: must be 'prompt_deploy' or 'model_change'" },
        { status: 400 }
      );
    }

    const result = await checkDeploymentGates(tenantId, {
      type: body.type,
      promptId: body.prompt_id,
      promptVersion: body.prompt_version,
      modelName: body.model_name,
      applicationId: body.application_id,
      deployedBy: user.id,
    });

    return NextResponse.json({
      can_proceed: result.canProceed,
      blocking_gates: result.blockingGates,
      warning_gates: result.warningGates,
      passed_gates: result.passedGates,
    });
  } catch (error) {
    console.error("Error evaluating regression gates:", error);
    return NextResponse.json(
      { error: "Failed to evaluate regression gates" },
      { status: 500 }
    );
  }
}
