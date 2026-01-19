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

  // Check admin role
  let profileQuery = supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
  if (tenant?.id) {
    profileQuery = profileQuery.eq('tenant_id', tenant.id)
  }
  const { data: profile } = await profileQuery.single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Fetch consignors
    let consignorsQuery = supabase
      .from('consignors')
      .select('*')
      .order('name')
    if (tenant?.id) {
      consignorsQuery = consignorsQuery.eq('tenant_id', tenant.id)
    }
    const { data: consignors } = await consignorsQuery

    // Fetch consignment items
    let itemsQuery = supabase
      .from('consignment_items')
      .select(`
        *,
        variant:product_variants(sku, brand, model, size),
        consignor:consignors(name)
      `)
      .order('created_at', { ascending: false })
    if (tenant?.id) {
      itemsQuery = itemsQuery.eq('tenant_id', tenant.id)
    }
    const { data: items } = await itemsQuery

    // Fetch payouts
    let payoutsQuery = supabase
      .from('consignment_payouts')
      .select(`
        *,
        consignor:consignors(name)
      `)
      .order('created_at', { ascending: false })
    if (tenant?.id) {
      payoutsQuery = payoutsQuery.eq('tenant_id', tenant.id)
    }
    const { data: payouts } = await payoutsQuery

    return NextResponse.json({
      consignors: consignors || [],
      items: items || [],
      payouts: payouts || []
    })

  } catch (error) {
    console.error('Consignment fetch error:', error)
    return NextResponse.json({
      consignors: [],
      items: [],
      payouts: []
    })
  }
}
