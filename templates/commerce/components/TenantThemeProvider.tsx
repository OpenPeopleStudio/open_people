'use client'

import { useEffect } from 'react'
import { useTenant } from '@/context/TenantContext'
import { generateThemeCSS } from '@/lib/themeProvider'

/**
 * Client component that injects tenant theme CSS variables
 */
export function TenantThemeProvider() {
  const tenant = useTenant()

  useEffect(() => {
    const css = generateThemeCSS(tenant)
    
    if (!css) {
      return
    }

    // Remove existing tenant theme style
    const existingStyle = document.getElementById('tenant-theme')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Inject new theme CSS
    const style = document.createElement('style')
    style.id = 'tenant-theme'
    style.textContent = css
    document.head.appendChild(style)

    return () => {
      const styleToRemove = document.getElementById('tenant-theme')
      if (styleToRemove) {
        styleToRemove.remove()
      }
    }
  }, [tenant])

  return null
}
