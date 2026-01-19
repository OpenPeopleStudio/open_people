import { headers } from 'next/headers'
import { cache } from 'react'
import { createSupabaseServer } from '@/lib/supabaseServer'
import type { TenantContextValue, TenantSettings } from '@/types/tenant'

export const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || '709exclusive'
export const SUPER_ADMIN_DOMAIN = process.env.SUPER_ADMIN_DOMAIN || 'admin.709exclusive.com'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || ''

const normalizeHost = (host: string | null) => {
  if (!host) return ''
  return host.replace(/:\d+$/, '').trim().toLowerCase()
}

const extractSlugFromHost = (host: string) => {
  if (!host) return ''
  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    return host.replace(`.${ROOT_DOMAIN}`, '')
  }
  if (host.endsWith('.localhost')) {
    return host.split('.')[0]
  }
  return ''
}

const toTenantContext = (tenant: {
  id: string
  slug: string
  name: string
  primary_domain: string | null
  settings: TenantSettings | null
  status: string
}): TenantContextValue => ({
  id: tenant.id,
  slug: tenant.slug,
  name: tenant.name,
  primary_domain: tenant.primary_domain,
  settings: (tenant.settings ?? {}) as TenantSettings,
  status: tenant.status as 'active' | 'inactive' | 'suspended',
})

async function fetchTenantById(tenantId: string) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, primary_domain, settings, status')
    .eq('id', tenantId)
    .eq('status', 'active')
    .single()
  if (error || !data) return null
  return toTenantContext(data)
}

const fetchTenantBySlug = cache(async (slug: string) => {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, name, primary_domain, settings, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (error || !data) return null
  return toTenantContext(data)
})

const fetchTenantByDomain = cache(async (domain: string, requireVerified = true) => {
  const supabase = await createSupabaseServer()
  
  let query = supabase
    .from('tenant_domains')
    .select('tenant_id, verified_at')
    .eq('domain', domain)
  
  if (requireVerified) {
    query = query.not('verified_at', 'is', null)
  }
  
  const { data, error } = await query.single()
  if (error || !data?.tenant_id) return null
  
  if (requireVerified && !data.verified_at) return null
  
  return fetchTenantById(data.tenant_id)
})

export async function resolveTenantByHost(rawHost: string) {
  const host = normalizeHost(rawHost)
  if (!host) {
    return fetchTenantBySlug(DEFAULT_TENANT_SLUG)
  }

  // Check verified custom domains first (highest priority)
  const domainMatch = await fetchTenantByDomain(host, true)
  if (domainMatch) return domainMatch

  // Check primary_domain (for backwards compatibility during migration)
  const supabase = await createSupabaseServer()
  const { data: primaryMatch } = await supabase
    .from('tenants')
    .select('id, slug, name, primary_domain, settings, status')
    .eq('primary_domain', host)
    .eq('status', 'active')
    .single()
  if (primaryMatch) return toTenantContext(primaryMatch)

  // Check subdomain routing (e.g., tenant.example.com or tenant.localhost)
  const slugCandidate = extractSlugFromHost(host)
  if (slugCandidate) {
    const slugMatch = await fetchTenantBySlug(slugCandidate)
    if (slugMatch) return slugMatch
  }

  // Fallback to default tenant
  return fetchTenantBySlug(DEFAULT_TENANT_SLUG)
}

export function isSuperAdminDomain(host: string): boolean {
  const normalized = normalizeHost(host)
  return normalized === SUPER_ADMIN_DOMAIN || normalized === 'super.localhost'
}

type HeaderSource = Pick<Headers, 'get'>

export const getTenantFromHeaders = cache(async (headerStore: HeaderSource) => {
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || ''
  return resolveTenantByHost(host)
})

export async function getTenantFromRequest(request?: Request) {
  if (request) {
    return getTenantFromHeaders(request.headers)
  }
  const headerStore = await headers()
  return getTenantFromHeaders(headerStore)
}
