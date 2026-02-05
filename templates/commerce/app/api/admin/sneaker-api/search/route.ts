/**
 * Sneaker API Search
 * 
 * POST /api/admin/sneaker-api/search
 * 
 * Searches the configured sneaker API and returns normalized results.
 * Results are cached for 15 minutes.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { searchSneakers, findExistingProduct } from '@/lib/sneakerApi'
import type { ImportPreview } from '@/lib/sneakerApi'

async function checkAdminAuth(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  tenantId?: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, profile }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const auth = await checkAdminAuth(supabase, tenant?.id)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { query, limit = 10 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Search sneaker API
    const searchResult = await searchSneakers(query.trim(), Math.min(limit, 20))

    // Check each result against existing products (by SKU)
    const previews: ImportPreview[] = await Promise.all(
      searchResult.results.map(async (sneaker) => {
        const existing = await findExistingProduct(sneaker.sku, tenant?.id)
        return {
          sneaker,
          matchesExisting: !!existing,
          existingProductId: existing?.id
        }
      })
    )

    return NextResponse.json({
      previews,
      query: searchResult.query,
      cached: searchResult.cached,
      cacheExpiresAt: searchResult.cacheExpiresAt
    })
  } catch (error) {
    console.error('Sneaker API search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

// GET handler for simple searches (used by inventory lookup)
export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const auth = await checkAdminAuth(supabase, tenant?.id)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Search sneaker API
    const searchResult = await searchSneakers(query.trim(), Math.min(limit, 20))

    // Transform to simpler format for inventory lookup
    const results = searchResult.results.map(sneaker => ({
      name: `${sneaker.model}${sneaker.colorway ? ` — ${sneaker.colorway}` : ''}`,
      brand: sneaker.brand,
      imageUrl: sneaker.externalImageUrl,
      sku: sneaker.sku,
      colorway: sneaker.colorway,
      retailPrice: sneaker.retailPriceCents ? sneaker.retailPriceCents / 100 : null,
      releaseDate: sneaker.releaseDate
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Sneaker API search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
