import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

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

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') || '30')
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Get orders in date range
    let ordersQuery = supabase
      .from('orders')
      .select(`
        id,
        total_cents,
        status,
        created_at,
        order_items(
          qty,
          price_cents,
          variant:product_variants(
            sku,
            product:products(brand, model)
          )
        )
      `)
      .gte('created_at', startDate)
      .not('status', 'eq', 'cancelled')

    if (tenant?.id) {
      ordersQuery = ordersQuery.eq('tenant_id', tenant.id)
    }

    const { data: orders } = await ordersQuery

    // Calculate KPIs
    const paidOrders = orders?.filter(o => ['paid', 'fulfilled', 'shipped', 'delivered'].includes(o.status)) || []
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_cents || 0), 0)
    const totalOrders = paidOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Top products
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {}
    paidOrders.forEach(order => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      order.order_items?.forEach((item: any) => {
        const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
        const product = variant?.product
        const productData = Array.isArray(product) ? product[0] : product
        const name = productData ? `${productData.brand} ${productData.model}` : 'Unknown'
        if (!productSales[name]) {
          productSales[name] = { name, sold: 0, revenue: 0 }
        }
        const qty = item.qty || 0
        productSales[name].sold += qty
        productSales[name].revenue += (item.price_cents || 0) * qty
      })
    })
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Top brands
    const brandSales: Record<string, { brand: string; sold: number; revenue: number }> = {}
    paidOrders.forEach(order => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      order.order_items?.forEach((item: any) => {
        const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
        const product = variant?.product
        const productData = Array.isArray(product) ? product[0] : product
        const brand = productData?.brand || 'Unknown'
        if (!brandSales[brand]) {
          brandSales[brand] = { brand, sold: 0, revenue: 0 }
        }
        const qty = item.qty || 0
        brandSales[brand].sold += qty
        brandSales[brand].revenue += (item.price_cents || 0) * qty
      })
    })
    const topBrands = Object.values(brandSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Revenue by month
    const monthlyRevenue: Record<string, { month: string; revenue: number; orders: number }> = {}
    paidOrders.forEach(order => {
      const month = new Date(order.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = { month, revenue: 0, orders: 0 }
      }
      monthlyRevenue[month].revenue += order.total_cents
      monthlyRevenue[month].orders += 1
    })
    const revenueByMonth = Object.values(monthlyRevenue)

    // Inventory value
    let variantsQuery = supabase
      .from('product_variants')
      .select('stock, price_cents')

    if (tenant?.id) {
      variantsQuery = variantsQuery.eq('tenant_id', tenant.id)
    }

    const { data: variants } = await variantsQuery
    
    const inventoryValue = variants?.reduce((sum, v) => sum + (v.stock * v.price_cents), 0) || 0

    // Low stock count
    let lowStockQuery = supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .lte('stock', 3)

    if (tenant?.id) {
      lowStockQuery = lowStockQuery.eq('tenant_id', tenant.id)
    }

    const { count: lowStockCount } = await lowStockQuery

    // Pending orders
    let pendingOrdersQuery = supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'paid'])

    if (tenant?.id) {
      pendingOrdersQuery = pendingOrdersQuery.eq('tenant_id', tenant.id)
    }

    const { count: pendingOrders } = await pendingOrdersQuery

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate: 0, // Would need session tracking
      topProducts,
      topBrands,
      revenueByMonth,
      inventoryValue,
      lowStockCount: lowStockCount || 0,
      pendingOrders: pendingOrders || 0
    })

  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
