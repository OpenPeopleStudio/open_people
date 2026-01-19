import { SupabaseClient } from '@supabase/supabase-js'
import type { CartItem } from '@/types/cart'
import { CANADIAN_TAX_RATES } from './taxes'
import type { DeliveryProvider } from './integrations'

interface ShippingOption {
  code: string
  label: string
  description: string | null
  amount_cents: number
  currency: string
  sort_order: number
}

interface CheckoutQuote {
  currency: string
  subtotalCents: number
  shippingCents: number
  taxCents: number
  taxRate: number
  totalCents: number
  shippingOptions: ShippingOption[]
  selectedShippingMethodCode: string
}

interface ShippingAddress {
  country: string
  province?: string
  postal_code?: string
  city?: string
}

const FREE_SHIPPING_THRESHOLD = 25000 // $250 CAD
const FREE_LOCAL_THRESHOLD = 15000 // $150 CAD

async function isInLocalDeliveryZone(
  supabase: SupabaseClient,
  postalCode: string,
  city?: string,
  tenantId?: string
): Promise<boolean> {
  const fsa = postalCode?.replace(/\s/g, '').substring(0, 3).toUpperCase()
  
  let zonesQuery = supabase
    .from('local_delivery_zones')
    .select('city_names, postal_fsa_prefixes')
    .eq('active', true)
    .eq('country', 'CA')
    .eq('province', 'NL')

  if (tenantId) {
    zonesQuery = zonesQuery.eq('tenant_id', tenantId)
  }

  const { data: zones } = await zonesQuery

  if (!zones || zones.length === 0) return false

  for (const zone of zones) {
    // Check postal FSA prefix
    if (zone.postal_fsa_prefixes?.includes(fsa)) {
      return true
    }
    
    // Check city name
    if (city && zone.city_names?.some((c: string) => 
      c.toLowerCase() === city.toLowerCase()
    )) {
      return true
    }
  }

  return false
}

export async function getCheckoutQuote({
  supabase,
  items,
  shippingAddress,
  requestedShippingMethodCode,
  tenantId,
  deliveryProvider,
}: {
  supabase: SupabaseClient
  items: CartItem[]
  shippingAddress: ShippingAddress
  requestedShippingMethodCode?: string
  tenantId?: string
  deliveryProvider?: DeliveryProvider
}): Promise<CheckoutQuote> {
  // Fetch variants
  const variantIds = items.map(i => i.variant_id)
  
  let variantsQuery = supabase
    .from('product_variants')
    .select('id, price_cents, stock, reserved')
    .in('id', variantIds)

  if (tenantId) {
    variantsQuery = variantsQuery.eq('tenant_id', tenantId)
  }

  const { data: variants, error } = await variantsQuery

  if (error || !variants) {
    throw new Error('Inventory fetch failed')
  }

  // Validate availability and calculate subtotal
  let subtotalCents = 0

  for (const item of items) {
    const variant = variants.find(v => v.id === item.variant_id)
    if (!variant) {
      throw new Error('Variant missing')
    }

    const available = variant.stock - variant.reserved
    if (available < item.qty) {
      const err = new Error('Insufficient stock') as Error & { variant_id: string }
      err.variant_id = variant.id
      throw err
    }

    subtotalCents += variant.price_cents * item.qty
  }

  // Determine shipping options from database
  const country = shippingAddress.country || 'CA'
  const province = shippingAddress.province?.toUpperCase() || ''
  
  let methodsQuery = supabase
    .from('shipping_methods')
    .select('*')
    .eq('active', true)
    .contains('countries', [country])
    .order('sort_order')

  if (tenantId) {
    methodsQuery = methodsQuery.eq('tenant_id', tenantId)
  }

  const { data: shippingMethods } = await methodsQuery

  const shippingOptions: ShippingOption[] = []
  const localDeliveryEnabled = (deliveryProvider ?? 'internal') === 'internal'
  const isLocal = localDeliveryEnabled && shippingAddress.postal_code
    ? await isInLocalDeliveryZone(supabase, shippingAddress.postal_code, shippingAddress.city, tenantId)
    : false

  for (const method of shippingMethods || []) {
    // Check province restriction
    if (method.provinces?.length > 0 && !method.provinces.includes(province)) {
      continue
    }

    // Check local zone requirement
    if (method.requires_local_zone && !isLocal) {
      continue
    }
    if (!localDeliveryEnabled && method.code?.startsWith('local_delivery')) {
      continue
    }

    // Calculate amount (may be free based on threshold)
    let amountCents = method.amount_cents
    
    if (country === 'CA') {
      // Free standard shipping over threshold
      if (method.code === 'standard_ca' && subtotalCents >= FREE_SHIPPING_THRESHOLD) {
        amountCents = 0
      }
      // Free local delivery over local threshold
      if (method.code === 'local_delivery_nl' && subtotalCents >= FREE_LOCAL_THRESHOLD) {
        amountCents = 0
      }
    }

    shippingOptions.push({
      code: method.code,
      label: method.label,
      description: method.description,
      amount_cents: amountCents,
      currency: method.currency,
      sort_order: method.sort_order,
    })
  }

  // Sort shipping options
  shippingOptions.sort((a, b) => a.sort_order - b.sort_order)

  // If no shipping options available, add a fallback
  if (shippingOptions.length === 0) {
    shippingOptions.push({
      code: 'standard',
      label: 'Standard Shipping',
      description: 'Delivery within 5-10 business days',
      amount_cents: country === 'CA' ? 1500 : 2500,
      currency: 'cad',
      sort_order: 1,
    })
  }

  // Select shipping method
  let selectedShippingMethodCode = requestedShippingMethodCode || shippingOptions[0]?.code
  let selectedOption = shippingOptions.find(o => o.code === selectedShippingMethodCode)
  
  if (!selectedOption) {
    selectedOption = shippingOptions[0]
    selectedShippingMethodCode = selectedOption?.code || 'standard'
  }

  const shippingCents = selectedOption?.amount_cents || 0

  // Calculate tax
  let taxRate = 0
  let taxCents = 0

  if (country === 'CA' && province) {
    const taxInfo = CANADIAN_TAX_RATES[province]
    if (taxInfo) {
      taxRate = taxInfo.rate
      // Tax is applied to subtotal + shipping in Canada
      taxCents = Math.round((subtotalCents + shippingCents) * taxRate)
    }
  }
  // US orders: no tax collected (customer responsible for import duties)

  const totalCents = subtotalCents + shippingCents + taxCents

  return {
    currency: 'cad',
    subtotalCents,
    shippingCents,
    taxCents,
    taxRate,
    totalCents,
    shippingOptions,
    selectedShippingMethodCode,
  }
}
