import type { TenantContextValue } from '@/types/tenant'

/**
 * Check if a feature is enabled for the current tenant
 */
export function isFeatureEnabled(
  tenant: TenantContextValue | null,
  feature: keyof NonNullable<TenantContextValue['settings']['features']>
): boolean {
  return tenant?.settings?.features?.[feature] === true
}

/**
 * Feature guard hooks and utilities
 */
export const FeatureGuards = {
  hasDrops: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'drops'),
  hasWishlist: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'wishlist'),
  hasMessages: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'messages'),
  hasE2EEncryption: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'e2e_encryption'),
  hasCryptoPayments: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'crypto_payments'),
  hasLocalDelivery: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'local_delivery'),
  hasPickup: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'pickup'),
  hasAdmin: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'admin'),
  hasConsignments: (tenant: TenantContextValue | null) => isFeatureEnabled(tenant, 'consignments'),
} as const

/**
 * Get enabled features as a list
 */
export function getEnabledFeatures(tenant: TenantContextValue | null): string[] {
  if (!tenant?.settings?.features) {
    return []
  }

  return Object.entries(tenant.settings.features)
    .filter(([_, enabled]) => enabled === true)
    .map(([feature]) => feature)
}

/**
 * Get commerce settings
 */
export function getCurrency(tenant: TenantContextValue | null): string {
  return tenant?.settings?.commerce?.currency?.toUpperCase() || 'USD'
}

/**
 * Get integration provider settings
 */
export function getPaymentProvider(tenant: TenantContextValue | null): 'stripe' | 'manual' {
  return tenant?.settings?.integrations?.payments?.provider || 'manual'
}

export function getCryptoProvider(tenant: TenantContextValue | null): 'nowpayments' | 'disabled' {
  return tenant?.settings?.integrations?.payments?.crypto_provider || 'disabled'
}

export function getEmailProvider(tenant: TenantContextValue | null): 'sendgrid' | 'postmark' | 'resend' | 'disabled' {
  return tenant?.settings?.integrations?.email?.provider || 'disabled'
}

export function getDeliveryProvider(tenant: TenantContextValue | null): 'internal' | 'manual' {
  return tenant?.settings?.integrations?.delivery?.provider || 'manual'
}
