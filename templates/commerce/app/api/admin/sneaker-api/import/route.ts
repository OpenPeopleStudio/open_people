/**
 * Sneaker API Import
 * 
 * POST /api/admin/sneaker-api/import
 * 
 * Imports a sneaker from API search results into the products table.
 * This is the "explicit import" step - only happens when admin confirms.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { importToProduct, findExistingProduct } from '@/lib/sneakerApi'
import type { NormalizedSneaker } from '@/lib/sneakerApi'

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
    const { sneaker }: { sneaker: NormalizedSneaker } = await request.json()

    // Validate required fields
    if (!sneaker?.brand || !sneaker?.model) {
      return NextResponse.json(
        { error: 'Brand and model are required' },
        { status: 400 }
      )
    }

    // Check if already exists (by SKU)
    if (sneaker.sku) {
      const existing = await findExistingProduct(sneaker.sku, tenant?.id)
      if (existing) {
        return NextResponse.json(
          { 
            error: 'Product with this SKU already exists',
            existingProductId: existing.id 
          },
          { status: 409 }
        )
      }
    }

    // Import the sneaker
    const result = await importToProduct(sneaker, tenant?.id)

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      productId: result.productId,
      message: `Imported: ${sneaker.brand} ${sneaker.model}`
    })
  } catch (error) {
    console.error('Sneaker import error:', error)
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    )
  }
}
