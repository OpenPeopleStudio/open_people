import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { OnboardingUpdateRequest } from "@/types/onboarding";
import { notifyOnboardingComplete } from "@/lib/notifications/events";

/* ═══════════════════════════════════════════════════════════════════════════
   Onboarding API
   GET  /api/onboarding         - Get tenant's onboarding record
   PUT  /api/onboarding         - Update/upsert onboarding record
   
   Super admins can specify ?tenant_id=xxx to manage any tenant.
   Regular users only access their own tenant's onboarding.
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile to determine tenant and role
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";
    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenant_id");

    // Determine which tenant to query
    let tenantId = profile?.tenant_id;
    if (isSuperAdmin && requestedTenantId) {
      tenantId = requestedTenantId;
    }

    // Super admin listing all if no tenant specified
    if (isSuperAdmin && !tenantId) {
      const { data: allOnboarding, error } = await supabase
        .from("tenant_onboarding")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("List onboarding error:", error);
        return NextResponse.json({ error: "Failed to list onboarding records" }, { status: 500 });
      }

      return NextResponse.json({ onboardings: allOnboarding || [] });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Get existing onboarding record for tenant
    const { data: onboarding, error } = await supabase
      .from("tenant_onboarding")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned (not an error, just no record yet)
      console.error("Get onboarding error:", error);
      return NextResponse.json({ error: "Failed to get onboarding" }, { status: 500 });
    }

    return NextResponse.json({
      onboarding: onboarding || null,
      isNew: !onboarding,
    });
  } catch (error) {
    console.error("Onboarding GET error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    const isSuperAdmin = profile?.role === "super_admin";

    const body = await request.json();
    const { tenant_id: bodyTenantId, ...updates } = body as OnboardingUpdateRequest & { tenant_id?: string };

    // Determine tenant
    let tenantId = profile?.tenant_id;
    if (isSuperAdmin && bodyTenantId) {
      tenantId = bodyTenantId;
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "No tenant found. Super admins must specify tenant_id." },
        { status: 403 }
      );
    }

    // Check if record exists
    const { data: existing } = await supabase
      .from("tenant_onboarding")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    let result;

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("tenant_onboarding")
        .update(updates)
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        console.error("Update onboarding error:", error);
        return NextResponse.json({ error: "Failed to update onboarding" }, { status: 500 });
      }
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("tenant_onboarding")
        .insert({
          tenant_id: tenantId,
          created_by: user.id,
          ...updates,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert onboarding error:", error);
        return NextResponse.json({ error: "Failed to create onboarding" }, { status: 500 });
      }
      result = data;
    }

    // Check if onboarding just completed - send notification
    if (result?.status === "completed" && (!existing || updates.status === "completed")) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", tenantId)
        .single();

      if (tenant) {
        // Fire and forget - don't block the response
        notifyOnboardingComplete(tenantId, tenant.name).catch((err) => {
          console.error("Failed to send onboarding notification:", err);
        });
      }
    }

    return NextResponse.json({ onboarding: result });
  } catch (error) {
    console.error("Onboarding PUT error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// PATCH for partial updates (same logic as PUT)
export async function PATCH(request: NextRequest) {
  return PUT(request);
}
