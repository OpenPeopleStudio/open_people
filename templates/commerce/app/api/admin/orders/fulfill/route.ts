import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isAdmin } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
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

      // Can only fulfill paid orders
      if (order.status !== 'paid') {
        results.push({ orderId, success: false, error: `Cannot fulfill order in ${order.status} status` })
        continue
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('tenant_id', tenant?.id)

      if (updateError) {
        results.push({ orderId, success: false, error: 'Failed to update order' })
        continue
      }

      // TODO: Trigger fulfillment email to customer
      results.push({ orderId, success: true })

    } catch (error) {
      console.error('Fulfill order error:', error)
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
    .from('709_profiles')
    .select('role')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()

  return profile?.role
}