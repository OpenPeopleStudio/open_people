/**
 * Billing Tenants API
 *
 * Provides tenant billing information for the billing management interface.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleGetTenants = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN, // Only super admins can access billing
})(async (auth) => {
  const supabase = await createSupabaseServer();

  // Get all tenants with their billing information
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      status,
      tenant_billing (
        plan,
        status,
        billing_email,
        stripe_customer_id,
        stripe_subscription_id,
        trial_ends_at,
        current_period_end,
        created_at,
        updated_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }

  // Transform the data to flatten the billing relationship
  const transformedTenants = (tenants || []).map(tenant => ({
    ...tenant,
    billing: tenant.tenant_billing?.[0] || null,
    tenant_billing: undefined, // Remove the nested field
  }));

  return NextResponse.json({
    tenants: transformedTenants,
    total: transformedTenants.length,
  });
});

export const GET = handleGetTenants;