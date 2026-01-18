"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TenantContextValue, TenantSettings } from "@/types/tenant";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Context
   Provides tenant data to client components within the (platform) route group
   ═══════════════════════════════════════════════════════════════════════════ */

const defaultSettings: TenantSettings = {
  theme: {
    brand_name: "OpenPeople",
    colors: {},
  },
  features: {},
  integrations: {},
  commerce: {
    currency: "USD",
  },
};

const defaultTenant: TenantContextValue = {
  id: "",
  slug: "",
  name: "OpenPeople",
  settings: defaultSettings,
  status: "active",
};

const TenantContext = createContext<TenantContextValue>(defaultTenant);

export function TenantProvider({
  children,
  tenant,
}: {
  children: ReactNode;
  tenant: TenantContextValue | null;
}) {
  const value = tenant ?? defaultTenant;

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

// Convenience hooks for common tenant data
export function useTenantId(): string {
  return useTenant().id;
}

export function useTenantSettings(): TenantSettings {
  return useTenant().settings;
}

export function useTenantFeatures() {
  return useTenant().settings.features ?? {};
}

export function useTenantTheme() {
  return useTenant().settings.theme ?? {};
}
