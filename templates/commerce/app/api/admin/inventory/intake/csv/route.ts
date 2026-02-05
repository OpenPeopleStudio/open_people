import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

interface CSVRow {
  brand: string
  model: string
  size: string
  condition: string
  price: string
  stock: string
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { rows }: { rows: CSVRow[] } = await request.json()

    let imported = 0
    let errors = 0
    const productCache: Record<string, string> = {}

    for (const row of rows) {
      try {
        const cacheKey = `${row.brand}:${row.model}`
        let productId = productCache[cacheKey]

        if (!productId) {
          // Check if product exists
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('brand', row.brand)
            .eq('name', row.model)
            .eq('tenant_id', tenant?.id)
            .single()

          if (existingProduct) {
            productId = existingProduct.id
          } else {
            // Create product
            const slug = `${row.brand}-${row.model}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              + '-' + Date.now().toString(36)

            const { data: newProduct, error: productError } = await supabase
              .from('products')
              .insert({
                tenant_id: tenant?.id,
                name: row.model,
                brand: row.brand,
                slug,
                category: 'footwear',
                description: `${row.brand} ${row.model}`
              })
              .select()
              .single()

            if (productError) throw productError
            productId = newProduct.id

            // Also create product_model if it doesn't exist
            const modelSlug = `${row.brand}-${row.model}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')

            await supabase
              .from('product_models')
              .upsert({
                tenant_id: tenant?.id,
                brand: row.brand,
                model: row.model,
                slug: modelSlug
              }, { onConflict: 'tenant_id,slug' })
          }

          productCache[cacheKey] = productId
        }

        // Create variant with proper validation
        const priceCents = Math.round(parseFloat(row.price) * 100)
        const stock = Math.max(0, parseInt(row.stock) || 0) // Ensure stock is not negative

        if (priceCents <= 0) {
          console.error(`Invalid price for ${row.brand} ${row.model}: ${row.price}`)
          errors++
          continue
        }

        // Generate a more robust SKU
        const sizeCode = row.size.replace(/[^\w]/g, '').toUpperCase()
        const conditionCode = row.condition.toUpperCase()
        const timestamp = Date.now().toString(36).toUpperCase()
        const sku = `${row.brand.substring(0, 3).toUpperCase()}-${row.model.substring(0, 3).toUpperCase()}-${sizeCode}-${conditionCode}-${timestamp}`

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert({
            tenant_id: tenant?.id,
            product_id: productId,
            sku,
            brand: row.brand,
            model: row.model,
            size: row.size,
            condition_code: conditionCode,
            price_cents: priceCents,
            stock,
            reserved: 0
          })

        if (variantError) throw variantError
        imported++
      } catch (err) {
        console.error('Row import error:', err)
        errors++
      }
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'csv_import',
      entity_type: 'inventory',
      entity_id: null,
      details: { imported, errors, total: rows.length }
    })

    return NextResponse.json({ 
      success: true, 
      imported,
      errors
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Import failed'
    }, { status: 500 })
  }
}
