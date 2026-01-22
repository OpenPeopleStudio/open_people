/**
 * Tenant Billing Management API
 *
 * Allows super admins to manage individual tenant billing and subscriptions.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleGetTenantBilling = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN,
})(async (auth, request: NextRequest) => {
  void auth;
  const supabase = await createSupabaseServer();
  const tenantId = request.nextUrl.pathname.split('/').pop();

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  // Get tenant with billing information
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      status,
      tenant_billing (*)
    `)
    .eq('id', tenantId)
    .single();

  if (error || !tenant) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    tenant: {
      ...tenant,
      billing: tenant.tenant_billing?.[0] || null,
    },
  });
});

const handleUpdateTenantBilling = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN,
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const tenantId = request.nextUrl.pathname.split('/').pop();

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { plan, status, billingEmail } = body;

  // Update tenant billing record
  const { error } = await supabase
    .from('tenant_billing')
    .upsert({
      tenant_id: tenantId,
      plan: plan || 'starter',
      status: status || 'active',
      billing_email: billingEmail,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'tenant_id',
    });

  if (error) {
    console.error('Failed to update tenant billing:', error);
    return NextResponse.json(
      { error: 'Failed to update billing' },
      { status: 500 }
    );
  }

  // Log the change
  await supabase
    .from('vault_audit_log')
    .insert({
      vault_id: tenantId, // Using tenant_id as vault_id for cross-tenant logging
      action: 'billing_updated',
      resource_type: 'tenant',
      resource_id: tenantId,
      performed_by: auth.user.id,
      success: true,
      metadata: {
        plan,
        status,
        billing_email: billingEmail,
      },
    });

  return NextResponse.json({
    message: 'Billing updated successfully',
    plan,
    status,
  });
});

export const GET = handleGetTenantBilling;
export const PATCH = handleUpdateTenantBilling;
