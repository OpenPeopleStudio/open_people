'use client'

import { useTenant } from '@/context/TenantContext'
import { isFeatureEnabled } from '@/lib/featureGuards'
import type { TenantContextValue } from '@/types/tenant'

interface FeatureGateProps {
  feature: keyof NonNullable<TenantContextValue['settings']['features']>
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component that conditionally renders children based on feature flag
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const tenant = useTenant()
  
  if (!isFeatureEnabled(tenant, feature)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeature(feature: keyof NonNullable<TenantContextValue['settings']['features']>): boolean {
  const tenant = useTenant()
  return isFeatureEnabled(tenant, feature)
}

/**
 * Hook to get all enabled features
 */
export function useEnabledFeatures(): string[] {
  const tenant = useTenant()
  
  if (!tenant?.settings?.features) {
    return []
  }

  return Object.entries(tenant.settings.features)
    .filter(([_, enabled]) => enabled === true)
    .map(([feature]) => feature)
}

/**
 * Hook to get tenant commerce settings
 */
export function useCommerce() {
  const tenant = useTenant()
  
  return {
    currency: tenant?.settings?.commerce?.currency?.toUpperCase() || 'USD',
  }
}

/**
 * Hook to get tenant integration settings
 */
export function useIntegrations() {
  const tenant = useTenant()
  
  return {
    paymentProvider: tenant?.settings?.integrations?.payments?.provider || 'manual',
    cryptoProvider: tenant?.settings?.integrations?.payments?.crypto_provider || 'disabled',
    emailProvider: tenant?.settings?.integrations?.email?.provider || 'disabled',
    deliveryProvider: tenant?.settings?.integrations?.delivery?.provider || 'manual',
  }
}
