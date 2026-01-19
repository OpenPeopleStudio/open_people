// Canadian provincial tax rates
export const CANADIAN_TAX_RATES: Record<string, { type: string; rate: number; name: string }> = {
  // HST Provinces
  'NL': { type: 'HST', rate: 0.15, name: 'Newfoundland and Labrador' },
  'NB': { type: 'HST', rate: 0.15, name: 'New Brunswick' },
  'NS': { type: 'HST', rate: 0.15, name: 'Nova Scotia' },
  'PE': { type: 'HST', rate: 0.15, name: 'Prince Edward Island' },
  'ON': { type: 'HST', rate: 0.13, name: 'Ontario' },
  
  // GST Only
  'AB': { type: 'GST', rate: 0.05, name: 'Alberta' },
  'NT': { type: 'GST', rate: 0.05, name: 'Northwest Territories' },
  'NU': { type: 'GST', rate: 0.05, name: 'Nunavut' },
  'YT': { type: 'GST', rate: 0.05, name: 'Yukon' },
  
  // GST + PST
  'BC': { type: 'GST+PST', rate: 0.12, name: 'British Columbia' },
  'SK': { type: 'GST+PST', rate: 0.11, name: 'Saskatchewan' },
  'MB': { type: 'GST+PST', rate: 0.12, name: 'Manitoba' },
  
  // GST + QST
  'QC': { type: 'GST+QST', rate: 0.14975, name: 'Quebec' },
}

export const SHIPPING_RATES = {
  CA: {
    standard: { cents: 1500, days: '5-7 business days', label: 'Standard (Canada Post)' },
    express: { cents: 2500, days: '2-3 business days', label: 'Express (Canada Post)' },
    priority: { cents: 3500, days: '1-2 business days', label: 'Priority (Purolator)' },
  },
  US: {
    standard: { cents: 2500, days: '7-10 business days', label: 'Standard (USPS)' },
    express: { cents: 4500, days: '3-5 business days', label: 'Express (UPS)' },
  },
  LOCAL: {
    delivery: { cents: 1000, days: 'Same day or next business day', label: 'Local Delivery' },
    pickup: { cents: 0, days: 'Ready within 24 hours', label: 'Local Pickup' },
  }
}

export const FREE_SHIPPING_THRESHOLD = 25000 // $250 CAD
export const FREE_LOCAL_THRESHOLD = 15000 // $150 CAD

export function calculateTax(subtotalCents: number, province: string): { amount: number; type: string; rate: number } {
  const taxInfo = CANADIAN_TAX_RATES[province.toUpperCase()]
  
  if (!taxInfo) {
    return { amount: 0, type: 'N/A', rate: 0 }
  }

  return {
    amount: Math.round(subtotalCents * taxInfo.rate),
    type: taxInfo.type,
    rate: taxInfo.rate,
  }
}

export function isLocalDeliveryEligible(postalCode: string): boolean {
  // St. John's area postal codes
  const normalized = postalCode.replace(/\s/g, '').toUpperCase()
  return /^A1[A-N]/.test(normalized)
}

export function getShippingRate(
  country: 'CA' | 'US',
  method: 'standard' | 'express' | 'priority' | 'delivery' | 'pickup',
  subtotalCents: number,
  isLocal: boolean = false
): number {
  if (method === 'pickup') {
    return 0
  }

  if (method === 'delivery' && isLocal) {
    return subtotalCents >= FREE_LOCAL_THRESHOLD ? 0 : SHIPPING_RATES.LOCAL.delivery.cents
  }

  if (country === 'CA' && method === 'standard' && subtotalCents >= FREE_SHIPPING_THRESHOLD) {
    return 0
  }

  const countryRates = SHIPPING_RATES[country] as Record<string, { cents: number }>
  const rate = countryRates[method]
  return rate?.cents || 0
}

export function formatCurrency(cents: number, currency: 'CAD' | 'USD' = 'CAD', showCurrency: boolean = true): string {
  const dollars = (cents / 100).toFixed(2)
  
  if (showCurrency) {
    return `$${dollars} ${currency}`
  }
  
  return `$${dollars}`
}

export function getCADtoUSDEstimate(cadCents: number): number {
  // Rough conversion rate - in production, use a real-time API
  const exchangeRate = 0.74
  return Math.round(cadCents * exchangeRate)
}
