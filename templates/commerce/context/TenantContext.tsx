'use client'

import React, { createContext, useContext, useMemo } from 'react'
import type { TenantContextValue, TenantSettings, TenantThemeColors, TenantFeatureFlags } from '@/types/tenant'

const defaultSettings: TenantSettings = {
  theme: {
    brand_name: '709exclusive',
    // Colors now default to CSS variables in globals.css
    colors: undefined,
  },
  features: {
    drops: true,
    wishlist: true,
    messages: true,
    e2e_encryption: true,
    crypto_payments: true,
    local_delivery: true,
    pickup: true,
    admin: true,
    consignments: true,
  },
}

type TenantContextShape = TenantContextValue & {
  settings: TenantSettings
  featureFlags: TenantFeatureFlags
}

const TenantContext = createContext<TenantContextShape | null>(null)

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantContextValue | null
  children: React.ReactNode
}) {
  const merged = useMemo(() => {
    const settings = {
      ...defaultSettings,
      ...tenant?.settings,
      theme: {
        ...defaultSettings.theme,
        ...tenant?.settings?.theme,
        colors: {
          ...defaultSettings.theme?.colors,
          ...tenant?.settings?.theme?.colors,
        },
      },
      features: {
        ...defaultSettings.features,
        ...tenant?.settings?.features,
      },
    } as TenantSettings

    return {
      id: tenant?.id || 'default',
      slug: tenant?.slug || 'default',
      name: tenant?.name || 'Company Store',
      primary_domain: tenant?.primary_domain,
      status: tenant?.status || 'active',
      settings,
      featureFlags: settings.features || {},
    }
  }, [tenant])

  return <TenantContext.Provider value={merged}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

