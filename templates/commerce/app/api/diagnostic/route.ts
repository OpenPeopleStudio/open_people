import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)

  try {
    // Check products count
    let productsQuery = supabase
      .from('products')
      .select('id, name, brand, slug')

    if (tenant?.id) {
      productsQuery = productsQuery.eq('tenant_id', tenant.id)
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) throw productsError

    // Check variants count and stock levels
    let variantsQuery = supabase
      .from('product_variants')
      .select('id, product_id, stock, reserved, sku')

    if (tenant?.id) {
      variantsQuery = variantsQuery.eq('tenant_id', tenant.id)
    }

    const { data: variants, error: variantsError } = await variantsQuery

    if (variantsError) throw variantsError

    // Check images count
    let imagesQuery = supabase
      .from('product_images')
      .select('id, product_id, url')

    if (tenant?.id) {
      imagesQuery = imagesQuery.eq('tenant_id', tenant.id)
    }

    const { data: images, error: imagesError } = await imagesQuery

    if (imagesError) throw imagesError

    // Check available variants (stock > reserved)
    const availableVariants = variants?.filter(v => v.stock > v.reserved) || []

    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      googleApiKey: !!process.env.GOOGLE_IMAGE_API_KEY,
      googleSearchId: !!process.env.GOOGLE_SEARCH_ENGINE_ID,
      stripePublishable: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      stripeSecret: !!process.env.STRIPE_SECRET_KEY,
    }

    return NextResponse.json({
      status: 'diagnostic_complete',
      summary: {
        totalProducts: products?.length || 0,
        totalVariants: variants?.length || 0,
        availableVariants: availableVariants.length,
        totalImages: images?.length || 0,
        productsWithImages: new Set(images?.map(img => img.product_id)).size,
        productsWithVariants: new Set(variants?.map(v => v.product_id)).size,
      },
      environment: envCheck,
      sampleData: {
        products: products?.slice(0, 3),
        variants: variants?.slice(0, 3),
        availableVariants: availableVariants.slice(0, 3),
        images: images?.slice(0, 3),
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check your Supabase connection and environment variables'
    }, { status: 500 })
  }
}