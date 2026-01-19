import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
  }

  try {
    const supabase = await createSupabaseServer()
    
    // Get user and verify they're admin/staff
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('709_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['staff', 'admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch product stats
    const [
      wishlistResult,
      stockAlertsResult,
      ordersResult,
      productResult,
    ] = await Promise.all([
      // Wishlist count
      supabase
        .from('wishlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('tenant_id', profile.tenant_id),
      
      // Stock alerts count
      supabase
        .from('stock_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('tenant_id', profile.tenant_id),
      
      // Total orders (order_items with this product's variants)
      supabase
        .from('order_items')
        .select('variant_id')
        .eq('tenant_id', profile.tenant_id),
      
      // Product with variants
      supabase
        .from('products')
        .select('created_at, product_variants(*)')
        .eq('id', productId)
        .eq('tenant_id', profile.tenant_id)
        .single(),
    ])

    // Calculate days in stock
    const daysInStock = productResult.data?.created_at
      ? Math.floor(
          (Date.now() - new Date(productResult.data.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    // Count orders for this product's variants
    const variantIds = productResult.data?.product_variants?.map((v: any) => v.id) || []
    const totalOrders = ordersResult.data?.filter((item: any) =>
      variantIds.includes(item.variant_id)
    ).length || 0

    // Calculate average price from variants
    const variants = productResult.data?.product_variants || []
    const avgPrice = variants.length > 0
      ? Math.round(
          variants.reduce((sum: number, v: any) => sum + v.price_cents, 0) /
            variants.length
        )
      : 0

    const stats = {
      wishlistCount: wishlistResult.count || 0,
      stockAlerts: stockAlertsResult.count || 0,
      totalOrders,
      daysInStock,
      avgPrice,
      // Note: views and profitMargin would require additional tracking tables
      // These can be implemented later with an analytics system
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Product stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product stats' },
      { status: 500 }
    )
  }
}
