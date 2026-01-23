import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Create Tenant API
   POST /api/super-admin/tenants
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      plan,
      status,
      ownerEmail,
      ownerName,
      ownerPassword,
      features,
    } = body;

    // Validate required fields
    if (!name || !slug || !ownerEmail || !ownerPassword || !ownerName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use service role for admin operations (auth admin + cross-tenant writes)
    const supabase = await createSupabaseAdmin();

    // Check if slug is already taken
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: "This URL slug is already taken" },
        { status: 400 }
      );
    }

    // Create auth user for owner
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: ownerName,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create user account" },
        { status: 400 }
      );
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name,
        slug,
        status: status || "active",
        settings: {
          features: features || {
            ai_inventory: true,
            ai_chat: false,
            ai_analytics: false,
          },
        },
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error("Tenant error:", tenantError);
      return NextResponse.json(
        { error: "Failed to create tenant" },
        { status: 500 }
      );
    }

    // Create billing record
    const { error: billingError } = await supabase.from("tenant_billing").insert({
      tenant_id: tenant.id,
      plan: plan || "starter",
      status: status === "trialing" ? "trialing" : "active",
      plan_limits: getPlanLimits(plan || "starter"),
    });

    if (billingError) {
      console.error("Billing error:", billingError);
      // Continue anyway, billing can be fixed later
    }

    // Create profile for owner
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: ownerEmail,
      full_name: ownerName,
      role: "owner",
      tenant_id: tenant.id,
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Rollback
      await supabase.from("tenants").delete().eq("id", tenant.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      user: {
        id: authData.user.id,
        email: ownerEmail,
      },
    });
  } catch (error) {
    console.error("Create tenant error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function getPlanLimits(plan: string) {
  switch (plan) {
    case "free":
      return {
        ai_calls_per_month: 100,
        storage_gb: 1,
        team_members: 1,
      };
    case "starter":
      return {
        ai_calls_per_month: 1000,
        storage_gb: 5,
        team_members: 3,
      };
    case "pro":
      return {
        ai_calls_per_month: 10000,
        storage_gb: 50,
        team_members: 10,
      };
    case "enterprise":
      return {
        ai_calls_per_month: 100000,
        storage_gb: 500,
        team_members: 100,
      };
    default:
      return {
        ai_calls_per_month: 1000,
        storage_gb: 5,
        team_members: 3,
      };
  }
}
