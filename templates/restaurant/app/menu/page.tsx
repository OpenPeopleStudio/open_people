import { getRestaurantSettings } from '@/lib/tenant'
import { Menu } from '@/components/Menu'
import { Footer } from '@/components/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Menu',
}

export default async function MenuPage() {
  const tenant = await getRestaurantSettings()
  const settings = tenant?.settings
  const menu = settings?.menu

  return (
    <main>
      <header className="hero" style={{ minHeight: '40vh' }}>
        <nav className="site-nav">
          <Link href="/">home</Link>
          <Link href="/contact">contact</Link>
        </nav>
        <div className="hero-content">
          <h1>menu</h1>
          {menu?.enabled === false && (
            <p className="hero-tagline">coming soon</p>
          )}
        </div>
      </header>

      {menu?.enabled !== false && (
        <Menu
          categories={menu?.categories}
          showPrices={menu?.show_prices}
          currencySymbol={menu?.currency_symbol}
          disclaimer={menu?.disclaimer}
          showDietaryLegend={menu?.dietary_legend}
        />
      )}

      <Footer
        name={settings?.theme?.name}
        location={settings?.location}
        social={settings?.social}
        footerText={settings?.content?.footer_text}
      />
    </main>
  )
}
