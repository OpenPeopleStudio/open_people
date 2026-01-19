import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { createNOWPaymentInvoice } from '@/lib/nowpayments'
import { getCheckoutQuote } from '@/lib/checkoutPricing'
import type { CartItem } from '@/types/cart'
import { getTenantFromRequest } from '../lib/tenant'
import { resolveCryptoProvider, resolveDeliveryProvider } from '@/lib/integrations'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cryptoProvider = resolveCryptoProvider(tenant?.settings)
    if (cryptoProvider !== 'nowpayments' || tenant?.settings?.features?.crypto_payments === false) {
      return NextResponse.json({ error: 'Crypto payments are not enabled for this tenant' }, { status: 400 })
    }
    const deliveryProvider = resolveDeliveryProvider(tenant?.settings)

    const body = await request.json()
    const { items, shippingAddress, shippingMethodCode } = body as {
      items: CartItem[]
      shippingAddress: {
        name: string
        line1: string
        line2?: string
        city: string
        province: string
        postal_code: string
        country: string
        phone?: string
        email?: string
      }
      shippingMethodCode?: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address required' }, { status: 400 })
    }

    const required = ['name', 'line1', 'city', 'province', 'postal_code', 'country', 'email']
    for (const field of required) {
      if (!(shippingAddress as Record<string, unknown>)[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Calculate totals (includes shipping + tax)
    let quote
    try {
      quote = await getCheckoutQuote({
        supabase,
        items,
        shippingAddress,
        requestedShippingMethodCode: shippingMethodCode,
        tenantId: tenant?.id,
        deliveryProvider,
      })
    } catch (error) {
      const anyError = error as Error & { variant_id?: string }
      if (anyError.message === 'Insufficient stock') {
        return NextResponse.json(
          { error: anyError.message, variant_id: anyError.variant_id },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: anyError.message || 'Checkout failed' }, { status: 400 })
    }

    const selectedShipping =
      quote.shippingOptions.find(o => o.code === quote.selectedShippingMethodCode) ?? quote.shippingOptions[0]

    if (selectedShipping.code.startsWith('local_delivery') && !shippingAddress.phone?.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required for local delivery' },
        { status: 400 }
      )
    }

    // Reserve inventory (atomic updates) with cleanup on failure
    const reserved: Array<{ variant_id: string; qty: number }> = []
    for (const item of items) {
      const { error } = await supabase.rpc('reserve_inventory', {
        variant_id_input: item.variant_id,
        qty_input: item.qty,
      })

      if (error) {
        for (const r of reserved) {
          await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
        }
        return NextResponse.json({ error: 'Reservation failed' }, { status: 409 })
      }

      reserved.push({ variant_id: item.variant_id, qty: item.qty })
    }

    // Create order in pending state
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenant?.id,
        status: 'pending',
        customer_id: user.id,
        subtotal_cents: quote.subtotalCents,
        shipping_address: shippingAddress,
        shipping_cents: quote.shippingCents,
        shipping_method: selectedShipping.label,
        tax_cents: quote.taxCents,
        tax_rate: quote.taxRate,
        total_cents: quote.totalCents,
        currency: quote.currency,
        payment_method: 'crypto',
        crypto_payment_status: 'waiting',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      for (const r of reserved) {
        await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
      }
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items
    let variantsQuery = supabase
      .from('product_variants')
      .select('id, sku, brand, model, size, price_cents')
      .in('id', reserved.map(r => r.variant_id))

    if (tenant?.id) {
      variantsQuery = variantsQuery.eq('tenant_id', tenant.id)
    }

    const { data: variantsForItems, error: variantsError } = await variantsQuery

    if (variantsError || !variantsForItems) {
      await supabase.from('orders').delete().eq('id', order.id)
      for (const r of reserved) {
        await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
      }
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    const itemsToInsert = reserved.map(r => {
      const variant = variantsForItems.find(v => v.id === r.variant_id)
      return {
        tenant_id: tenant?.id,
        order_id: order.id,
        variant_id: r.variant_id,
        qty: r.qty,
        price_cents: variant?.price_cents ?? 0,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id)
      for (const r of reserved) {
        await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
      }
      console.error('Order items error:', itemsError)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Create product description
    const itemDescriptions = reserved.map(r => {
      const variant = variantsForItems.find(v => v.id === r.variant_id)
      const name = variant ? `${variant.brand} ${variant.model}` : 'Item'
      const size = variant?.size ? ` (${variant.size})` : ''
      return `${name}${size} x${r.qty}`
    }).join(', ')

    // Create NOWPayments invoice
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://709exclusive.shop'
    
    let invoice
    try {
      invoice = await createNOWPaymentInvoice({
        price_amount: quote.totalCents / 100,
        price_currency: quote.currency,
        order_id: order.id,
        order_description: itemDescriptions.slice(0, 150), // Max 150 chars
        ipn_callback_url: `${baseUrl}/api/nowpayments/webhook`,
        success_url: `${baseUrl}/checkout/success?order_id=${order.id}`,
        cancel_url: `${baseUrl}/checkout?cancelled=true`,
      })
    } catch {
      await supabase.from('orders').delete().eq('id', order.id)
      for (const r of reserved) {
        await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
      }
      return NextResponse.json({ error: 'Failed to create payment invoice' }, { status: 500 })
    }

    // Store invoice ID on order
    await supabase
      .from('orders')
      .update({ 
        nowpayments_invoice_id: invoice.id,
      })
      .eq('id', order.id)

    return NextResponse.json({
      orderId: order.id,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      subtotalCents: quote.subtotalCents,
      shippingCents: quote.shippingCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      shippingMethodLabel: selectedShipping.label,
    })

  } catch (error) {
    console.error('NOWPayments checkout error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Checkout failed'
    }, { status: 500 })
  }
}
