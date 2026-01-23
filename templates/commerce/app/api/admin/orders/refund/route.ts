import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { stripe } from '@/lib/stripe'
import { isAdmin } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { sendOrderRefunded } from '@/lib/email'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!, tenant?.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { orderId }: { orderId: string } = await req.json()

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
  }

  try {
    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status, stripe_payment_intent, total_cents')
      .eq('id', orderId)
      .eq('tenant_id', tenant?.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Can only refund paid orders
    if (order.status !== 'paid') {
      return NextResponse.json({
        error: 'Can only refund paid orders',
        currentStatus: order.status
      }, { status: 400 })
    }

    // Process Stripe refund
    if (order.stripe_payment_intent) {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
        amount: order.total_cents
      })
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('tenant_id', tenant?.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Trigger refund confirmation email to customer
    await sendOrderRefunded(orderId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Refund order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string, tenantId?: string): Promise<string | undefined> {
  let query = supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()

  return profile?.role
}