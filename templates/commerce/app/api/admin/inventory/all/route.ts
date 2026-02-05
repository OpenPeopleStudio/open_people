import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { getTenantFromRequest } from '../lib/tenant'
import { SupabaseClient } from '@supabase/supabase-js'

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

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!hasAdminAccess(await getUserRole(supabase, user.id, tenant?.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const tenantId = tenant?.id

    // Get all products
    let productsQuery = supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        slug,
        external_image_url,
        created_at
      `)
      .order('brand')
      .order('name')

    if (tenantId) {
      productsQuery = productsQuery.eq('tenant_id', tenantId)
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ products: [] })
    }

    // Get variants for all products
    let variantsQuery = supabase
      .from('product_variants')
      .select('id, product_id, sku, size, condition_code, price_cents, stock, reserved')
      .in('product_id', products.map(p => p.id))

    if (tenantId) {
      variantsQuery = variantsQuery.eq('tenant_id', tenantId)
    }

    const { data: variants, error: variantsError } = await variantsQuery

    if (variantsError) {
      return NextResponse.json({ error: variantsError.message }, { status: 500 })
    }

    // Map variants to products
    const variantMap = new Map<string, typeof variants[0]>()
    variants?.forEach(v => {
      // Use first variant per product (most products have one variant)
      if (!variantMap.has(v.product_id)) {
        variantMap.set(v.product_id, v)
      }
    })

    // Calculate totals per product
    const stockMap = new Map<string, { total: number; available: number }>()
    variants?.forEach(v => {
      const current = stockMap.get(v.product_id) || { total: 0, available: 0 }
      current.total += v.stock || 0
      current.available += (v.stock || 0) - (v.reserved || 0)
      stockMap.set(v.product_id, current)
    })

    const productsWithVariants = products.map(p => ({
      ...p,
      variant: variantMap.get(p.id) || null,
      total_stock: stockMap.get(p.id)?.total || 0,
      available: stockMap.get(p.id)?.available || 0
    }))

    return NextResponse.json({ products: productsWithVariants })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
