'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { RestaurantSettings, RestaurantFeatureFlags } from '@/types/tenant'

type TenantContextValue = {
  id: string
  slug: string
  name: string
  settings: RestaurantSettings
  features: RestaurantFeatureFlags
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({
  children,
  tenant,
}: {
  children: ReactNode
  tenant: TenantContextValue
}) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    // Return default values for development/preview
    return {
      id: 'preview',
      slug: 'preview',
      name: 'Restaurant',
      settings: {} as RestaurantSettings,
      features: {} as RestaurantFeatureFlags,
    }
  }
  return context
}
