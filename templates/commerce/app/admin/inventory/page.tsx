'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  brand: string
  slug: string
  external_image_url: string | null
  created_at: string
}

interface Variant {
  id: string
  product_id: string
  sku: string
  size: string | null
  condition_code: string
  price_cents: number
  stock: number
  reserved: number
}

interface ProductWithVariant extends Product {
  variant: Variant | null
  total_stock: number
  available: number
}

interface SneakerResult {
  name: string
  brand: string
  imageUrl: string | null
  sku: string | null
  colorway?: string
  retailPrice: number | null
  releaseDate?: string | null
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductWithVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('in_stock')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ stock: number; price: number }>({ stock: 0, price: 0 })
  const [saving, setSaving] = useState(false)
  
  // Sneaker API lookup state
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResults, setLookupResults] = useState<SneakerResult[]>([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SneakerResult | null>(null)
  const lookupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  // Auto-search sneaker API
  useEffect(() => {
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current)
    }
    
    if (lookupQuery.length < 3) {
      setLookupResults([])
      return
    }
    
    lookupTimeoutRef.current = setTimeout(() => {
      searchSneakerAPI(lookupQuery)
    }, 500)
    
    return () => {
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current)
      }
    }
  }, [lookupQuery])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/admin/inventory/all')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchSneakerAPI = async (query: string) => {
    setLookupLoading(true)
    try {
      const response = await fetch(`/api/admin/sneaker-api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setLookupResults(data.results || [])
      }
    } catch (error) {
      console.error('Sneaker API search error:', error)
    } finally {
      setLookupLoading(false)
    }
  }

  const addFromLookup = async (sneaker: SneakerResult) => {
    setSelectedResult(sneaker)
  }

  const confirmAddFromLookup = async (size: string, price: number, stock: number) => {
    if (!selectedResult) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedResult.name,
          brand: selectedResult.brand,
          size,
          condition: 'DS',
          priceCents: Math.round(price * 100),
          stock,
          imageUrl: selectedResult.imageUrl
        })
      })
      
      if (response.ok) {
        await fetchInventory()
        setSelectedResult(null)
        setLookupOpen(false)
        setLookupQuery('')
        setLookupResults([])
      }
    } catch (error) {
      console.error('Error adding from lookup:', error)
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (product: ProductWithVariant) => {
    setEditingId(product.id)
    setEditValues({
      stock: product.variant?.stock || 0,
      price: (product.variant?.price_cents || 0) / 100
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({ stock: 0, price: 0 })
  }

  const saveEdit = async (product: ProductWithVariant) => {
    if (!product.variant) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/admin/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: product.variant.id,
          stock: editValues.stock,
          priceCents: Math.round(editValues.price * 100)
        })
      })

      if (response.ok) {
        await fetchInventory()
        setEditingId(null)
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const quickStockAdjust = async (product: ProductWithVariant, delta: number) => {
    if (!product.variant) return
    
    const newStock = Math.max(0, (product.variant.stock || 0) + delta)
    
    try {
      await fetch('/api/admin/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: product.variant.id,
          stock: newStock
        })
      })
      await fetchInventory()
    } catch (error) {
      console.error('Error adjusting stock:', error)
    }
  }

  // Filter and search
  const filteredProducts = products.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) {
        return false
      }
    }
    if (filter === 'in_stock' && p.available <= 0) return false
    if (filter === 'out_of_stock' && p.available > 0) return false
    return true
  })

  // Stats
  const totalProducts = products.length
  const inStockCount = products.filter(p => p.available > 0).length
  const outOfStockCount = products.filter(p => p.available <= 0).length
  const totalUnits = products.reduce((sum, p) => sum + p.total_stock, 0)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {totalProducts} products • {totalUnits} total units
          </p>
        </div>
        <Link 
          href="/admin/inventory/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Shoe
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-3 md:p-4 rounded-xl border transition-all ${
            filter === 'all' 
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]' 
              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          <p className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{totalProducts}</p>
          <p className="text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-wider">All</p>
        </button>
        <button
          onClick={() => setFilter('in_stock')}
          className={`p-3 md:p-4 rounded-xl border transition-all ${
            filter === 'in_stock' 
              ? 'bg-[var(--success)]/10 border-[var(--success)]' 
              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          <p className="text-xl md:text-2xl font-bold text-[var(--success)]">{inStockCount}</p>
          <p className="text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-wider">In Stock</p>
        </button>
        <button
          onClick={() => setFilter('out_of_stock')}
          className={`p-3 md:p-4 rounded-xl border transition-all ${
            filter === 'out_of_stock' 
              ? 'bg-[var(--error)]/10 border-[var(--error)]' 
              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
          }`}
        >
          <p className="text-xl md:text-2xl font-bold text-[var(--error)]">{outOfStockCount}</p>
          <p className="text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-wider">Out</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or brand..."
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Product List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[var(--text-muted)]">
              {search ? `No products matching "${search}"` : 'No products found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-primary)]">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                {editingId === product.id ? (
                  // Edit Mode - Full Width
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
                        {product.external_image_url ? (
                          <Image
                            src={product.external_image_url}
                            alt={product.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                            <SneakerIcon className="w-6 h-6 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{product.brand}</p>
                        <p className="font-medium text-[var(--text-primary)] truncate">{product.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-end gap-4 pl-0 md:pl-[72px]">
                      <div className="flex-1 min-w-[100px]">
                        <label className="block text-xs text-[var(--text-muted)] mb-1.5">Stock</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={editValues.stock}
                          onChange={(e) => setEditValues(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm text-center focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-xs text-[var(--text-muted)] mb-1.5">Price (CAD)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="1"
                            min="0"
                            value={editValues.price}
                            onChange={(e) => setEditValues(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            className="w-full pl-8 pr-3 py-2 min-h-[44px] rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm focus:border-[var(--accent)] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(product)}
                          disabled={saving}
                          className="px-4 py-2 rounded-lg bg-[var(--success)] hover:bg-[var(--success)]/90 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
                      {product.external_image_url ? (
                        <Image
                          src={product.external_image_url}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <SneakerIcon className="w-6 h-6 md:w-8 md:h-8 opacity-30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-wider">{product.brand}</p>
                      <p className="font-medium text-sm md:text-base text-[var(--text-primary)] truncate">{product.name}</p>
                      <div className="flex items-center gap-2 md:gap-3 mt-0.5 text-xs md:text-sm">
                        <span className="text-[var(--text-muted)]">
                          Size {product.variant?.size || '—'}
                        </span>
                        <span className="text-[var(--text-muted)]">•</span>
                        <span className={product.available > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                          {product.available > 0 ? `${product.available} in stock` : 'Out'}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right mr-2 md:mr-4">
                      <p className="text-lg md:text-xl font-bold text-[var(--text-primary)]">
                        ${((product.variant?.price_cents || 0) / 100).toFixed(0)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 md:gap-2">
                      {/* Quick Stock Buttons */}
                      <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg">
                        <button
                          onClick={() => quickStockAdjust(product, -1)}
                          disabled={product.available <= 0}
                          className="w-8 h-8 md:w-9 md:h-9 rounded-l-lg flex items-center justify-center text-[var(--error)] hover:bg-[var(--error)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 md:w-10 text-center text-sm font-semibold text-[var(--text-primary)] border-x border-[var(--border-primary)]">
                          {product.variant?.stock || 0}
                        </span>
                        <button
                          onClick={() => quickStockAdjust(product, 1)}
                          className="w-8 h-8 md:w-9 md:h-9 rounded-r-lg flex items-center justify-center text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => startEdit(product)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Sneaker Lookup Button */}
      <button
        onClick={() => setLookupOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent)]/30 hover:shadow-xl hover:shadow-[var(--accent)]/40 transition-all hover:scale-105 flex items-center justify-center z-40"
        title="Sneaker Lookup"
      >
        <SneakerIcon className="w-7 h-7 md:w-8 md:h-8" />
      </button>

      {/* Sneaker Lookup Modal */}
      {lookupOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60" onClick={() => { setLookupOpen(false); setSelectedResult(null) }}>
          <div 
            className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sneaker Lookup</h2>
                <button
                  onClick={() => { setLookupOpen(false); setSelectedResult(null) }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-3">Search by SKU, colorway, or model name</p>
              <div className="relative">
                <SneakerIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g., DZ5485-612, Chicago, Jordan 1..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                />
                {lookupLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Results or Add Form */}
            <div className="max-h-[60vh] overflow-y-auto">
              {selectedResult ? (
                <AddFromLookupForm 
                  sneaker={selectedResult} 
                  onConfirm={confirmAddFromLookup}
                  onCancel={() => setSelectedResult(null)}
                  saving={saving}
                />
              ) : lookupResults.length > 0 ? (
                <div className="divide-y divide-[var(--border-primary)]">
                  {lookupResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => addFromLookup(result)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                    >
                      <div className="w-16 h-16 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
                        {result.imageUrl ? (
                          <Image
                            src={result.imageUrl}
                            alt={result.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <SneakerIcon className="w-8 h-8 text-[var(--text-muted)] opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-muted)] uppercase">{result.brand}</p>
                        <p className="font-medium text-[var(--text-primary)] truncate">{result.name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                          {result.sku && <span>SKU: {result.sku}</span>}
                          {result.retailPrice && <span>• ${result.retailPrice}</span>}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : lookupQuery.length >= 3 && !lookupLoading ? (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  No results found for &ldquo;{lookupQuery}&rdquo;
                </div>
              ) : (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  Start typing to search...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Sneaker Icon Component
function SneakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M21 9.5c0-.5-.2-1-.5-1.3l-5-4c-.3-.3-.7-.4-1.1-.4H8c-.8 0-1.5.3-2 .9L3.1 8.1c-.7.8-1.1 1.8-1.1 2.9v3c0 1.7 1.3 3 3 3h14c1.1 0 2-.9 2-2v-5.5zM5 15c-.6 0-1-.4-1-1v-3c0-.5.2-1 .5-1.4l2.2-2.6H8l-2.5 3c-.3.4-.5.9-.5 1.4V14c0 .6.4 1 1 1h-.01L5 15zm14 0H8v-2.6l2.5-3h3l-2 2.4c-.3.4-.5.9-.5 1.4V15h8v-3c0-.3-.1-.6-.3-.8l-1.4-1.2H14l3.7 3c.2.2.3.5.3.8V15z"/>
    </svg>
  )
}

// Add from Lookup Form
function AddFromLookupForm({ 
  sneaker, 
  onConfirm, 
  onCancel,
  saving 
}: { 
  sneaker: SneakerResult
  onConfirm: (size: string, price: number, stock: number) => void
  onCancel: () => void
  saving: boolean
}) {
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  
  // Calculate suggested prices based on retail
  const retailPrice = sneaker.retailPrice
  const suggestedPrices = retailPrice ? {
    retail: retailPrice,
    markup10: Math.round(retailPrice * 1.1),
    markup20: Math.round(retailPrice * 1.2),
    markup30: Math.round(retailPrice * 1.3),
  } : null

  const applyPrice = (value: number) => {
    setPrice(value.toString())
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-primary)]">
        <div className="w-20 h-20 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
          {sneaker.imageUrl ? (
            <Image
              src={sneaker.imageUrl}
              alt={sneaker.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <SneakerIcon className="w-10 h-10 text-[var(--text-muted)] opacity-30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-muted)] uppercase">{sneaker.brand}</p>
          <p className="font-semibold text-[var(--text-primary)]">{sneaker.name}</p>
          {sneaker.sku && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">SKU: {sneaker.sku}</p>
          )}
        </div>
      </div>

      {/* Price Suggestions */}
      {suggestedPrices && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Suggested Prices</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPrice(suggestedPrices.retail)}
              className={`p-2 rounded-lg border text-center transition-all ${
                price === suggestedPrices.retail.toString()
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <p className="text-xs text-[var(--text-muted)]">Retail</p>
              <p className="font-semibold text-[var(--text-primary)]">${suggestedPrices.retail}</p>
            </button>
            <button
              type="button"
              onClick={() => applyPrice(suggestedPrices.markup10)}
              className={`p-2 rounded-lg border text-center transition-all ${
                price === suggestedPrices.markup10.toString()
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <p className="text-xs text-[var(--text-muted)]">+10%</p>
              <p className="font-semibold text-[var(--text-primary)]">${suggestedPrices.markup10}</p>
            </button>
            <button
              type="button"
              onClick={() => applyPrice(suggestedPrices.markup20)}
              className={`p-2 rounded-lg border text-center transition-all ${
                price === suggestedPrices.markup20.toString()
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <p className="text-xs text-[var(--text-muted)]">+20%</p>
              <p className="font-semibold text-[var(--text-primary)]">${suggestedPrices.markup20}</p>
            </button>
            <button
              type="button"
              onClick={() => applyPrice(suggestedPrices.markup30)}
              className={`p-2 rounded-lg border text-center transition-all ${
                price === suggestedPrices.markup30.toString()
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
              }`}
            >
              <p className="text-xs text-[var(--text-muted)]">+30%</p>
              <p className="font-semibold text-[var(--text-primary)]">${suggestedPrices.markup30}</p>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Size *</label>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder=""
            className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-center focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Your Price *</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={suggestedPrices ? suggestedPrices.retail.toString() : ''}
              className="w-full pl-7 pr-2 py-2.5 min-h-[44px] rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Stock</label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-center focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Show margin info if price is set */}
      {price && suggestedPrices && (
        <div className="text-center py-2 px-3 rounded-lg bg-[var(--bg-tertiary)]">
          <span className="text-xs text-[var(--text-muted)]">
            {parseFloat(price) > suggestedPrices.retail ? (
              <>Margin: <span className="text-[var(--success)] font-medium">+{Math.round(((parseFloat(price) - suggestedPrices.retail) / suggestedPrices.retail) * 100)}%</span> above retail</>
            ) : parseFloat(price) < suggestedPrices.retail ? (
              <>Margin: <span className="text-[var(--error)] font-medium">{Math.round(((parseFloat(price) - suggestedPrices.retail) / suggestedPrices.retail) * 100)}%</span> below retail</>
            ) : (
              <>Selling at <span className="font-medium">retail price</span></>
            )}
          </span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-primary)] transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onConfirm(size, parseFloat(price) || 0, parseInt(stock) || 1)}
          disabled={!size || !price || saving}
          className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add to Inventory'}
        </button>
      </div>
    </div>
  )
}
