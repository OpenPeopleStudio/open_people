import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { getTenantFromRequest } from '../lib/tenant'
import { SupabaseClient } from '@supabase/supabase-js'

async function getUserRole(supabase: SupabaseClient, userId: string, tenantId?: string): Promise<string | undefined> {
  let query = supabase
    .from('709_profiles')
    .select('role')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()
  return profile?.role
}

function generateSlug(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36).slice(-4)
}

function generateSKU(brand: string, name: string, size: string, condition: string): string {
  const brandCode = brand.substring(0, 3).toUpperCase()
  const nameCode = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${brandCode}-${nameCode}-${size}-${condition}-${random}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!hasAdminAccess(await getUserRole(supabase, user.id, tenant?.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, brand, size, condition, priceCents, stock, imageUrl } = body

    if (!name || !brand || !size || !priceCents) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const tenantId = tenant?.id

    // Create product
    const slug = generateSlug(brand, name)
    const productData: Record<string, unknown> = {
      name,
      brand,
      slug,
      category: 'footwear',
      external_image_url: imageUrl || null,
      data_source: 'manual'
    }
    
    if (tenantId) {
      productData.tenant_id = tenantId
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single()

    if (productError) {
      // Check for slug conflict
      if (productError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'A product with this name already exists' }, { status: 400 })
      }
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    // Create variant
    const sku = generateSKU(brand, name, size, condition)
    const variantData: Record<string, unknown> = {
      product_id: product.id,
      sku,
      size,
      condition: condition === 'DS' ? 'Deadstock' : condition,
      condition_code: condition,
      price_cents: priceCents,
      stock: stock || 1,
      reserved: 0,
      brand,
      model: name
    }
    
    if (tenantId) {
      variantData.tenant_id = tenantId
    }

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(variantData)

    if (variantError) {
      // Clean up product if variant fails
      await supabase.from('products').delete().eq('id', product.id)
      return NextResponse.json({ error: variantError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, productId: product.id })
  } catch (error) {
    console.error('Error adding product:', error)
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 })
  }
}
