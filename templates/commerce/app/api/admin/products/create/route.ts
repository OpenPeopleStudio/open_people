import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isAdmin } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!isAdmin(await getUserRole(supabase, user.id!, tenant?.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const {
    name,
    brand,
    category,
    description,
    style_code,
    is_drop,
    drop_starts_at,
    drop_ends_at,
    images,
    variants
  } = await req.json()

  try {
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    // Create product
    const { data: createdProduct, error: productError } = await supabase
      .from('products')
      .insert({
        tenant_id: tenant?.id,
        name,
        slug,
        brand,
        category,
        description,
        style_code,
        is_drop,
        drop_starts_at: is_drop && drop_starts_at ? new Date(drop_starts_at).toISOString() : null,
        drop_ends_at: is_drop && drop_ends_at ? new Date(drop_ends_at).toISOString() : null,
      })
      .select()
      .single()

    if (productError) throw productError

    // Create product images
    if (images && images.length > 0) {
      const imageInserts = images.map((url: string, index: number) => ({
        tenant_id: tenant?.id,
        product_id: createdProduct.id,
        url,
        position: index,
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts)

      if (imagesError) console.error('Image insert error:', imagesError)
    }

    // Create variants
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        const { error: variantError } = await supabase.rpc('create_variant_with_sku', {
          product_id_input: createdProduct.id,
          brand_input: brand,
          model_input: name,
          size_input: variant.size || 'OS',
          condition_input: variant.condition || 'DS',
          price_input: variant.price_cents || 0,
          stock_input: variant.stock || 0,
          tenant_id_input: tenant?.id
        })

        if (variantError) {
          console.error('Variant creation error:', variantError)
          // Try direct insert if RPC fails
          await supabase.from('product_variants').insert({
            tenant_id: tenant?.id,
            product_id: createdProduct.id,
            size: variant.size || 'OS',
            condition_code: variant.condition || 'DS',
            price_cents: variant.price_cents || 0,
            stock: variant.stock || 0,
            sku: `${brand?.substring(0, 3).toUpperCase()}-${name?.substring(0, 3).toUpperCase()}-${variant.size || 'OS'}-${variant.condition || 'DS'}-${Date.now().toString(36)}`
          })
        }
      }
    }

    return NextResponse.json({ success: true, product: createdProduct })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

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