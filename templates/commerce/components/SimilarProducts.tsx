'use client'

import { useState, useEffect } from 'react'
import ProductCard, { ProductCardData, ProductCardSkeleton } from '../../../components/ui/ProductCard'

interface SimilarProductsProps {
  productId: string
  brand: string
  category?: string
}

export default function SimilarProducts({ productId, brand, category }: SimilarProductsProps) {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const params = new URLSearchParams({
          excludeId: productId,
          brand,
          ...(category && { category }),
          limit: '4',
        })
        
        const response = await fetch(`/api/shop/similar?${params}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching similar products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [productId, brand, category])

  if (loading) {
    return (
      <section className="py-12 md:py-16 border-t border-[var(--border-primary)]">
        <div className="container">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16 border-t border-[var(--border-primary)]">
      <div className="container">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 md:mb-8">You May Also Like</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              compact 
              showWishlist={false}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
