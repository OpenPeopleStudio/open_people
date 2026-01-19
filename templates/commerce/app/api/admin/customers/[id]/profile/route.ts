import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'

type Activity = {
  type: string
  timestamp: string
  description: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const extractPhoneFromShippingAddress = (shippingAddress: unknown): string | null => {
  if (!isRecord(shippingAddress)) return null
  return (
    asString(shippingAddress.phone) ||
    asString(shippingAddress.phone_number) ||
    asString(shippingAddress.telephone) ||
    asString(shippingAddress.mobile) ||
    null
  )
}

/**
 * GET /api/admin/customers/[id]/profile
 * Returns customer profile with orders, activity, and presence information.
 * Used by the CustomerProfilePanel slide-over.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params
    const supabase = await createSupabaseServer()
    
    // Get current user and verify admin/staff role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user role
    const { data: profile } = await supabase
      .from('709_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner', 'staff'].includes(profile.role || '')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const tenantId = profile.tenant_id

    // Fetch customer profile
    const { data: customerProfile, error: profileError } = await supabase
      .from('709_profiles')
      .select('id, full_name, role, created_at, is_online, last_active_at, public_key')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Fetch customer email from auth.users (requires admin client)
    let email = null
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/admin/messages/users`)
      if (response.ok) {
        const data = (await response.json()) as { users?: Array<{ id: string; email: string }> }
        const user = (data.users || []).find((u) => u.id === customerId)
        email = user?.email || null
      }
    } catch (err) {
      console.error('Failed to fetch user email:', err)
    }

    // Fetch customer orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_cents,
        created_at,
        paid_at,
        shipped_at
      `)
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) {
      console.error('Failed to fetch orders:', ordersError)
    }

    // Fetch recent messages count
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)

    // Build activity timeline
    const activity: Activity[] = []

    // Best-effort phone extraction from latest shipping address
    let phone: string | null = null
    try {
      const { data: recentOrderRows } = await supabase
        .from('orders')
        .select('shipping_address, created_at')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)

      const shippingAddress = recentOrderRows?.[0]?.shipping_address as unknown
      phone = extractPhoneFromShippingAddress(shippingAddress)
    } catch (err) {
      console.error('Failed to derive customer phone:', err)
    }

    // Add message activity
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('created_at, sender_type')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5)

    recentMessages?.forEach(msg => {
      activity.push({
        type: 'message',
        timestamp: msg.created_at,
        description: msg.sender_type === 'customer' ? 'Sent a message' : 'Received reply'
      })
    })

    // Add order activity
    orders?.forEach(order => {
      if (order.shipped_at) {
        activity.push({
          type: 'order_shipped',
          timestamp: order.shipped_at,
          description: `Order #${order.id.slice(0, 8)} shipped`
        })
      }
      if (order.paid_at) {
        activity.push({
          type: 'order_paid',
          timestamp: order.paid_at,
          description: `Placed order #${order.id.slice(0, 8)}`
        })
      }
    })

    // Sort activity by timestamp
    activity.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json({
      customer: {
        id: customerProfile.id,
        fullName: customerProfile.full_name,
        email,
        phone,
        role: customerProfile.role,
        createdAt: customerProfile.created_at,
        isOnline: customerProfile.is_online || false,
        lastActiveAt: customerProfile.last_active_at,
        hasEncryption: !!customerProfile.public_key
      },
      orders: orders || [],
      messageCount: messageCount || 0,
      activity: activity.slice(0, 10)
    })
  } catch (error) {
    console.error('Customer profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
