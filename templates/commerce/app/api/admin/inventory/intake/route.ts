import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { modelId, brand, model, variants } = await request.json()

    // First, ensure product exists for this model
    let productId: string

    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('brand', brand)
      .eq('name', model)
      .eq('tenant_id', tenant?.id)
      .single()

    if (existingProduct) {
      productId = existingProduct.id
    } else {
      // Create product
      const slug = `${brand}-${model}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          tenant_id: tenant?.id,
          name: model,
          brand,
          slug,
          category: 'footwear',
          description: `${brand} ${model}`,
          model_id: modelId
        })
        .select()
        .single()

      if (productError) throw productError
      productId = newProduct.id
    }

    // Create variants
    let imported = 0
    const errors: string[] = []

    for (const variant of variants) {
      try {
        // Use the create_variant_with_sku function if available
        const { error: variantError } = await supabase.rpc('create_variant_with_sku', {
          p_product_id: productId,
          p_brand: brand,
          p_model: model,
          p_size: variant.size,
          p_condition_code: variant.condition,
          p_price_cents: variant.priceCents,
          p_stock: variant.stock
        })

        if (variantError) {
          // Fallback: insert directly
          const sku = `${brand.substring(0, 3).toUpperCase()}-${model.substring(0, 3).toUpperCase()}-${variant.size}-${variant.condition}-${Date.now().toString(36)}`.toUpperCase()
          
          const { error: insertError } = await supabase
            .from('product_variants')
            .insert({
              tenant_id: tenant?.id,
              product_id: productId,
              sku,
              brand,
              model,
              size: variant.size,
              condition_code: variant.condition,
              price_cents: variant.priceCents,
              stock: variant.stock,
              reserved: 0
            })

          if (insertError) throw insertError
        }

        imported++
      } catch (err) {
        errors.push(`${variant.size}/${variant.condition}: ${err instanceof Error ? err.message : 'Failed'}`)
      }
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'bulk_create_variants',
      entity_type: 'product',
      entity_id: productId,
      details: { brand, model, imported, total: variants.length }
    })

    return NextResponse.json({ 
      success: true, 
      imported,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Intake error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Import failed'
    }, { status: 500 })
  }
}
