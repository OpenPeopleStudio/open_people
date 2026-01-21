'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { TenantSettings } from '@/types/tenant';

interface TenantContextType {
  settings: TenantSettings | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  settings: null,
  loading: true,
  error: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch tenant settings');
        }
        const data = await response.json();
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <TenantContext.Provider value={{ settings, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}