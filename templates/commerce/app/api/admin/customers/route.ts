import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { stripe } from '@/lib/stripe'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if user is admin
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
    const eligibleOrderStatuses = ['pending', 'paid', 'fulfilled', 'shipped']
    // Fetch customers from Stripe
    const customers = await stripe.customers.list({
      limit: 100,
      expand: ['data.subscriptions']
    })

    // Get order stats from Supabase for each customer
    const customerData = await Promise.all(
      customers.data.map(async (customer) => {
        // Try to find orders by customer email
        let ordersQuery = supabase
          .from('orders')
          .select('id, total_cents, status, created_at')
          .eq('customer_id', customer.metadata?.supabase_user_id || '')
          .order('created_at', { ascending: false })

        if (tenant?.id) {
          ordersQuery = ordersQuery.eq('tenant_id', tenant.id)
        }

        const { data: orders } = await ordersQuery

        const totalSpent = orders?.reduce((sum, order) => {
          if (order.status !== 'cancelled' && order.status !== 'refunded') {
            return sum + (order.total_cents || 0)
          }
          return sum
        }, 0) || 0

        const eligibleOrders = (orders || []).filter((order) =>
          eligibleOrderStatuses.includes(order.status)
        )

        return {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          created: customer.created,
          metadata: customer.metadata,
          orderCount: orders?.length || 0,
          eligibleOrderCount: eligibleOrders.length,
          hasPurchase: eligibleOrders.length > 0,
          totalSpent,
          lastOrder: orders?.[0]?.created_at || null
        }
      })
    )

    return NextResponse.json({ 
      customers: customerData,
      hasMore: customers.has_more 
    })
  } catch (error) {
    console.error('Stripe customers fetch error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch customers' 
    }, { status: 500 })
  }
}
