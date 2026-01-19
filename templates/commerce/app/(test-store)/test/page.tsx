'use client'

import { useState, useEffect, Suspense, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTenant } from '@/context/TenantContext'

interface Product {
  id: string
  name: string
  brand: string
  slug: string
  lowest_price_cents: number
  primary_image: string | null
}

// Loading bar component
function LoadingBar() {
  return (
    <div className="col-span-full py-2">
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" style={{ width: '100%' }} />
      </div>
    </div>
  )
}

function TestStoreContent() {
  const { id: tenantId } = useTenant()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set('search', searchQuery)
        params.set('limit', '500') // Get all products
        
        const response = await fetch(`/api/shop?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [tenantId, searchQuery])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-3 py-4">
      {/* Search Results Header */}
      {searchQuery && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {products.length} results for &quot;{searchQuery}&quot;
          </p>
          <Link href="/test" className="text-sm text-gray-500 hover:text-gray-900">
            Clear
          </Link>
        </div>
      )}

      {/* Minimal Grid - Exactly like the screenshot */}
      {/* With loading bars every 4 rows (20 items for 5-column grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((product, index) => {
          // Calculate items per row based on grid (use 5 for lg screens as reference)
          const itemsPerSection = 20 // 4 rows × 5 columns
          const showLoadingBar = (index + 1) % itemsPerSection === 0 && index < products.length - 1
          
          return (
            <Fragment key={product.id}>
              <Link
                href={`/product/${product.slug}`}
                className="group block"
              >
                <div className="relative aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-200">
                  {product.primary_image ? (
                    <Image
                      src={product.primary_image}
                      alt={product.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      unoptimized
                    />
                  ) : (
                    /* Placeholder shoe silhouette for products without images */
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
                      <svg 
                        viewBox="0 0 100 60" 
                        className="w-full h-auto text-gray-300 group-hover:text-gray-400 transition-colors"
                        fill="currentColor"
                      >
                        {/* Shoe silhouette */}
                        <path d="M5 45 Q5 35 15 30 L25 28 Q35 25 45 25 L70 25 Q85 25 90 35 L95 45 Q95 50 90 52 L10 52 Q5 52 5 45 Z" />
                        <ellipse cx="20" cy="48" rx="8" ry="4" opacity="0.3" />
                        <ellipse cx="75" cy="48" rx="10" ry="5" opacity="0.3" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
              {showLoadingBar && <LoadingBar />}
            </Fragment>
          )
        })}
      </div>

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500">No products found</p>
        </div>
      )}

      {/* Floating Add Button - Like in the screenshot */}
      <div className="fixed bottom-6 right-6">
        <button className="w-14 h-14 bg-gray-800 hover:bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function TestStorePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-3 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <TestStoreContent />
    </Suspense>
  )
}
