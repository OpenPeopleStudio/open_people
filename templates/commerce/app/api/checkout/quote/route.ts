import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getCheckoutQuote } from '@/lib/checkoutPricing'
import type { CartItem } from '@/types/cart'
import { getTenantFromRequest } from '../lib/tenant'
import { resolveDeliveryProvider } from '@/lib/integrations'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)

  try {
    const { items, shippingAddress, shippingMethodCode }: {
      items: CartItem[]
      shippingAddress: {
        country: string
        province?: string
        postal_code?: string
        city?: string
      }
      shippingMethodCode?: string
    } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const quote = await getCheckoutQuote({
      supabase,
      items,
      shippingAddress: shippingAddress || { country: 'CA' },
      requestedShippingMethodCode: shippingMethodCode,
      tenantId: tenant?.id,
      deliveryProvider: resolveDeliveryProvider(tenant?.settings),
    })

    return NextResponse.json(quote)

  } catch (error) {
    const anyError = error as Error & { variant_id?: string }
    
    if (anyError.message === 'Insufficient stock') {
      return NextResponse.json(
        { error: anyError.message, variant_id: anyError.variant_id },
        { status: 409 }
      )
    }
    
    console.error('Quote error:', error)
    return NextResponse.json(
      { error: anyError.message || 'Failed to calculate quote' },
      { status: 500 }
    )
  }
}
