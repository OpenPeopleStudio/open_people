import type { Metadata } from 'next'
import { TenantProvider } from '@/context/TenantContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { getRestaurantSettings } from '@/lib/tenant'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getRestaurantSettings()
  const seo = tenant?.settings?.seo
  const theme = tenant?.settings?.theme

  return {
    title: seo?.title || theme?.name || 'Restaurant',
    description: seo?.description || theme?.tagline || 'Welcome to our restaurant',
    openGraph: {
      title: seo?.title || theme?.name,
      description: seo?.description || theme?.tagline,
      images: theme?.og_image_url ? [theme.og_image_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.title || theme?.name,
      description: seo?.description || theme?.tagline,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getRestaurantSettings()

  return (
    <html lang="en">
      <head>
        {tenant?.settings?.theme?.favicon_url && (
          <link rel="icon" href={tenant.settings.theme.favicon_url} />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js-enabled');`,
          }}
        />
      </head>
      <body>
        <TenantProvider
          tenant={{
            id: tenant?.id || 'default',
            slug: tenant?.slug || 'default',
            name: tenant?.name || 'Restaurant',
            settings: tenant?.settings || {},
            features: tenant?.settings?.features || {},
          }}
        >
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </TenantProvider>
      </body>
    </html>
  )
}
