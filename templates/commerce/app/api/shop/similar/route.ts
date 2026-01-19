import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { searchParams } = new URL(request.url)

  const excludeId = searchParams.get('excludeId')
  const brand = searchParams.get('brand')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '4')

  try {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        slug,
        category,
        product_images(url, is_primary),
        product_variants(price_cents, stock, reserved)
      `)
      .limit(limit + 1) // Fetch one extra in case we need to exclude

    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id)
    }

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    // Prioritize same brand
    if (brand) {
      query = query.eq('brand', brand)
    }

    // Or same category
    if (category && !brand) {
      query = query.eq('category', category)
    }

    const { data: rawProducts, error } = await query

    if (error) throw error

    // Process products
    const products = (rawProducts || [])
      .map(product => {
        const variants = product.product_variants || []
        const availableVariants = variants.filter((v: { stock: number; reserved: number }) => 
          v.stock - v.reserved > 0
        )

        if (availableVariants.length === 0) return null

        const lowestPrice = Math.min(...availableVariants.map((v: { price_cents: number }) => v.price_cents))
        const primaryImage = product.product_images?.find((img: { is_primary: boolean }) => img.is_primary)
          || product.product_images?.[0]

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          slug: product.slug,
          lowest_price_cents: lowestPrice,
          primary_image: primaryImage?.url || null,
        }
      })
      .filter(Boolean)
      .slice(0, limit)

    return NextResponse.json({ products })

  } catch (error) {
    console.error('Similar products fetch error:', error)
    return NextResponse.json({ products: [] })
  }
}
