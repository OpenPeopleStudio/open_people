import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params

  try {
    let orderQuery = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          qty,
          price_cents,
          product_variants (
            sku,
            brand,
            model,
            size,
            condition_code,
            products (
              name
            )
          )
        )
      `)
      .eq('id', resolvedParams.id)
      .eq('customer_id', user.id)

    if (tenant?.id) {
      orderQuery = orderQuery.eq('tenant_id', tenant.id)
    }

    const { data: order, error } = await orderQuery.single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order detail fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}