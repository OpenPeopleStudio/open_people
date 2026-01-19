'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Badge from '../../../components/ui/Badge'

interface WishlistItem {
  id: string
  size_preference?: string
  condition_preference?: string
  created_at: string
  product: {
    id: string
    name: string
    brand: string
    slug: string
    primary_image: string | null
  }
  is_available: boolean
  lowest_price_cents: number
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/account/login'
        return
      }
      fetchWishlist()
    }
    checkAuth()
  }, [])

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      await fetch(`/api/wishlist?id=${itemId}`, { method: 'DELETE' })
      setItems(prev => prev.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          <nav className="mb-6">
            <Link href="/account" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              ← Back to Account
            </Link>
          </nav>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Wishlist</h1>
            <p className="text-[var(--text-secondary)] mt-1">{items.length} saved items</p>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] mb-2">Your wishlist is empty</p>
              <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                Save items you love and we&apos;ll notify you when they&apos;re back in stock.
              </p>
              <Link href="/shop" className="btn-primary">
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {items.map(item => (
                <div key={item.id} className="group relative">
                  <Link href={`/product/${item.product.slug}`} className="block">
                    {/* Image */}
                    <div className="relative aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden mb-3">
                      {item.product.primary_image ? (
                        <Image
                          src={item.product.primary_image}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-[var(--text-muted)] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Out of Stock Overlay */}
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="neutral">Out of Stock</Badge>
                        </div>
                      )}

                      {/* Saved Preferences */}
                      {(item.size_preference || item.condition_preference) && (
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {item.size_preference && (
                            <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium rounded">
                              Size {item.size_preference}
                            </span>
                          )}
                          {item.condition_preference && (
                            <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium rounded">
                              {item.condition_preference}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <p className="text-sm text-[var(--text-muted)]">{item.product.brand}</p>
                    <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                      {item.product.name}
                    </h3>
                    <p className="text-[var(--text-primary)] font-semibold mt-1">
                      {item.is_available 
                        ? `From $${(item.lowest_price_cents / 100).toFixed(0)}`
                        : 'Currently unavailable'
                      }
                    </p>
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--accent)]"
                    aria-label="Remove from wishlist"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
