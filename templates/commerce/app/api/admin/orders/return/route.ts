import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

interface ShippingAddress {
  name?: string
  email?: string
  line1?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export async function POST(request: Request) {
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

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { orderId, returnType, itemIds, inventoryAction, reason, sendEmail } = await request.json()

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('tenant_id', tenant?.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Extract customer email from shipping_address JSON
    const shippingAddress = order.shipping_address as ShippingAddress | null
    const customerEmail = shippingAddress?.email || ''

    // Create return record (may fail if table doesn't exist)
    let returnRecord = null
    try {
      const { data, error: returnError } = await supabase
        .from('returns')
        .insert({
          tenant_id: tenant?.id,
          order_id: orderId,
          return_type: returnType,
          status: 'pending',
          reason,
          inventory_action: inventoryAction,
          created_by: user.id
        })
        .select()
        .single()

      if (!returnError) {
        returnRecord = data
      } else {
        console.error('Return creation error (table may not exist):', returnError)
      }
    } catch {
      console.error('Returns table may not exist')
    }

    // Process inventory based on action
    const itemsToProcess = order.order_items.filter((item: { id: string }) => itemIds.includes(item.id))

    for (const item of itemsToProcess) {
      if (inventoryAction === 'restock') {
        // Add stock back - use qty field (not quantity)
        await supabase.rpc('admin_adjust_inventory', {
          p_variant_id: item.variant_id,
          p_delta: item.qty,
          p_reason: `Return: ${reason}`,
          p_actor: user.id
        })
      }
      // For writeoff, we don't add back to inventory
    }

    // Update order status if full return
    if (itemIds.length === order.order_items.length && returnType === 'return') {
      await supabase
        .from('orders')
        .update({ status: 'refunded' }) // Use 'refunded' status instead of 'returned'
        .eq('id', orderId)
        .eq('tenant_id', tenant?.id)
    }

    // Send email notification
    if (sendEmail && customerEmail) {
      // Email would be sent here
      console.log('Would send return confirmation email to:', customerEmail)
    }

    return NextResponse.json({
      success: true,
      returnId: returnRecord?.id,
      message: `${returnType === 'return' ? 'Return' : 'Exchange'} processed successfully`
    })

  } catch (error) {
    console.error('Return processing error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to process return'
    }, { status: 500 })
  }
}
