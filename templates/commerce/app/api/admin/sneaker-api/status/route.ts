/**
 * Sneaker API Status
 * 
 * GET /api/admin/sneaker-api/status
 * 
 * Returns the current status of the sneaker API integration.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { getProviderStatus } from '@/lib/sneakerApi'

async function checkAdminAuth(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  tenantId?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, profile }
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const auth = await checkAdminAuth(supabase, tenant?.id)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const status = getProviderStatus()

  return NextResponse.json({
    provider: status.name,
    configured: status.configured,
    cacheSize: status.cacheSize,
    features: {
      search: status.configured,
      marketData: status.name === 'kicksdb',
      manualImport: true // Always available
    },
    documentation: status.configured 
      ? null 
      : 'Set KICKSDB_API_KEY in environment to enable sneaker API search'
  })
}
