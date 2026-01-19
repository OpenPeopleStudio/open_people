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
      .from('recently_viewed')
      .select(`
        id,
        viewed_at,
        product:products(
          id,
          name,
          brand,
          slug,
          product_images(url, is_primary),
          product_variants(price_cents, stock, reserved)
        )
      `)
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(12)

    if (tenant?.id) {
      itemsQuery = itemsQuery.eq('tenant_id', tenant.id)
    }

    const { data: items, error } = await itemsQuery

    if (error) throw error

    const processedItems = (items || []).map(item => {
      const product = item.product as unknown as {
        id: string
        name: string
        brand: string
        slug: string
        product_images: Array<{ url: string; is_primary: boolean }>
        product_variants: Array<{ price_cents: number; stock: number; reserved: number }>
      }
      
      const primaryImage = product?.product_images?.find(img => img.is_primary)
        || product?.product_images?.[0]
      
      const availableVariants = product?.product_variants?.filter(v => v.stock - v.reserved > 0) || []
      const lowestPrice = availableVariants.length > 0 
        ? Math.min(...availableVariants.map(v => v.price_cents))
        : null

      return {
        id: item.id,
        viewed_at: item.viewed_at,
        product: {
          id: product?.id,
          name: product?.name,
          brand: product?.brand,
          slug: product?.slug,
          primary_image: primaryImage?.url || null,
          lowest_price_cents: lowestPrice,
          in_stock: availableVariants.length > 0,
        }
      }
    })

    return NextResponse.json({ items: processedItems })

  } catch (error) {
    console.error('Recently viewed fetch error:', error)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false })
  }

  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Upsert to update viewed_at if already exists
    const { error } = await supabase
      .from('recently_viewed')
      .upsert({
        tenant_id: tenant?.id,
        user_id: user.id,
        product_id: productId,
        viewed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,product_id'
      })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Recently viewed track error:', error)
    return NextResponse.json({ success: false })
  }
}
