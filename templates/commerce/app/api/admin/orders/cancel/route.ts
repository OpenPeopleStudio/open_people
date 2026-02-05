import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isAdmin } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { sendOrderCancelled } from '@/lib/email'
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

  const body = await req.json()
  
  // Support both single orderId and bulk orderIds array
  const orderIds: string[] = body.orderIds || (body.orderId ? [body.orderId] : [])

  if (orderIds.length === 0) {
    return NextResponse.json({ error: 'Order ID(s) required' }, { status: 400 })
  }

  const results: { orderId: string; success: boolean; error?: string }[] = []

  for (const orderId of orderIds) {
    try {
      // Get current order status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .eq('tenant_id', tenant?.id)
        .single()

      if (orderError || !order) {
        results.push({ orderId, success: false, error: 'Order not found' })
        continue
      }

      // Can only cancel pending or paid orders (before fulfillment)
      if (!['pending', 'paid'].includes(order.status)) {
        results.push({ orderId, success: false, error: `Cannot cancel order in ${order.status} status` })
        continue
      }

      // Get order items to release inventory reservations
      if (order.status === 'pending') {
        const { data: items } = await supabase
          .from('order_items')
          .select('variant_id, qty')
          .eq('order_id', orderId)
          .eq('tenant_id', tenant?.id)

        if (items) {
          for (const item of items) {
            await supabase.rpc('release_reserved_inventory', {
              variant_id: item.variant_id,
              qty: item.qty
            })
          }
        }
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('tenant_id', tenant?.id)

      if (updateError) {
        results.push({ orderId, success: false, error: 'Failed to update order' })
        continue
      }

      // Trigger cancellation email to customer
      try {
        await sendOrderCancelled(orderId)
      } catch {
        // Don't fail the whole operation if email fails
        console.error('Failed to send cancellation email for order:', orderId)
      }

      results.push({ orderId, success: true })

    } catch (error) {
      console.error('Cancel order error:', error)
      results.push({ orderId, success: false, error: 'Internal error' })
    }
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return NextResponse.json({
    success: failCount === 0,
    results,
    summary: { processed: orderIds.length, succeeded: successCount, failed: failCount }
  })
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