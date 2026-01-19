import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isAdmin } from '../lib/roles'
import { getTenantFromRequest } from '../lib/tenant'
import { SupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!, tenant?.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Get analytics data
    let analyticsQuery = supabase
      .from('admin_variant_analytics')
      .select('*')
      .order('sell_through_rate', { ascending: false })
    if (tenant?.id) {
      analyticsQuery = analyticsQuery.eq('tenant_id', tenant.id)
    }
    const { data: analytics, error: analyticsError } = await analyticsQuery

    if (analyticsError) throw analyticsError

    // Calculate summary stats
    const totalSold = analytics.reduce((sum, a) => sum + a.sold_units, 0)
    const totalStock = analytics.reduce((sum, a) => sum + a.stock, 0)
    const slowMovers = analytics.filter(a => a.sell_through_rate < 0.1).length
    const soldVariants = analytics.filter(a => a.first_sold_at !== null).length

    return NextResponse.json({
      analytics,
      summary: {
        totalSold,
        totalStock,
        slowMovers,
        soldVariants
      }
    })
  } catch (error) {
    console.error('Admin analytics fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string, tenantId?: string): Promise<string | undefined> {
  let query = supabase
    .from('709_profiles')
    .select('role')
    .eq('id', userId)
  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }
  const { data: profile } = await query.single()

  return profile?.role
}