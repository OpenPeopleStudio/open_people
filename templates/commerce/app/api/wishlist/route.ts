import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ items: [] })
  }

  try {
    let itemsQuery = supabase
      .from('wishlist_items')
      .select(`
        id,
        size_preference,
        condition_preference,
        created_at,
        product:products(
          id,
          name,
          brand,
          slug,
          product_images(url, is_primary),
          product_variants(id, size, condition_code, price_cents, stock, reserved)
        ),
        variant:product_variants(
          id,
          size,
          condition_code,
          price_cents,
          stock,
          reserved
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (tenant?.id) {
      itemsQuery = itemsQuery.eq('tenant_id', tenant.id)
    }

    const { data: items, error } = await itemsQuery

    if (error) throw error

    // Process items to include availability
    const processedItems = (items || []).map(item => {
      const product = item.product as unknown as {
        id: string
        name: string
        brand: string
        slug: string
        product_images: Array<{ url: string; is_primary: boolean }>
        product_variants: Array<{ id: string; size: string; condition_code: string; price_cents: number; stock: number; reserved: number }>
      }
      
      const primaryImage = product?.product_images?.find(img => img.is_primary)
        || product?.product_images?.[0]

      // Find preferred variant availability
      const preferredVariant = product?.product_variants?.find(v => 
        (!item.size_preference || v.size === item.size_preference) &&
        (!item.condition_preference || v.condition_code === item.condition_preference) &&
        v.stock - v.reserved > 0
      )

      return {
        id: item.id,
        size_preference: item.size_preference,
        condition_preference: item.condition_preference,
        created_at: item.created_at,
        product: {
          id: product?.id,
          name: product?.name,
          brand: product?.brand,
          slug: product?.slug,
          primary_image: primaryImage?.url || null,
        },
        variant: item.variant,
        is_available: !!preferredVariant,
        lowest_price_cents: preferredVariant?.price_cents || 
          Math.min(...(product?.product_variants?.map(v => v.price_cents) || [0]))
      }
    })

    return NextResponse.json({ items: processedItems })

  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId, variantId, sizePreference, conditionPreference } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const { data: item, error } = await supabase
      .from('wishlist_items')
      .upsert({
        tenant_id: tenant?.id,
        user_id: user.id,
        product_id: productId,
        variant_id: variantId || null,
        size_preference: sizePreference || null,
        condition_preference: conditionPreference || null,
      }, {
        onConflict: 'user_id,product_id,variant_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item })

  } catch (error) {
    console.error('Wishlist add error:', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')
    const productId = searchParams.get('productId')

    let query = supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)

    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id)
    }

    if (itemId) {
      query = query.eq('id', itemId)
    } else if (productId) {
      query = query.eq('product_id', productId)
    } else {
      return NextResponse.json({ error: 'Item ID or Product ID required' }, { status: 400 })
    }

    const { error } = await query

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Wishlist remove error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
