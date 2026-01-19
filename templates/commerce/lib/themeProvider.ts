import type { TenantContextValue } from '@/types/tenant'

/**
 * Generate CSS custom properties from tenant theme settings
 */
export function generateThemeCSS(tenant: TenantContextValue | null): string {
  if (!tenant?.settings?.theme?.colors) {
    return ''
  }

  const colors = tenant.settings.theme.colors
  const vars: string[] = []

  // Map theme colors to CSS variables
  const colorMap: Record<string, string> = {
    bg_primary: '--bg-primary',
    bg_secondary: '--bg-secondary',
    bg_tertiary: '--bg-tertiary',
    bg_elevated: '--bg-elevated',
    text_primary: '--text-primary',
    text_secondary: '--text-secondary',
    text_muted: '--text-muted',
    accent: '--accent',
    accent_hover: '--accent-hover',
    accent_muted: '--accent-muted',
    accent_blue: '--accent-blue',
    accent_blue_hover: '--accent-blue-hover',
    accent_amber: '--accent-amber',
    accent_amber_hover: '--accent-amber-hover',
    border_primary: '--border-primary',
    border_secondary: '--border-secondary',
    success: '--success',
    warning: '--warning',
    error: '--error',
  }

  for (const [key, cssVar] of Object.entries(colorMap)) {
    const value = colors[key as keyof typeof colors]
    if (value) {
      vars.push(`${cssVar}: ${value};`)
    }
  }

  if (vars.length === 0) {
    return ''
  }

  return `:root { ${vars.join(' ')} }`
}

/**
 * Get logo URL with CDN-safe fallback
 */
export function getLogoUrl(tenant: TenantContextValue | null): string | null {
  return tenant?.settings?.theme?.logo_url || null
}

/**
 * Get brand name
 */
export function getBrandName(tenant: TenantContextValue | null): string {
  return tenant?.settings?.theme?.brand_name || tenant?.name || 'Store'
}

/**
 * Generate metadata for SEO
 */
export function generateTenantMetadata(tenant: TenantContextValue | null) {
  const brandName = getBrandName(tenant)
  
  return {
    title: brandName,
    description: tenant?.settings?.content?.hero?.subhead || `Shop authenticated products at ${brandName}`,
    openGraph: {
      title: brandName,
      description: tenant?.settings?.content?.hero?.subhead || `Shop authenticated products at ${brandName}`,
      siteName: brandName,
    },
  }
}
