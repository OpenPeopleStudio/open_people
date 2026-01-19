'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface SearchResult {
  name: string
  brand: string
  imageUrl: string | null
  sku: string | null
}

export default function AddShoePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  
  // Search mode
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedShoe, setSelectedShoe] = useState<SearchResult | null>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState('')
  const [condition, setCondition] = useState('DS')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [imageUrl, setImageUrl] = useState('')
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-search as user types
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchShoes(searchQuery)
    }, 500)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const searchShoes = async (query: string) => {
    setSearching(true)
    try {
      const response = await fetch(`/api/admin/sneaker-api/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const selectShoe = (shoe: SearchResult) => {
    setSelectedShoe(shoe)
    setName(shoe.name)
    setBrand(shoe.brand)
    setImageUrl(shoe.imageUrl || '')
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !brand || !size || !price) {
      setError('Please fill in all required fields')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          brand,
          size,
          condition,
          priceCents: Math.round(parseFloat(price) * 100),
          stock: parseInt(stock) || 1,
          imageUrl: imageUrl || null
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add shoe')
      }
      
      router.push('/admin/inventory')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shoe')
    } finally {
      setSaving(false)
    }
  }

  const clearSelection = () => {
    setSelectedShoe(null)
    setName('')
    setBrand('')
    setImageUrl('')
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/inventory" 
          className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Add New Shoe</h1>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('search')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            mode === 'search'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search Database
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
            mode === 'manual'
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Manual Entry
        </button>
      </div>

      {/* Search Mode */}
      {mode === 'search' && !selectedShoe && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Search for a shoe
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Jordan 1 Chicago, Yeezy 350..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-[var(--border-primary)] rounded-xl border border-[var(--border-primary)]">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectShoe(result)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                >
                  <div className="w-14 h-14 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
                    {result.imageUrl ? (
                      <Image
                        src={result.imageUrl}
                        alt={result.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                        <svg viewBox="0 0 100 60" className="w-6 h-6 opacity-30" fill="currentColor">
                          <path d="M5 45 Q5 35 15 30 L25 28 Q35 25 45 25 L70 25 Q85 25 90 35 L95 45 Q95 50 90 52 L10 52 Q5 52 5 45 Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-muted)] uppercase">{result.brand}</p>
                    <p className="font-medium text-[var(--text-primary)] truncate">{result.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searchQuery.length >= 3 && !searching && searchResults.length === 0 && (
            <p className="mt-4 text-sm text-[var(--text-muted)] text-center py-4">
              No results found. Try a different search or use manual entry.
            </p>
          )}
        </div>
      )}

      {/* Selected Shoe Preview */}
      {selectedShoe && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-[var(--bg-tertiary)] overflow-hidden flex-shrink-0">
              {selectedShoe.imageUrl ? (
                <Image
                  src={selectedShoe.imageUrl}
                  alt={selectedShoe.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                  <svg viewBox="0 0 100 60" className="w-8 h-8 opacity-30" fill="currentColor">
                    <path d="M5 45 Q5 35 15 30 L25 28 Q35 25 45 25 L70 25 Q85 25 90 35 L95 45 Q95 50 90 52 L10 52 Q5 52 5 45 Z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-muted)] uppercase">{selectedShoe.brand}</p>
              <p className="font-semibold text-[var(--text-primary)]">{selectedShoe.name}</p>
            </div>
            <button
              onClick={clearSelection}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manual Entry Fields (only show when not using search or in manual mode) */}
        {(mode === 'manual' || !selectedShoe) && mode === 'manual' && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Shoe Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Brand *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Nike, Jordan, Yeezy"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Air Jordan 1 High Chicago"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Image URL (optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Inventory Details */}
        {(selectedShoe || mode === 'manual') && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Inventory Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Size *
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g., 10, 10.5"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="DS">DS (Deadstock)</option>
                  <option value="VNDS">VNDS (Very Near DS)</option>
                  <option value="PADS">PADS (Pass as DS)</option>
                  <option value="USED">Used</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Price (CAD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder=""
                    required
                    className="w-full pl-9 pr-4 py-3 min-h-[44px] rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {/* Actions */}
        {(selectedShoe || mode === 'manual') && (
          <div className="flex gap-4">
            <Link href="/admin/inventory" className="flex-1">
              <button type="button" className="w-full py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-tertiary)] transition-colors">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
