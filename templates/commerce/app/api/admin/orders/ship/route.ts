import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isAdmin } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { sendOrderShipped } from '@/lib/email'
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

  const { orderId, trackingNumber, carrier }: {
    orderId: string
    trackingNumber?: string
    carrier?: string
  } = await req.json()

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
  }

  try {
    // Get current order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('tenant_id', tenant?.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Can only ship fulfilled orders
    if (order.status !== 'fulfilled') {
      return NextResponse.json({
        error: 'Can only ship fulfilled orders',
        currentStatus: order.status
      }, { status: 400 })
    }

    // Update order status and shipping info
    const updateData: {
      status: string
      shipped_at: string
      tracking_number?: string
      carrier?: string
    } = {
      status: 'shipped',
      shipped_at: new Date().toISOString()
    }

    if (trackingNumber) updateData.tracking_number = trackingNumber
    if (carrier) updateData.carrier = carrier

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('tenant_id', tenant?.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Trigger shipping confirmation email to customer
    await sendOrderShipped(orderId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ship order error:', error)
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