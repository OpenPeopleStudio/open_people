export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatAddress(address: {
  name: string
  line1: string
  line2?: string
  city: string
  province: string
  postal_code: string
  country: string
}): string {
  return `${address.name}
${address.line1}${address.line2 ? `\n${address.line2}` : ''}
${address.city}, ${address.province} ${address.postal_code}
${address.country}`
}

