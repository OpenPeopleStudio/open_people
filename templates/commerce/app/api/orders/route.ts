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

  try {
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        status,
        total_cents,
        created_at,
        paid_at,
        fulfilled_at,
        shipped_at,
        cancelled_at,
        tracking_number,
        carrier
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (tenant?.id) {
      ordersQuery = ordersQuery.eq('tenant_id', tenant.id)
    }

    const { data: orders, error } = await ordersQuery

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}