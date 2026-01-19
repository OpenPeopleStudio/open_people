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
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        status,
        total_cents,
        subtotal_cents,
        shipping_cents,
        tax_cents,
        shipping_address,
        tracking_number,
        carrier,
        created_at,
        paid_at,
        shipped_at,
        fulfilled_at,
        delivered_at,
        cancelled_at,
        order_items(
          id,
          qty,
          price_cents,
          variant:product_variants(
            id,
            sku,
            size,
            condition,
            product:products(
              brand,
              model
            )
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Transform orders to flatten shipping_address fields for the UI
    const transformedOrders = orders?.map(order => {
      const shippingAddress = order.shipping_address as {
        name?: string
        email?: string
        line1?: string
        line2?: string
        city?: string
        state?: string
        postal_code?: string
        country?: string
      } | null

      // Transform order_items to have consistent structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = order.order_items?.map((item: any) => {
        const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
        const product = variant?.product
        // Handle both array and single object responses from Supabase
        const productData = Array.isArray(product) ? product[0] : product
        
        return {
          id: item.id,
          quantity: item.qty || 0,
          price_cents: item.price_cents || 0,
          variant: variant ? {
            id: variant.id,
            sku: variant.sku || '',
            size: variant.size || '',
            condition: variant.condition || '',
            brand: productData?.brand || 'Unknown',
            model: productData?.model || 'Unknown'
          } : null
        }
      }) || []

      return {
        id: order.id,
        status: order.status,
        total_cents: order.total_cents,
        subtotal_cents: order.subtotal_cents,
        shipping_cents: order.shipping_cents,
        tax_cents: order.tax_cents,
        customer_email: shippingAddress?.email || '',
        shipping_name: shippingAddress?.name || '',
        shipping_address: shippingAddress?.line1 || '',
        shipping_city: shippingAddress?.city || '',
        shipping_state: shippingAddress?.state || '',
        shipping_zip: shippingAddress?.postal_code || '',
        shipping_country: shippingAddress?.country || 'CA',
        tracking_number: order.tracking_number,
        carrier: order.carrier,
        created_at: order.created_at,
        paid_at: order.paid_at,
        shipped_at: order.shipped_at,
        fulfilled_at: order.fulfilled_at,
        delivered_at: order.delivered_at,
        cancelled_at: order.cancelled_at,
        items
      }
    }) || []

    return NextResponse.json({ orders: transformedOrders })

  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
