/**
 * Populate Product Images API
 * 
 * POST /api/admin/products/populate-images
 * 
 * Searches for images for products without them and updates external_image_url.
 * Processes in batches to avoid timeout.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { searchSneakers } from '@/lib/sneakerApi'

const BATCH_SIZE = 10 // Process 10 at a time to avoid timeout

async function checkAdminAuth(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  tenantId?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const auth = await checkAdminAuth(supabase, tenant?.id)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { brand, offset = 0 } = await request.json()

    // Get products without images
    let query = supabase
      .from('products')
      .select('id, name, brand, slug')
      .is('external_image_url', null)
      .order('brand')
      .order('name')
      .range(offset, offset + BATCH_SIZE - 1)

    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id)
    }

    if (brand) {
      query = query.ilike('brand', brand)
    }

    const { data: products, error: fetchError } = await query

    if (fetchError) throw fetchError

    if (!products || products.length === 0) {
      return NextResponse.json({
        complete: true,
        processed: 0,
        updated: 0,
        message: 'No more products to process'
      })
    }

    // Get total count for progress
    let countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .is('external_image_url', null)

    if (tenant?.id) {
      countQuery = countQuery.eq('tenant_id', tenant.id)
    }

    if (brand) {
      countQuery = countQuery.ilike('brand', brand)
    }

    const { count: remaining } = await countQuery

    // Process each product
    const results: Array<{ id: string; name: string; success: boolean; imageUrl?: string }> = []

    for (const product of products) {
      // Build search query
      const cleanName = product.name.replace(/\s*—\s*/g, ' ').trim()
      const searchQuery = `${product.brand} ${cleanName}`

      try {
        const { results: searchResults } = await searchSneakers(searchQuery, 1)

        if (searchResults.length > 0 && searchResults[0].externalImageUrl) {
          const sneaker = searchResults[0]

          // Update the product
          const { error: updateError } = await supabase
            .from('products')
            .update({
              external_image_url: sneaker.externalImageUrl,
              sku: sneaker.sku || undefined,
              external_id: sneaker.externalId || undefined,
              data_source: sneaker.source
            })
            .eq('id', product.id)

          if (!updateError) {
            results.push({
              id: product.id,
              name: product.name,
              success: true,
              imageUrl: sneaker.externalImageUrl ?? undefined
            })
          } else {
            results.push({ id: product.id, name: product.name, success: false })
          }
        } else {
          results.push({ id: product.id, name: product.name, success: false })
        }
      } catch {
        results.push({ id: product.id, name: product.name, success: false })
      }

      // Small delay between API calls
      await new Promise(r => setTimeout(r, 300))
    }

    const updated = results.filter(r => r.success).length

    return NextResponse.json({
      complete: (remaining || 0) <= BATCH_SIZE,
      processed: products.length,
      updated,
      remaining: Math.max(0, (remaining || 0) - BATCH_SIZE),
      nextOffset: offset + BATCH_SIZE,
      results
    })
  } catch (error) {
    console.error('Populate images error:', error)
    return NextResponse.json(
      { error: 'Failed to process images' },
      { status: 500 }
    )
  }
}

// GET endpoint to check status
export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const auth = await checkAdminAuth(supabase, tenant?.id)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    // Count products with and without images
    let withImagesQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .not('external_image_url', 'is', null)

    let withoutImagesQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .is('external_image_url', null)

    // Also check product_images table
    let uploadedQuery = supabase
      .from('product_images')
      .select('product_id', { count: 'exact', head: true })

    if (tenant?.id) {
      withImagesQuery = withImagesQuery.eq('tenant_id', tenant.id)
      withoutImagesQuery = withoutImagesQuery.eq('tenant_id', tenant.id)
      uploadedQuery = uploadedQuery.eq('tenant_id', tenant.id)
    }

    const [
      { count: withExternalImages },
      { count: withoutImages },
      { count: uploadedImages }
    ] = await Promise.all([
      withImagesQuery,
      withoutImagesQuery,
      uploadedQuery
    ])

    // Get breakdown by brand
    let brandQuery = supabase
      .from('products')
      .select('brand')
      .is('external_image_url', null)

    if (tenant?.id) {
      brandQuery = brandQuery.eq('tenant_id', tenant.id)
    }

    const { data: brandsData } = await brandQuery

    const byBrand: Record<string, number> = {}
    for (const p of brandsData || []) {
      byBrand[p.brand] = (byBrand[p.brand] || 0) + 1
    }

    return NextResponse.json({
      total: (withExternalImages || 0) + (withoutImages || 0),
      withExternalImages: withExternalImages || 0,
      withUploadedImages: uploadedImages || 0,
      withoutImages: withoutImages || 0,
      byBrand
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
