import { NextResponse } from 'next/server'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const tenant = await getTenantFromRequest(request)
  
  const brandName = tenant?.settings?.theme?.brand_name || tenant?.name || 'Store'
  const pwa = tenant?.settings?.pwa
  
  const manifest = {
    name: pwa?.app_name || brandName,
    short_name: pwa?.app_short_name || brandName,
    description: pwa?.app_description || tenant?.settings?.content?.hero?.subhead || `Shop at ${brandName}`,
    start_url: '/',
    display: 'standalone',
    background_color: pwa?.background_color || '#0a0a0a',
    theme_color: pwa?.theme_color || tenant?.settings?.theme?.colors?.accent || '#a855f7',
    orientation: 'portrait-primary',
    icons: [
      {
        src: tenant?.settings?.theme?.logo_url || '/favicon.ico',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: tenant?.settings?.theme?.logo_url || '/favicon.ico',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['shopping', 'lifestyle'],
    lang: 'en',
    dir: 'ltr'
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
