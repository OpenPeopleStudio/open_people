import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Get low stock items (3 or fewer)
    let lowStockQuery = supabase
      .from('product_variants')
      .select('id, sku, brand, model, stock')
      .lte('stock', 3)
      .order('stock', { ascending: true })

    if (tenant?.id) {
      lowStockQuery = lowStockQuery.eq('tenant_id', tenant.id)
    }

    const { data: lowStock } = await lowStockQuery

    // Get stuck reservations (older than 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    let reservationsQuery = supabase
      .from('inventory_reservations')
      .select(`
        id,
        variant_id,
        quantity,
        created_at,
        product_variants(sku)
      `)
      .lt('created_at', thirtyMinutesAgo)
      .eq('status', 'pending')

    if (tenant?.id) {
      reservationsQuery = reservationsQuery.eq('tenant_id', tenant.id)
    }

    const { data: reservations } = await reservationsQuery

    const stuckReservations = reservations?.map(r => {
      const variant = Array.isArray(r.product_variants) ? r.product_variants[0] : r.product_variants
      return {
        id: r.id,
        variant_id: r.variant_id,
        sku: (variant as { sku?: string })?.sku || 'Unknown',
        quantity: r.quantity,
        created_at: r.created_at
      }
    }) || []

    return NextResponse.json({
      lowStock: lowStock || [],
      stuckReservations
    })

  } catch (error) {
    console.error('Alerts fetch error:', error)
    return NextResponse.json({
      lowStock: [],
      stuckReservations: []
    })
  }
}
