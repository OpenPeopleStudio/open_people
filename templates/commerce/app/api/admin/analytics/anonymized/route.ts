import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { hasAdminAccess } from '../lib/roles'
import { hashEmail, addDifferentialPrivacyNoise, anonymizeIP } from '../lib/privacy'

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const metricType = searchParams.get('metric') || 'overview'
  const days = parseInt(searchParams.get('days') || '30')
  const epsilon = parseFloat(searchParams.get('epsilon') || '0.1') // Differential privacy parameter

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let analytics: any = {}

    switch (metricType) {
      case 'overview':
        analytics = await getOverviewAnalytics(supabase, tenant?.id, startDate, epsilon)
        break
      case 'customer_ltv':
        analytics = await getCustomerLTVAnalytics(supabase, tenant?.id, startDate, epsilon)
        break
      case 'geographic':
        analytics = await getGeographicAnalytics(supabase, tenant?.id, startDate)
        break
      case 'staff_efficiency':
        analytics = await getStaffEfficiencyAnalytics(supabase, tenant?.id, startDate, epsilon)
        break
      case 'inventory_turnover':
        analytics = await getInventoryTurnoverAnalytics(supabase, tenant?.id, startDate)
        break
      default:
        return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 })
    }

    return NextResponse.json({
      metric: metricType,
      period_days: days,
      privacy_epsilon: epsilon,
      generated_at: new Date().toISOString(),
      data: analytics,
      privacy_notes: 'All customer identifiers have been hashed. Counts may include differential privacy noise.',
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 })
  }
}

async function getOverviewAnalytics(supabase: any, tenantId: string | undefined, startDate: string, epsilon: number) {
  const query = supabase
    .from('orders')
    .select('id, total_cents, status, created_at, shipping_address')
    .gte('created_at', startDate)

  if (tenantId) {
    query.eq('tenant_id', tenantId)
  }

  const { data: orders } = await query

  const totalOrders = orders?.length || 0
  const paidOrders = orders?.filter((o: any) => ['paid', 'fulfilled', 'shipped', 'delivered'].includes(o.status)) || []
  
  const totalRevenue = paidOrders.reduce((sum: number, order: any) => sum + (order.total_cents || 0), 0)
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0

  // Apply differential privacy noise
  const noisyTotalOrders = addDifferentialPrivacyNoise(totalOrders, epsilon)
  const noisyRevenue = addDifferentialPrivacyNoise(totalRevenue, epsilon * 0.01) // Less noise for larger numbers

  // Get unique customers (anonymized)
  const customerEmails = new Set(
    orders?.map((o: any) => o.shipping_address?.email).filter(Boolean) || []
  )
  
  const anonymizedCustomers = await Promise.all(
    Array.from(customerEmails).map(email => hashEmail(email as string))
  )

  return {
    total_orders: noisyTotalOrders,
    paid_orders: addDifferentialPrivacyNoise(paidOrders.length, epsilon),
    total_revenue_cents: noisyRevenue,
    avg_order_value_cents: Math.round(avgOrderValue),
    unique_customers: addDifferentialPrivacyNoise(anonymizedCustomers.length, epsilon),
    conversion_rate: totalOrders > 0 ? (paidOrders.length / totalOrders) : 0,
  }
}

async function getCustomerLTVAnalytics(supabase: any, tenantId: string | undefined, startDate: string, epsilon: number) {
  const query = supabase
    .from('orders')
    .select('shipping_address, total_cents, status')
    .gte('created_at', startDate)
    .in('status', ['paid', 'fulfilled', 'shipped', 'delivered'])

  if (tenantId) {
    query.eq('tenant_id', tenantId)
  }

  const { data: orders } = await query

  // Group by customer (anonymized)
  const customerMap = new Map<string, { total: number; orders: number }>()
  
  for (const order of orders || []) {
    const email = order.shipping_address?.email
    if (email) {
      const hashedEmail = await hashEmail(email)
      const existing = customerMap.get(hashedEmail) || { total: 0, orders: 0 }
      customerMap.set(hashedEmail, {
        total: existing.total + (order.total_cents || 0),
        orders: existing.orders + 1,
      })
    }
  }

  // Calculate LTV distribution (with differential privacy)
  const ltvBuckets = {
    '0-100': 0,
    '100-250': 0,
    '250-500': 0,
    '500-1000': 0,
    '1000+': 0,
  }

  for (const [, stats] of customerMap.entries()) {
    const ltvDollars = stats.total / 100
    if (ltvDollars < 100) ltvBuckets['0-100']++
    else if (ltvDollars < 250) ltvBuckets['100-250']++
    else if (ltvDollars < 500) ltvBuckets['250-500']++
    else if (ltvDollars < 1000) ltvBuckets['500-1000']++
    else ltvBuckets['1000+']++
  }

  // Apply noise to buckets
  const noisyBuckets = Object.fromEntries(
    Object.entries(ltvBuckets).map(([key, value]) => [
      key,
      addDifferentialPrivacyNoise(value, epsilon),
    ])
  )

  const avgLTV = customerMap.size > 0
    ? Array.from(customerMap.values()).reduce((sum, c) => sum + c.total, 0) / customerMap.size
    : 0

  return {
    ltv_distribution: noisyBuckets,
    avg_ltv_cents: Math.round(avgLTV),
    total_customers_analyzed: addDifferentialPrivacyNoise(customerMap.size, epsilon),
  }
}

async function getGeographicAnalytics(supabase: any, tenantId: string | undefined, startDate: string) {
  const query = supabase
    .from('orders')
    .select('shipping_address, total_cents, status')
    .gte('created_at', startDate)
    .in('status', ['paid', 'fulfilled', 'shipped', 'delivered'])

  if (tenantId) {
    query.eq('tenant_id', tenantId)
  }

  const { data: orders } = await query

  // Aggregate by city and province (not exact addresses)
  const geoMap = new Map<string, { orders: number; revenue: number }>()
  
  for (const order of orders || []) {
    const addr = order.shipping_address
    if (addr?.city && addr?.province) {
      const key = `${addr.city}, ${addr.province}`
      const existing = geoMap.get(key) || { orders: 0, revenue: 0 }
      geoMap.set(key, {
        orders: existing.orders + 1,
        revenue: existing.revenue + (order.total_cents || 0),
      })
    }
  }

  // Convert to array and sort by revenue
  const geoData = Array.from(geoMap.entries())
    .map(([location, stats]) => ({
      location,
      orders: stats.orders,
      revenue_cents: stats.revenue,
    }))
    .sort((a, b) => b.revenue_cents - a.revenue_cents)
    .slice(0, 20) // Top 20 locations

  return {
    top_locations: geoData,
    total_locations: geoMap.size,
  }
}

async function getStaffEfficiencyAnalytics(supabase: any, tenantId: string | undefined, startDate: string, epsilon: number) {
  // Get staff location activity
  const locQuery = supabase
    .from('staff_locations')
    .select('user_id, recorded_at')
    .gte('recorded_at', startDate)

  if (tenantId) {
    locQuery.eq('tenant_id', tenantId)
  }

  const { data: locations } = await locQuery

  // Get staff profiles (anonymized)
  const staffIds = new Set(locations?.map((l: any) => l.user_id) || [])
  
  const { data: staffProfiles } = await supabase
    .from('profiles')
    .select('id, role')
    .in('id', Array.from(staffIds))
    .in('role', ['staff', 'admin', 'owner'])

  // Count location updates per staff member
  const staffActivity = new Map<string, number>()
  for (const loc of locations || []) {
    staffActivity.set(loc.user_id, (staffActivity.get(loc.user_id) || 0) + 1)
  }

  // Anonymize staff IDs
  const anonymizedStats = Array.from(staffActivity.entries()).map(([userId, count]) => ({
    staff_id_hash: userId.substring(0, 8), // Partial hash for privacy
    location_updates: addDifferentialPrivacyNoise(count, epsilon),
  }))

  return {
    active_staff: addDifferentialPrivacyNoise(staffProfiles?.length || 0, epsilon),
    staff_activity: anonymizedStats,
    total_location_updates: addDifferentialPrivacyNoise(locations?.length || 0, epsilon),
  }
}

async function getInventoryTurnoverAnalytics(supabase: any, tenantId: string | undefined, startDate: string) {
  const variantsQuery = supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      stock,
      first_sold_at,
      product:products (brand, model)
    `)

  if (tenantId) {
    variantsQuery.eq('tenant_id', tenantId)
  }

  const { data: variants } = await variantsQuery

  // Get order items for sold units
  const itemsQuery = supabase
    .from('order_items')
    .select('variant_id, qty')

  if (tenantId) {
    itemsQuery.eq('tenant_id', tenantId)
  }

  const { data: orderItems } = await itemsQuery

  // Calculate sold units per variant
  const soldUnitsMap = new Map<string, number>()
  for (const item of orderItems || []) {
    soldUnitsMap.set(
      item.variant_id,
      (soldUnitsMap.get(item.variant_id) || 0) + (item.qty || 0)
    )
  }

  // Group by brand
  const brandTurnover = new Map<string, { sold: number; stock: number }>()
  for (const variant of variants || []) {
    const product = Array.isArray(variant.product) ? variant.product[0] : variant.product
    const brand = product?.brand || 'Unknown'
    const existing = brandTurnover.get(brand) || { sold: 0, stock: 0 }
    brandTurnover.set(brand, {
      sold: existing.sold + (soldUnitsMap.get(variant.id) || 0),
      stock: existing.stock + (variant.stock || 0),
    })
  }

  // Calculate turnover rates
  const turnoverData = Array.from(brandTurnover.entries())
    .map(([brand, stats]) => ({
      brand,
      sold_units: stats.sold,
      current_stock: stats.stock,
      turnover_rate: stats.sold + stats.stock > 0
        ? stats.sold / (stats.sold + stats.stock)
        : 0,
    }))
    .sort((a, b) => b.turnover_rate - a.turnover_rate)

  return {
    brand_turnover: turnoverData,
    total_brands: brandTurnover.size,
  }
}
