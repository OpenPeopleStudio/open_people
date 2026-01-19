/**
 * Order Lifecycle Automation
 * 
 * Automates common order workflows:
 * - Auto-assign orders to nearest staff
 * - Auto-release stale pending orders
 * - Trigger fulfillment notifications
 * - Automated return processing
 */

import { createClient } from '@supabase/supabase-js'

const STALE_ORDER_HOURS = 24
const AUTO_ASSIGN_RADIUS_KM = 50

interface OrderAssignmentResult {
  order_id: string
  assigned_to: string | null
  distance_km?: number
  reason?: string
}

/**
 * Auto-assign order to nearest available staff member
 */
export async function autoAssignOrderToStaff(
  supabase: any,
  orderId: string,
  tenantId?: string
): Promise<OrderAssignmentResult> {
  try {
    // Get order details
    let orderQuery = supabase
      .from('orders')
      .select('id, shipping_address')
      .eq('id', orderId)
      .single()

    if (tenantId) {
      orderQuery = orderQuery.eq('tenant_id', tenantId)
    }

    const { data: order, error: orderError } = await orderQuery

    if (orderError || !order) {
      return { order_id: orderId, assigned_to: null, reason: 'Order not found' }
    }

    const shippingAddr = order.shipping_address as any
    if (!shippingAddr?.latitude || !shippingAddr?.longitude) {
      return { order_id: orderId, assigned_to: null, reason: 'No coordinates' }
    }

    // Get active staff with recent locations
    const recentTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // Last 2 hours

    let staffQuery = supabase
      .from('staff_locations')
      .select('user_id, latitude, longitude')
      .gte('recorded_at', recentTime)
      .order('recorded_at', { ascending: false })

    if (tenantId) {
      staffQuery = staffQuery.eq('tenant_id', tenantId)
    }

    const { data: locations } = await staffQuery

    if (!locations || locations.length === 0) {
      return { order_id: orderId, assigned_to: null, reason: 'No active staff' }
    }

    // Find nearest staff member
    let nearestStaff: string | null = null
    let nearestDistance = Infinity

    const orderLat = shippingAddr.latitude
    const orderLng = shippingAddr.longitude

    const staffMap = new Map<string, { lat: number; lng: number }>()
    for (const loc of locations) {
      // Keep most recent location per staff member
      if (!staffMap.has(loc.user_id)) {
        staffMap.set(loc.user_id, { lat: loc.latitude, lng: loc.longitude })
      }
    }

    for (const [staffId, loc] of staffMap.entries()) {
      const distance = calculateDistance(
        orderLat,
        orderLng,
        loc.lat,
        loc.lng
      )

      if (distance < nearestDistance && distance <= AUTO_ASSIGN_RADIUS_KM) {
        nearestDistance = distance
        nearestStaff = staffId
      }
    }

    if (nearestStaff) {
      // Update order with assigned staff (requires custom field)
      // For now, log the assignment
      return {
        order_id: orderId,
        assigned_to: nearestStaff,
        distance_km: Math.round(nearestDistance * 10) / 10,
      }
    }

    return {
      order_id: orderId,
      assigned_to: null,
      reason: `No staff within ${AUTO_ASSIGN_RADIUS_KM}km`,
    }
  } catch (error) {
    console.error('Auto-assign error:', error)
    return {
      order_id: orderId,
      assigned_to: null,
      reason: 'Assignment failed',
    }
  }
}

/**
 * Calculate distance using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Release stale pending orders
 */
export async function releaseStalePendingOrders(
  supabase: any,
  tenantId?: string
): Promise<{ released: number }> {
  try {
    const staleTime = new Date(Date.now() - STALE_ORDER_HOURS * 60 * 60 * 1000).toISOString()

    // Find stale pending orders
    let ordersQuery = supabase
      .from('orders')
      .select('id, user_id')
      .eq('status', 'pending')
      .lt('created_at', staleTime)

    if (tenantId) {
      ordersQuery = ordersQuery.eq('tenant_id', tenantId)
    }

    const { data: staleOrders } = await ordersQuery

    if (!staleOrders || staleOrders.length === 0) {
      return { released: 0 }
    }

    // Release inventory for these orders
    for (const order of staleOrders) {
      // Get order items
      let itemsQuery = supabase
        .from('order_items')
        .select('variant_id, qty')
        .eq('order_id', order.id)

      if (tenantId) {
        itemsQuery = itemsQuery.eq('tenant_id', tenantId)
      }

      const { data: items } = await itemsQuery

      // Release reserved inventory
      for (const item of items || []) {
        await supabase.rpc('release_reserved_inventory', {
          p_variant_id: item.variant_id,
          p_quantity: item.qty,
        })
      }

      // Update order status to cancelled
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)

      // Log the cancellation
      await supabase.from('activity_logs').insert({
        tenant_id: tenantId,
        user_id: null,
        action: 'order_auto_cancelled',
        entity_type: 'order',
        entity_id: order.id,
        details: {
          reason: 'stale_pending_order',
          hours_pending: STALE_ORDER_HOURS,
        },
      })
    }

    return { released: staleOrders.length }
  } catch (error) {
    console.error('Release stale orders error:', error)
    return { released: 0 }
  }
}

/**
 * Trigger fulfillment notification
 */
export async function triggerFulfillmentNotification(
  supabase: any,
  orderId: string,
  tenantId?: string
): Promise<{ success: boolean }> {
  try {
    // Get order details
    let orderQuery = supabase
      .from('orders')
      .select('id, user_id, shipping_address, status')
      .eq('id', orderId)
      .single()

    if (tenantId) {
      orderQuery = orderQuery.eq('tenant_id', tenantId)
    }

    const { data: order } = await orderQuery

    if (!order || order.status !== 'fulfilled') {
      return { success: false }
    }

    // Log notification (actual email sending would happen here)
    await supabase.from('activity_logs').insert({
      tenant_id: tenantId,
      user_id: order.user_id,
      action: 'fulfillment_notification_sent',
      entity_type: 'order',
      entity_id: orderId,
      details: {
        notification_type: 'email',
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Fulfillment notification error:', error)
    return { success: false }
  }
}

/**
 * Process automated return
 */
export async function processAutomatedReturn(
  supabase: any,
  returnId: string,
  tenantId?: string
): Promise<{ success: boolean; action: string }> {
  try {
    // Get return details
    let returnQuery = supabase
      .from('returns')
      .select(`
        id,
        order_id,
        return_type,
        reason,
        status,
        order:orders (id, user_id, total_cents)
      `)
      .eq('id', returnId)
      .single()

    if (tenantId) {
      returnQuery = returnQuery.eq('tenant_id', tenantId)
    }

    const { data: returnData } = await returnQuery

    if (!returnData || returnData.status !== 'pending') {
      return { success: false, action: 'invalid_return' }
    }

    const order = Array.isArray(returnData.order) ? returnData.order[0] : returnData.order

    // Auto-approve returns for specific reasons
    const autoApproveReasons = ['defective', 'wrong_item', 'damaged']
    const shouldAutoApprove = autoApproveReasons.some(r =>
      returnData.reason.toLowerCase().includes(r)
    )

    if (shouldAutoApprove) {
      // Approve return
      await supabase
        .from('returns')
        .update({ status: 'approved' })
        .eq('id', returnId)

      // Log approval
      await supabase.from('activity_logs').insert({
        tenant_id: tenantId,
        user_id: order.user_id,
        action: 'return_auto_approved',
        entity_type: 'return',
        entity_id: returnId,
        details: {
          reason: returnData.reason,
          order_id: returnData.order_id,
        },
      })

      return { success: true, action: 'approved' }
    }

    return { success: true, action: 'requires_manual_review' }
  } catch (error) {
    console.error('Automated return processing error:', error)
    return { success: false, action: 'error' }
  }
}
