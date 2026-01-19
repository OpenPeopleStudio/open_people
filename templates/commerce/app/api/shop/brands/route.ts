import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)

  try {
    let productsQuery = supabase
      .from('products')
      .select('brand')

    if (tenant?.id) {
      productsQuery = productsQuery.eq('tenant_id', tenant.id)
    }

    const { data: products } = await productsQuery

    const brands = [...new Set(products?.map(p => p.brand).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({ brands })

  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json({ brands: [] })
  }
}
