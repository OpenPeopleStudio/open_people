import { createSupabaseServer } from '@/lib/supabaseServer'
import { getTenantFromRequest, isSuperAdminDomain } from '@/lib/tenant'
import { hasSuperAdminAccess, hasAdminAccess } from '@/lib/roles'
import type { TenantContextValue } from '@/types/tenant'
import type { Profile } from '@/types/database'

export interface TenantAuthContext {
  user: { id: string; email?: string } | null
  profile: Profile | null
  tenant: TenantContextValue | null
  isSuperAdmin: boolean
}

/**
 * Get authenticated user with tenant context
 * Returns null if user is not authenticated
 */
export async function getTenantAuth(request?: Request): Promise<TenantAuthContext | null> {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  const tenant = await getTenantFromRequest(request)
  
  if (!tenant) {
    return null
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = hasSuperAdminAccess(profile?.role)

  return {
    user,
    profile,
    tenant,
    isSuperAdmin,
  }
}

/**
 * Require authenticated user with tenant context
 * Throws if user is not authenticated
 */
export async function requireTenantAuth(request?: Request): Promise<TenantAuthContext> {
  const auth = await getTenantAuth(request)
  
  if (!auth || !auth.user || !auth.tenant) {
    throw new Error('Unauthorized')
  }

  return auth
}

/**
 * Require super admin access
 * Validates both role and domain
 */
export async function requireSuperAdmin(request?: Request): Promise<TenantAuthContext> {
  const auth = await requireTenantAuth(request)
  
  // Check if user has super_admin role
  if (!auth.isSuperAdmin) {
    throw new Error('Super admin access required')
  }

  // Optionally validate domain (can be disabled for localhost dev)
  if (request && process.env.NODE_ENV === 'production') {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    if (!isSuperAdminDomain(host)) {
      throw new Error('Super admin domain required')
    }
  }

  return auth
}

/**
 * Require tenant admin access
 * User must have admin/owner role within the current tenant
 */
export async function requireTenantAdmin(request?: Request): Promise<TenantAuthContext> {
  const auth = await requireTenantAuth(request)
  
  if (!hasAdminAccess(auth.profile?.role)) {
    throw new Error('Admin access required')
  }

  // Verify profile belongs to current tenant (unless super admin)
  if (!auth.isSuperAdmin && auth.tenant && auth.profile?.tenant_id !== auth.tenant.id) {
    throw new Error('Tenant mismatch')
  }

  return auth
}

/**
 * Get tenant context from request (without requiring auth)
 */
export async function getTenantContext(request?: Request): Promise<TenantContextValue | null> {
  return getTenantFromRequest(request)
}
