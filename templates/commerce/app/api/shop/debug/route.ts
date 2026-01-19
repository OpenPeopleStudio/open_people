import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)

  try {
    // Simple query first
    let productsQuery = supabase
      .from('products')
      .select('id, name, brand, slug')
      .limit(5)

    if (tenant?.id) {
      productsQuery = productsQuery.eq('tenant_id', tenant.id)
    }

    const { data: products, error } = await productsQuery

    if (error) {
      return NextResponse.json({ error: 'Products query failed', details: error.message })
    }

    // Check variants
    let variantsQuery = supabase
      .from('product_variants')
      .select('id, product_id, stock, reserved')
      .limit(5)

    if (tenant?.id) {
      variantsQuery = variantsQuery.eq('tenant_id', tenant.id)
    }

    const { data: variants, error: variantsError } = await variantsQuery

    if (variantsError) {
      return NextResponse.json({ error: 'Variants query failed', details: variantsError.message })
    }

    return NextResponse.json({
      productsCount: products?.length || 0,
      variantsCount: variants?.length || 0,
      sampleProducts: products,
      sampleVariants: variants
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}