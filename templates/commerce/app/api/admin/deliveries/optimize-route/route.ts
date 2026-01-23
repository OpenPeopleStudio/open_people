import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { hasAdminAccess } from '../lib/roles'
import { optimizeRoute, clusterStops, calculateETAs, type DeliveryStop, type Location } from '@/lib/routing/optimizer'
import { redactErrorMessage } from '../lib/privacy'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!hasAdminAccess(profile?.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { 
      order_ids, 
      staff_id, 
      use_staff_location = true,
      num_routes = 1 
    } = await request.json()

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ error: 'Order IDs required' }, { status: 400 })
    }

    // Get orders with addresses
    let ordersQuery = supabase
      .from('orders')
      .select('id, shipping_address, status')
      .in('id', order_ids)
      .in('status', ['paid', 'fulfilled'])

    if (tenant?.id) {
      ordersQuery = ordersQuery.eq('tenant_id', tenant.id)
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'No valid orders found' }, { status: 404 })
    }

    // Convert orders to delivery stops
    const stops: DeliveryStop[] = orders
      .filter(order => {
        const addr = order.shipping_address as any
        return addr?.latitude && addr?.longitude
      })
      .map((order, index) => {
        const addr = order.shipping_address as any
        return {
          order_id: order.id,
          location: {
            lat: addr.latitude,
            lng: addr.longitude,
            address: `${addr.line1}, ${addr.city}, ${addr.province}`,
            name: addr.name,
          },
          priority: order.status === 'paid' ? 2 : 1, // Prioritize paid orders
        }
      })

    if (stops.length === 0) {
      return NextResponse.json(
        { error: 'No orders with valid coordinates found' },
        { status: 400 }
      )
    }

    // Get start location (staff current location or default)
    let startLocation: Location = {
      lat: 47.5615, // St. John's, NL default
      lng: -52.7126,
    }

    if (use_staff_location && staff_id) {
      // Get most recent staff location
      let staffLocQuery = supabase
        .from('staff_locations')
        .select('latitude, longitude')
        .eq('user_id', staff_id)
        .order('recorded_at', { ascending: false })
        .limit(1)

      if (tenant?.id) {
        staffLocQuery = staffLocQuery.eq('tenant_id', tenant.id)
      }

      const { data: staffLoc } = await staffLocQuery

      if (staffLoc && staffLoc.length > 0) {
        startLocation = {
          lat: staffLoc[0].latitude,
          lng: staffLoc[0].longitude,
        }
      }
    }

    // Optimize routes
    let routes
    if (num_routes > 1) {
      // Cluster stops into multiple routes
      const clusters = clusterStops(stops, num_routes)
      routes = clusters.map(cluster => optimizeRoute(startLocation, cluster))
    } else {
      // Single route
      routes = [optimizeRoute(startLocation, stops)]
    }

    // Calculate ETAs
    const routesWithETAs = routes.map(route => ({
      ...route,
      etas: calculateETAs(route),
    }))

    // Log route optimization
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'route_optimized',
      entity_type: 'delivery_route',
      entity_id: routes[0].stops[0]?.order_id,
      details: {
        num_routes: routes.length,
        total_stops: stops.length,
        total_distance_km: routes.reduce((sum, r) => sum + r.total_distance_km, 0),
        staff_id: staff_id || null,
      },
    })

    return NextResponse.json({
      routes: routesWithETAs,
      summary: {
        total_routes: routes.length,
        total_stops: stops.length,
        total_distance_km: routes.reduce((sum, r) => sum + r.total_distance_km, 0),
        total_estimated_duration_minutes: routes.reduce((sum, r) => sum + r.estimated_duration_minutes, 0),
      },
    })
  } catch (error) {
    console.error('Route optimization error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Route optimization failed', 'Unable to optimize route') },
      { status: 500 }
    )
  }
}
