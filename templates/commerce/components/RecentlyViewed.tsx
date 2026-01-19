'use client'

import { useState, useEffect } from 'react'
import ProductCard, { ProductCardData } from '../../../components/ui/ProductCard'

interface RecentProduct {
  id: string
  viewed_at: string
  product: {
    id: string
    name: string
    brand: string
    slug: string
    primary_image: string | null
    lowest_price_cents: number | null
    in_stock: boolean
  }
}

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        const response = await fetch('/api/recently-viewed')
        if (response.ok) {
          const data = await response.json()
          setItems(data.items || [])
        }
      } catch (error) {
        console.error('Error fetching recently viewed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentlyViewed()
  }, [])

  if (loading || items.length === 0) {
    return null
  }

  // Map to ProductCardData format
  const products: ProductCardData[] = items.map(item => ({
    id: item.product.id,
    name: item.product.name,
    brand: item.product.brand,
    slug: item.product.slug,
    lowest_price_cents: item.product.lowest_price_cents || 0,
    primary_image: item.product.primary_image,
  }))

  return (
    <section className="py-12 md:py-16 border-t border-[var(--border-primary)]">
      <div className="container">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 md:mb-8">Recently Viewed</h2>
        
        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {products.slice(0, 4).map(product => (
            <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
              <ProductCard 
                product={product} 
                size="small"
                compact
                showWishlist={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
