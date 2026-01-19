import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)

  try {
    // Simple test query
    let productsQuery = supabase
      .from('products')
      .select('*')
      .limit(5)

    if (tenant?.id) {
      productsQuery = productsQuery.eq('tenant_id', tenant.id)
    }

    const { data: products, error } = await productsQuery

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      productCount: products?.length || 0,
      products: products
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}