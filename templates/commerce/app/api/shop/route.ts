import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    
    // Parse query params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 500)
    const search = searchParams.get('search')

    // Get products with optional search
    // Include external_image_url for fallback (MVP: site works if external images break)
    // Note: We fetch more products initially since we filter by stock later
    let productsQuery = supabase
      .from('products')
      .select('id, name, brand, slug, category, created_at, external_image_url')
      .order('brand')
      .order('name')
    
    if (search) {
      productsQuery = productsQuery.or(`name.ilike.%${search}%,brand.ilike.%${search}%`)
    }

    if (tenant?.id) {
      productsQuery = productsQuery.eq('tenant_id', tenant.id)
    }

    const { data: rawProducts, error: productsError } = await productsQuery

    if (productsError) {
      return NextResponse.json({
        error: 'Products query failed',
        details: productsError.message
      }, { status: 500 })
    }

    // Get images for these products
    let imagesQuery = supabase
      .from('product_images')
      .select('product_id, url, is_primary')
      .in('product_id', rawProducts.map(p => p.id))

    if (tenant?.id) {
      imagesQuery = imagesQuery.eq('tenant_id', tenant.id)
    }

    const { data: imagesData, error: imagesError } = await imagesQuery

    // Get variants for these products
    let variantsQuery = supabase
      .from('product_variants')
      .select('product_id, price_cents, stock, reserved')
      .in('product_id', rawProducts.map(p => p.id))

    if (tenant?.id) {
      variantsQuery = variantsQuery.eq('tenant_id', tenant.id)
    }

    const { data: variantsData, error: variantsError } = await variantsQuery

    // Create lookup maps
    const imageMap: Record<string, string> = {}
    if (imagesData) {
      imagesData.forEach((img: any) => {
        if (!imageMap[img.product_id]) {
          imageMap[img.product_id] = img.url
        }
      })
    }

    // Calculate prices and availability, filter out products with no stock
    const products = rawProducts
      .map(product => {
        const productVariants = variantsData?.filter(v => v.product_id === product.id) || []
        const prices = productVariants.map(v => v.price_cents)
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0
        const totalStock = productVariants.reduce((sum, v) => sum + (v.stock - v.reserved), 0)

        // Image priority: uploaded image > external_image_url > null
        // This follows MVP principle: site works if external images break
        const primaryImage = imageMap[product.id] || product.external_image_url || null

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          slug: product.slug,
          category: product.category,
          lowest_price_cents: lowestPrice,
          variants_count: productVariants.filter(v => v.stock > v.reserved).length,
          total_stock: totalStock,
          primary_image: primaryImage,
          created_at: product.created_at
        }
      })
      // Only show products with stock > 0
      .filter(product => product.total_stock > 0)
      // Apply limit after filtering
      .slice(0, limit)

    return NextResponse.json({
      products,
      count: products.length
    })

  } catch (error) {
    console.error('Shop API error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch products'
    }, { status: 500 })
  }
}