'use client'

import { useTenant } from '@/context/TenantContext'
import { formatPrice } from '@/lib/tenant'
import type { MenuCategory, MenuItem } from '@/types/tenant'

type MenuProps = {
  categories?: MenuCategory[]
  showPrices?: boolean
  currency?: string
  currencySymbol?: string
  disclaimer?: string
  showDietaryLegend?: boolean
}

const DietaryIcon = ({ type }: { type: string }) => {
  const icons: Record<string, { icon: string; label: string }> = {
    vegetarian: { icon: 'V', label: 'Vegetarian' },
    vegan: { icon: 'VG', label: 'Vegan' },
    'gluten-free': { icon: 'GF', label: 'Gluten-Free' },
    'dairy-free': { icon: 'DF', label: 'Dairy-Free' },
    'nut-free': { icon: 'NF', label: 'Nut-Free' },
    spicy: { icon: '🌶', label: 'Spicy' },
  }

  const info = icons[type]
  if (!info) return null

  return (
    <span className="menu-dietary-icon" title={info.label}>
      {info.icon}
    </span>
  )
}

const MenuItemComponent = ({
  item,
  showPrice,
  currencySymbol,
}: {
  item: MenuItem
  showPrice: boolean
  currencySymbol: string
}) => {
  if (item.available === false) return null

  return (
    <div className={`menu-item ${item.featured ? 'menu-item-featured' : ''}`}>
      <div className="menu-item-info">
        <div className="menu-item-name">
          {item.name}
          {item.featured && <span className="menu-featured-badge">featured</span>}
        </div>
        {item.description && (
          <div className="menu-item-description">{item.description}</div>
        )}
        {item.dietary && item.dietary.length > 0 && (
          <div className="menu-dietary">
            {item.dietary.map((d) => (
              <DietaryIcon key={d} type={d} />
            ))}
          </div>
        )}
      </div>
      {showPrice && (item.price || item.price_display) && (
        <div className="menu-item-price">
          {item.price_display || formatPrice(item.price!, 'CAD', currencySymbol)}
        </div>
      )}
    </div>
  )
}

const MenuCategoryComponent = ({
  category,
  showPrices,
  currencySymbol,
}: {
  category: MenuCategory
  showPrices: boolean
  currencySymbol: string
}) => {
  const availableItems = category.items
    .filter((item) => item.available !== false)
    .sort((a, b) => a.order - b.order)

  if (availableItems.length === 0) return null

  return (
    <div className="menu-category">
      <h3>{category.name}</h3>
      {category.description && (
        <p className="menu-category-description">{category.description}</p>
      )}
      {category.available_times && category.available_times.length > 0 && (
        <p className="menu-category-times">
          available: {category.available_times.join(', ')}
        </p>
      )}
      <div className="menu-items">
        {availableItems.map((item) => (
          <MenuItemComponent
            key={item.id}
            item={item}
            showPrice={showPrices}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </div>
  )
}

export function Menu({
  categories,
  showPrices = true,
  currencySymbol = '$',
  disclaimer,
  showDietaryLegend = true,
}: MenuProps) {
  const { settings } = useTenant()
  
  // Use settings if props not provided
  const menuConfig = settings?.menu
  const displayCategories = categories || menuConfig?.categories || []
  const displayShowPrices = showPrices && (menuConfig?.show_prices !== false)
  const displaySymbol = currencySymbol || menuConfig?.currency_symbol || '$'
  const displayDisclaimer = disclaimer || menuConfig?.disclaimer
  const displayLegend = showDietaryLegend && (menuConfig?.dietary_legend !== false)

  const sortedCategories = [...displayCategories].sort((a, b) => a.order - b.order)

  if (sortedCategories.length === 0) {
    return (
      <div className="menu-section">
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          menu coming soon
        </p>
      </div>
    )
  }

  return (
    <div className="menu-section">
      {sortedCategories.map((category) => (
        <MenuCategoryComponent
          key={category.id}
          category={category}
          showPrices={displayShowPrices}
          currencySymbol={displaySymbol}
        />
      ))}

      {displayDisclaimer && (
        <p className="menu-disclaimer" style={{ marginTop: 'var(--space-lg)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          {displayDisclaimer}
        </p>
      )}

      {displayLegend && (
        <div className="menu-legend" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', borderTop: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>dietary key:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem' }}>
            <span><DietaryIcon type="vegetarian" /> vegetarian</span>
            <span><DietaryIcon type="vegan" /> vegan</span>
            <span><DietaryIcon type="gluten-free" /> gluten-free</span>
            <span><DietaryIcon type="dairy-free" /> dairy-free</span>
            <span><DietaryIcon type="nut-free" /> nut-free</span>
            <span><DietaryIcon type="spicy" /> spicy</span>
          </div>
        </div>
      )}
    </div>
  )
}
