'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProductCard, { ProductCardSkeleton, ProductCardData } from '../components/ui/ProductCard'
import Button from '../components/ui/Button'
import Surface from '../components/ui/Surface'
import { useTenant } from '../context/TenantContext'

interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  is_drop: boolean
  drop_ends_at: string | null
  created_at: string
  external_image_url: string | null
}

interface ProductImage {
  product_id: string
  url: string
  position: number
}

interface ProductVariant {
  product_id: string
  price_cents: number
  stock: number
  reserved: number
}

// Default featured keywords (can be overridden via tenant settings)
const DEFAULT_FEATURED_KEYWORDS = [
  'New Arrival',
  'Best Seller',
  'Limited Edition',
  'Featured',
  'Popular',
  'Sale'
]

export default function Home() {
  const router = useRouter()
  const { id: tenantId, settings } = useTenant()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [dropEmail, setDropEmail] = useState('')
  const [dropEmailStatus, setDropEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const authCheckedRef = useRef(false)
  const hero = settings?.content?.hero
  const featureCards = settings?.content?.features
  const brandName = settings?.theme?.brand_name || 'Shop'

  const handleDropSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dropEmail || dropEmailStatus === 'loading') return

    setDropEmailStatus('loading')
    try {
      // Try to save to drop_notifications table
      const { error } = await supabase
        .from('drop_notifications')
        .upsert({ 
          email: dropEmail.toLowerCase().trim(),
          tenant_id: tenantId,
          subscribed_at: new Date().toISOString()
        }, { onConflict: 'email,tenant_id' })

      if (error) {
        // Table might not exist yet - save to localStorage as backup
        console.warn('Drop notifications table not available, using localStorage')
        const stored = JSON.parse(localStorage.getItem('drop_signups') || '[]')
        stored.push({ email: dropEmail.toLowerCase().trim(), timestamp: new Date().toISOString() })
        localStorage.setItem('drop_signups', JSON.stringify(stored))
      }
      
      setDropEmailStatus('success')
      setDropEmail('')
    } catch (err) {
      console.error('Drop signup error:', err)
      setDropEmailStatus('error')
    }
  }

  useEffect(() => {
    // Check for auth hash fragment (from Supabase redirect)
    const hash = window.location.hash
    if (hash && hash.includes('access_token') && !authCheckedRef.current) {
      authCheckedRef.current = true
      
      const handleAuth = async () => {
        setIsProcessingAuth(true)
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const tokenType = params.get('type')

        if (tokenType === 'recovery') {
          router.push(`/reset-password#${hash.substring(1)}`)
          return
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (!error) {
            window.history.replaceState(null, '', window.location.pathname)
            router.push('/admin/products')
          } else {
            setIsProcessingAuth(false)
          }
        }
      }
      handleAuth()
      return
    }

    // Fetch 12 most popular products (based on curated keywords)
    const fetchProducts = async () => {
      // First get all products with stock
      let productsQuery = supabase
        .from('products')
        .select('id, name, slug, brand, description, is_drop, drop_ends_at, created_at, external_image_url')

      if (tenantId) {
        productsQuery = productsQuery.eq('tenant_id', tenantId)
      }

      const { data: allProducts } = await productsQuery

      if (allProducts && allProducts.length > 0) {
        // Fetch variants to check stock
        let variantsQuery = supabase
          .from('product_variants')
          .select('product_id, price_cents, stock, reserved')
          .in('product_id', allProducts.map(p => p.id))

        if (tenantId) {
          variantsQuery = variantsQuery.eq('tenant_id', tenantId)
        }

        const { data: variantsData } = await variantsQuery

        // Build maps for price and stock
        const priceMap: Record<string, number> = {}
        const stockMap: Record<string, number> = {}
        if (variantsData) {
          variantsData.forEach((v: ProductVariant) => {
            if (!priceMap[v.product_id] || v.price_cents < priceMap[v.product_id]) {
              priceMap[v.product_id] = v.price_cents
            }
            stockMap[v.product_id] = (stockMap[v.product_id] || 0) + (v.stock - v.reserved)
          })
        }

        // Filter to only products with stock
        const inStockProducts = allProducts.filter(p => (stockMap[p.id] || 0) > 0)

        // Score products by popularity keywords (configurable via tenant settings)
        const featuredKeywords = settings?.search?.featured_keywords || DEFAULT_FEATURED_KEYWORDS
        const scoredProducts = inStockProducts.map(product => {
          const nameAndBrand = `${product.name} ${product.brand || ''}`.toLowerCase()
          let score = 0
          featuredKeywords.forEach((keyword, index) => {
            if (nameAndBrand.includes(keyword.toLowerCase())) {
              // Higher score for earlier keywords (more popular)
              score += (featuredKeywords.length - index) * 10
            }
          })
          return { ...product, score }
        })

        // Sort by score (highest first), then by created_at for ties
        scoredProducts.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        // Take top 12
        const topProducts = scoredProducts.slice(0, 12)

        // Fetch primary images
        let imagesQuery = supabase
          .from('product_images')
          .select('product_id, url, position')
          .in('product_id', topProducts.map(p => p.id))
          .order('position')

        if (tenantId) {
          imagesQuery = imagesQuery.eq('tenant_id', tenantId)
        }

        const { data: imagesData } = await imagesQuery

        const imageMap: Record<string, string> = {}
        if (imagesData) {
          imagesData.forEach((img: ProductImage) => {
            if (!imageMap[img.product_id]) {
              imageMap[img.product_id] = img.url
            }
          })
        }

        // Map to ProductCardData
        const mappedProducts: ProductCardData[] = topProducts.map((product: Product & { score: number }) => ({
          id: product.id,
          name: product.name,
          brand: product.brand || '',
          slug: product.slug,
          lowest_price_cents: priceMap[product.id] || 0,
          primary_image: imageMap[product.id] || product.external_image_url || null,
          is_drop: product.is_drop,
          drop_ends_at: product.drop_ends_at,
          created_at: product.created_at,
        }))

        setProducts(mappedProducts)
      }

      setLoading(false)
    }

    fetchProducts()
  }, [router, tenantId])

  if (isProcessingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-transparent border-t-[var(--neon-magenta)] border-r-[var(--neon-cyan)] rounded-full animate-spin mx-auto mb-4 shadow-[0_0_30px_rgba(255,0,255,0.5)]"></div>
          <p className="text-[var(--text-secondary)] font-medium">Signing you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--neon-magenta)]/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--neon-cyan)]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container relative">
          <div className="max-w-4xl space-y-8">
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-gradient animate-pulse">
              {hero?.eyebrow || `Welcome to ${brandName}`}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-[1.05] tracking-tight">
              {hero?.headline || (
                <>
                  Quality products <span className="text-gradient">delivered to you</span>
                </>
              )}
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {hero?.subhead ||
                "Shop verified inventory, pay with card or crypto, and track every order in one place"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button href={hero?.primary_cta?.href || "/shop"} variant="primary">
                {hero?.primary_cta?.label || "Browse inventory"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
              <Button href={hero?.secondary_cta?.href || "/shop?sort=newest"} variant="secondary">
                {hero?.secondary_cta?.label || "New arrivals"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Most Popular */}
      <section className="py-16 md:py-24 flex-1">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold text-gradient mb-2">Featured</p>
              <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)]">
                Most popular
              </h2>
            </div>
            <Button href="/shop" variant="ghost">
              Shop all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] mb-2 text-lg font-semibold">No products available yet</p>
              <p className="text-sm text-[var(--text-muted)]">Check back soon for new arrivals</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Drops Notification Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-magenta)]/10 via-transparent to-[var(--neon-cyan)]/10 pointer-events-none" />
        
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--neon-magenta)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--neon-magenta)]"></span>
              </span>
              <span className="text-sm font-semibold text-gradient">Drops</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-4">
              Never miss a drop
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
              Get notified when we release new products, exclusive drops, and restocks. Be the first to know.
            </p>
            
            <form onSubmit={handleDropSignup} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={dropEmail}
                  onChange={(e) => setDropEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={dropEmailStatus === 'loading' || dropEmailStatus === 'success'}
                  className="w-full px-4 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-glow)] focus:ring-2 focus:ring-[var(--neon-magenta)]/20 transition-all disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={dropEmailStatus === 'loading' || dropEmailStatus === 'success'}
                className="px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] text-white shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {dropEmailStatus === 'loading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subscribing...
                  </>
                ) : dropEmailStatus === 'success' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Subscribed!
                  </>
                ) : (
                  'Notify me'
                )}
              </button>
            </form>
            
            {dropEmailStatus === 'error' && (
              <p className="mt-3 text-sm text-red-400">Something went wrong. Please try again.</p>
            )}
            
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 flex-1 relative overflow-hidden">
        {/* Background gradient - matching products section */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--neon-magenta)]/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--neon-cyan)]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 perspective-1000">
            {(featureCards && featureCards.length > 0 ? featureCards : [
              { 
                title: 'Local delivery', 
                description: "Same-day in St. John's with real-time order updates.",
                icon: 'delivery'
              },
              { 
                title: 'Pickup ready', 
                description: "Skip the wait and pick up in-store as soon as it's verified.",
                icon: 'pickup'
              },
              { 
                title: 'Card + crypto', 
                description: 'Pay with Stripe cards or NOWPayments crypto at checkout.',
                icon: 'payment'
              },
            ]).map((feature, index) => (
              <div 
                key={feature.title} 
                className="group relative rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-8 hover:border-[var(--border-glow)] transition-all duration-700 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:scale-105 hover:-translate-y-2"
                style={{ 
                  animation: `slideInStacked 0.8s ease-out ${index * 150}ms both`,
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Icon */}
                <div className="mb-6 relative">
                  {feature.icon === 'delivery' && (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <svg className="w-7 h-7" fill="none" stroke="url(#gradient1)" viewBox="0 0 24 24" strokeWidth={2}>
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--neon-magenta)" />
                            <stop offset="100%" stopColor="var(--neon-cyan)" />
                          </linearGradient>
                        </defs>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
                        <circle cx="8" cy="19" r="1.5" />
                        <circle cx="16" cy="19" r="1.5" />
                      </svg>
                    </div>
                  )}
                  {feature.icon === 'pickup' && (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <svg className="w-7 h-7" fill="none" stroke="url(#gradient2)" viewBox="0 0 24 24" strokeWidth={2}>
                        <defs>
                          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--neon-magenta)" />
                            <stop offset="100%" stopColor="var(--neon-cyan)" />
                          </linearGradient>
                        </defs>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2M3 7h18M7 11v10m10-10v10" />
                      </svg>
                    </div>
                  )}
                  {feature.icon === 'payment' && (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <div className="relative w-7 h-7">
                        {/* Credit Card */}
                        <svg className="w-6 h-6 absolute top-0 left-0" fill="none" stroke="url(#gradient3a)" viewBox="0 0 24 24" strokeWidth={2}>
                          <defs>
                            <linearGradient id="gradient3a" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="var(--neon-magenta)" />
                              <stop offset="100%" stopColor="var(--neon-cyan)" />
                            </linearGradient>
                          </defs>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        {/* Bitcoin Symbol */}
                        <svg className="w-4 h-4 absolute bottom-0 right-0" fill="url(#gradient3b)" viewBox="0 0 24 24">
                          <defs>
                            <linearGradient id="gradient3b" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="var(--neon-cyan)" />
                              <stop offset="100%" stopColor="var(--neon-magenta)" />
                            </linearGradient>
                          </defs>
                          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  {!['delivery', 'pickup', 'payment'].includes(feature.icon || '') && (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--neon-magenta)]/20 to-[var(--neon-cyan)]/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <svg className="w-7 h-7" fill="none" stroke="url(#gradient4)" viewBox="0 0 24 24" strokeWidth={2}>
                        <defs>
                          <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--neon-magenta)" />
                            <stop offset="100%" stopColor="var(--neon-cyan)" />
                          </linearGradient>
                        </defs>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Animated glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--neon-magenta)]/30 to-[var(--neon-cyan)]/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                </div>

                {/* Title */}
                <h3 className="font-black text-xl mb-3 bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] bg-clip-text text-transparent group-hover:from-[var(--neon-cyan)] group-hover:to-[var(--neon-magenta)] transition-all duration-700">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed group-hover:text-[var(--text-primary)] transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Hover border glow */}
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[var(--neon-magenta)]/20 transition-all duration-700 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Inline Styles for Animation */}
        <style jsx>{`
          @keyframes slideInStacked {
            0% {
              opacity: 0;
              transform: translateX(-100px) translateZ(-100px) rotateY(-20deg);
            }
            100% {
              opacity: 1;
              transform: translateX(0) translateZ(0) rotateY(0deg);
            }
          }

          .perspective-1000 {
            perspective: 1000px;
          }
        `}</style>
      </section>

      <Footer />
    </div>
  )
}
