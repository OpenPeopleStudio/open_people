'use client'

import { useEffect, type ReactNode } from 'react'
import { useTenant } from '@/context/TenantContext'

/**
 * Injects CSS custom properties based on tenant theme settings
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useTenant()
  const colors = settings?.theme?.colors
  const typography = settings?.theme?.typography

  useEffect(() => {
    const root = document.documentElement

    // Color variables
    if (colors?.bg_primary) root.style.setProperty('--color-bg', colors.bg_primary)
    if (colors?.bg_secondary) root.style.setProperty('--color-bg-secondary', colors.bg_secondary)
    if (colors?.text_primary) root.style.setProperty('--color-text-primary', colors.text_primary)
    if (colors?.text_secondary) root.style.setProperty('--color-text-secondary', colors.text_secondary)
    if (colors?.text_muted) root.style.setProperty('--color-text-muted', colors.text_muted)
    if (colors?.accent) root.style.setProperty('--color-accent', colors.accent)
    if (colors?.accent_hover) root.style.setProperty('--color-accent-hover', colors.accent_hover)
    if (colors?.border) root.style.setProperty('--color-border', colors.border)
    if (colors?.success) root.style.setProperty('--color-success', colors.success)
    if (colors?.error) root.style.setProperty('--color-error', colors.error)

    // Typography variables
    if (typography?.font_primary) root.style.setProperty('--font-primary', typography.font_primary)
    if (typography?.font_display) root.style.setProperty('--font-display', typography.font_display)
    if (typography?.text_transform) root.style.setProperty('--text-transform', typography.text_transform)
    if (typography?.base_size) root.style.setProperty('--font-size-base', typography.base_size)

    // Cleanup on unmount
    return () => {
      const properties = [
        '--color-bg', '--color-bg-secondary', '--color-text-primary', '--color-text-secondary',
        '--color-text-muted', '--color-accent', '--color-accent-hover', '--color-border',
        '--color-success', '--color-error', '--font-primary', '--font-display',
        '--text-transform', '--font-size-base'
      ]
      properties.forEach(prop => root.style.removeProperty(prop))
    }
  }, [colors, typography])

  return <>{children}</>
}
