import { NextResponse } from 'next/server'
import type { TenantContextValue } from '@/types/tenant'
import type { Profile } from '@/types/database'

/**
 * Ensure tenant is resolved, otherwise return error response
 */
export function requireTenant(tenant: TenantContextValue | null): 
  { tenant: TenantContextValue } | { error: NextResponse } {
  if (!tenant) {
    return { error: NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 }) }
  }
  
  if (tenant.status !== 'active') {
    return { 
      error: NextResponse.json(
        { error: 'Tenant is not active', status: tenant.status }, 
        { status: 403 }
      ) 
    }
  }
  
  return { tenant }
}

/**
 * Check if feature is enabled for tenant
 */
export function isFeatureEnabled(
  tenant: TenantContextValue | null, 
  feature: keyof NonNullable<TenantContextValue['settings']['features']>
): boolean {
  return tenant?.settings?.features?.[feature] === true
}

/**
 * Require feature to be enabled, otherwise return error response
 */
export function requireFeature(
  tenant: TenantContextValue | null,
  feature: keyof NonNullable<TenantContextValue['settings']['features']>
): { ok: true } | { error: NextResponse } {
  if (!isFeatureEnabled(tenant, feature)) {
    return {
      error: NextResponse.json(
        { error: `Feature '${feature}' is not enabled` },
        { status: 403 }
      )
    }
  }
  return { ok: true }
}

/**
 * Standard API error responses
 */
export const ApiErrors = {
  unauthorized: () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  forbidden: (message = 'Forbidden') => NextResponse.json({ error: message }, { status: 403 }),
  notFound: (message = 'Not found') => NextResponse.json({ error: message }, { status: 404 }),
  badRequest: (message = 'Bad request') => NextResponse.json({ error: message }, { status: 400 }),
  conflict: (message = 'Conflict') => NextResponse.json({ error: message }, { status: 409 }),
  serverError: (message = 'Internal server error') => NextResponse.json({ error: message }, { status: 500 }),
  tenantNotResolved: () => NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 }),
  tenantInactive: (status: string) => NextResponse.json({ 
    error: 'Tenant is not active', 
    status 
  }, { status: 403 }),
  featureDisabled: (feature: string) => NextResponse.json({ 
    error: `Feature '${feature}' is not enabled` 
  }, { status: 403 }),
} as const
