'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import ProductCard, { ProductCardSkeleton, ProductCardData } from '../../../components/ui/ProductCard'
import FilterPill, { SizeButton, ConditionButton } from '../../../components/ui/FilterPill'

interface Product extends ProductCardData {
  category: string
  variants_count: number
}

interface Filters {
  search: string
  brands: string[]
  sizes: string[]
  conditions: string[]
  priceMin: string
  priceMax: string
  sort: 'newest' | 'price_low' | 'price_high' | 'popular'
  inStock: boolean
}

const SIZE_OPTIONS = ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14']
const CONDITION_OPTIONS = ['DS', 'VNDS', 'PADS', 'USED']

function ShopContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const compactSearchRef = useRef<HTMLInputElement>(null)
  const initialSearch = searchParams.get('search') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [filters, setFilters] = useState<Filters>({
    search: initialSearch,
    brands: [],
    sizes: [],
    conditions: [],
    priceMin: '',
    priceMax: '',
    sort: 'newest',
    inStock: true
  })

  // Update time periodically for drop countdowns
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Track scroll position for compact header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchBrands()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (filters.search) params.set('search', filters.search)
      if (filters.brands.length) params.set('brands', filters.brands.join(','))
      if (filters.sizes.length) params.set('sizes', filters.sizes.join(','))
      if (filters.conditions.length) params.set('conditions', filters.conditions.join(','))
      if (filters.priceMin) params.set('priceMin', filters.priceMin)
      if (filters.priceMax) params.set('priceMax', filters.priceMax)
      params.set('sort', filters.sort)
      if (filters.inStock) params.set('inStock', 'true')

      const response = await fetch(`/api/shop?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const debounce = setTimeout(fetchProducts, 300)
    return () => clearTimeout(debounce)
  }, [fetchProducts])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/shop/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }))
  }

  const toggleSize = (size: string) => {
    setFilters(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }))
  }

  const toggleCondition = (condition: string) => {
    setFilters(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      brands: [],
      sizes: [],
      conditions: [],
      priceMin: '',
      priceMax: '',
      sort: 'newest',
      inStock: true
    })
  }

  const activeFilterCount = filters.brands.length + filters.sizes.length + filters.conditions.length +
    (filters.priceMin ? 1 : 0) + (filters.priceMax ? 1 : 0)

  const clearSearch = () => {
    setFilters(prev => ({ ...prev, search: '' }))
    searchInputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-20 pb-24 md:pb-16">
        {/* Sticky Header - Switches between full and compact */}
        <div className={`sticky top-20 z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--glass-border)]' 
            : 'bg-[var(--bg-primary)] border-b border-[var(--border-primary)]'
        }`}>
          <div className="container py-4">
            {/* Compact Search Bar (when scrolled) */}
            <div className={`transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center w-48 md:w-64 bg-[var(--bg-secondary)]/80 rounded-full border border-[var(--glass-border)]">
                  <svg 
                    className="w-4 h-4 ml-3 text-[var(--text-muted)] flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={compactSearchRef}
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search..."
                    className="w-full bg-transparent px-2 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none text-sm"
                  />
                  {filters.search && (
                    <button
                      onClick={clearSearch}
                      className="p-1 mr-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`relative p-2 rounded-full transition-all flex-shrink-0 ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)]/80 border border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Full Search Bar (when at top) */}
            <div className={`transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}`}>
              <div className={`relative transition-all duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}>
                <div className={`flex items-center bg-[var(--bg-secondary)] rounded-2xl border-2 transition-all duration-200 ${
                  searchFocused 
                    ? 'border-[var(--accent)] shadow-[0_0_0_4px_rgba(225,6,0,0.1)]' 
                    : 'border-transparent'
                }`}>
                  <svg 
                    className={`w-5 h-5 ml-4 transition-colors ${searchFocused ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder={settings?.search?.placeholder || "Search products..."}
                    className="flex-1 bg-transparent px-3 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none text-base"
                  />
                  {filters.search && (
                    <button
                      onClick={clearSearch}
                      className="p-2 mr-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{activeFilterCount}</span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as Filters['sort'] }))}
                  className="px-4 py-2.5 rounded-full text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-0 focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                  <option value="price_low">Price: Low</option>
                  <option value="price_high">Price: High</option>
                </select>

                {/* Quick Brand Filters */}
                {brands.slice(0, 5).map(brand => (
                  <button
                    key={brand}
                    onClick={() => toggleBrand(brand)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      filters.brands.includes(brand)
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
            <div className="container py-6 space-y-6">
              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Brand</h3>
                  <div className="flex flex-wrap gap-2">
                    {brands.map(brand => (
                      <FilterPill
                        key={brand}
                        label={brand}
                        selected={filters.brands.includes(brand)}
                        onClick={() => toggleBrand(brand)}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Size (US)</h3>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map(size => (
                    <SizeButton
                      key={size}
                      label={size}
                      selected={filters.sizes.includes(size)}
                      onClick={() => toggleSize(size)}
                    />
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Condition</h3>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map(condition => (
                    <ConditionButton
                      key={condition}
                      label={condition}
                      selected={filters.conditions.includes(condition)}
                      onClick={() => toggleCondition(condition)}
                    />
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Price Range</h3>
                <div className="flex items-center gap-3 max-w-xs">
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={filters.priceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                      placeholder="Min"
                      className="w-full pl-8 pr-3 py-3 min-h-[44px] rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm"
                    />
                  </div>
                  <span className="text-[var(--text-muted)] flex-shrink-0">–</span>
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={filters.priceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                      placeholder="Max"
                      className="w-full pl-8 pr-3 py-3 min-h-[44px] rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="container pt-4 pb-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-[var(--text-primary)]">{products.length}</span> products
                  {filters.search && <span> for "{filters.search}"</span>}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Product Grid */}
        <div className="container">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(12)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No products found</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                {filters.search 
                  ? `We couldn't find anything matching "${filters.search}"`
                  : 'Try adjusting your filters to see more results'}
              </p>
              <button 
                onClick={clearFilters}
                className="px-6 py-3 rounded-full bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  currentTime={currentTime}
                  compact
                  showWishlist={false}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 pt-20 pb-24 md:pb-16">
          <div className="container pt-4">
            {/* Search skeleton */}
            <div className="h-14 bg-[var(--bg-secondary)] rounded-2xl mb-4 animate-pulse" />
            <div className="flex gap-3 mb-6">
              <div className="h-10 w-24 bg-[var(--bg-secondary)] rounded-full animate-pulse" />
              <div className="h-10 w-24 bg-[var(--bg-secondary)] rounded-full animate-pulse" />
              <div className="h-10 w-20 bg-[var(--bg-secondary)] rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(12)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}
