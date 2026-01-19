import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { stripe } from '@/lib/stripe'
import { getCheckoutQuote } from '@/lib/checkoutPricing'
import type { CartItem } from '@/types/cart'
import { getTenantFromRequest } from '../lib/tenant'
import { resolveDeliveryProvider, resolvePaymentProvider } from '@/lib/integrations'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const paymentProvider = resolvePaymentProvider(tenant?.settings)
  if (paymentProvider !== 'stripe') {
    return NextResponse.json({ error: 'Card payments are not enabled for this tenant' }, { status: 400 })
  }
  const deliveryProvider = resolveDeliveryProvider(tenant?.settings)

  const { items, shippingAddress, shippingMethodCode }: {
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
  } = await req.json()

  if (!items?.length) return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
  if (!shippingAddress) return NextResponse.json({ error: 'Shipping address required' }, { status: 400 })

  // Validate shipping address
  const required = ['name', 'line1', 'city', 'province', 'postal_code', 'country', 'email']
  for (const field of required) {
    if (!shippingAddress[field as keyof typeof shippingAddress]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

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

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenant?.id,
      customer_id: user.id,
      status: 'pending',
      subtotal_cents: quote.subtotalCents,
      shipping_address: shippingAddress,
      shipping_cents: quote.shippingCents,
      shipping_method: selectedShipping.label,
      tax_cents: quote.taxCents,
      tax_rate: quote.taxRate,
      total_cents: quote.totalCents,
      currency: quote.currency,
      payment_method: 'card',
    })
    .select()
    .single()

  if (orderError || !order) {
    for (const r of reserved) {
      await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Create order items
  let variantsQuery = supabase
    .from('product_variants')
    .select('id, price_cents')
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

  const orderItems = reserved.map(r => {
    const variant = variantsForItems.find(v => v.id === r.variant_id)
    return {
      tenant_id: tenant?.id,
      order_id: order.id,
      variant_id: r.variant_id,
      qty: r.qty,
      price_cents: variant?.price_cents ?? 0,
    }
  })

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    for (const r of reserved) {
      await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
    }
    return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
  }

  // Create Stripe intent
  let intent
  try {
    intent = await stripe.paymentIntents.create({
      amount: quote.totalCents,
      currency: quote.currency,
      receipt_email: shippingAddress.email,
      metadata: {
        order_id: order.id,
        tenant_id: tenant?.id || 'unknown',
        shipping_method_code: quote.selectedShippingMethodCode,
      },
    })
  } catch {
    await supabase.from('orders').delete().eq('id', order.id)
    for (const r of reserved) {
      await supabase.rpc('release_reserved_inventory', { variant_id: r.variant_id, qty: r.qty })
    }
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
  }

  await supabase
    .from('orders')
    .update({ stripe_payment_intent: intent.id })
    .eq('id', order.id)

  return NextResponse.json({
    clientSecret: intent.client_secret,
    orderId: order.id,
    subtotalCents: quote.subtotalCents,
    shippingCents: quote.shippingCents,
    taxCents: quote.taxCents,
    taxRate: quote.taxRate,
    totalCents: quote.totalCents,
    currency: quote.currency,
    shippingMethodLabel: selectedShipping.label,
    shippingMethodCode: quote.selectedShippingMethodCode,
  })
}
