/**
 * GET /api/ai/quality/gates - List regression gates
 * POST /api/ai/quality/gates - Create a new regression gate
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getTenantForUser } from "@/lib/tenant";
import { loadRegressionGates } from "@/lib/observability/quality";

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
    const scopeType = searchParams.get("scope_type") || undefined;
    const scopeId = searchParams.get("scope_id") || undefined;

    const gates = await loadRegressionGates(supabase, tenantId, scopeType, scopeId);

    return NextResponse.json({ gates });
  } catch (error) {
    console.error("Error fetching regression gates:", error);
    return NextResponse.json(
      { error: "Failed to fetch regression gates" },
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
    if (!body.name || !body.scope_type || !body.requirements) {
      return NextResponse.json(
        { error: "Missing required fields: name, scope_type, requirements" },
        { status: 400 }
      );
    }

    // Create the gate
    const { data: gate, error } = await supabase
      .from("regression_gates")
      .insert({
        tenant_id: tenantId,
        name: body.name,
        description: body.description,
        scope_type: body.scope_type,
        scope_id: body.scope_id,
        requirements: body.requirements,
        on_failure: body.on_failure || "block",
        notify_users: body.notify_users || [],
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating regression gate:", error);
      return NextResponse.json(
        { error: "Failed to create regression gate" },
        { status: 500 }
      );
    }

    return NextResponse.json({ gate }, { status: 201 });
  } catch (error) {
    console.error("Error creating regression gate:", error);
    return NextResponse.json(
      { error: "Failed to create regression gate" },
      { status: 500 }
    );
  }
}
