'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '../../../../components/ui/Button'
import Surface from '../../../../components/ui/Surface'

interface NormalizedSneaker {
  brand: string
  model: string
  colorway: string
  sku: string | null
  releaseDate: string | null
  retailPriceCents: number | null
  externalImageUrl: string | null
  externalId: string | null
  source: string
}

interface ImportPreview {
  sneaker: NormalizedSneaker
  matchesExisting: boolean
  existingProductId?: string
}

interface ApiStatus {
  provider: string
  configured: boolean
  cacheSize: number
  features: {
    search: boolean
    marketData: boolean
    manualImport: boolean
  }
  documentation?: string
}

export default function SneakerSearchPage() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ImportPreview[]>([])
  const [cached, setCached] = useState(false)
  const [importing, setImporting] = useState<Record<string, boolean>>({})
  const [imported, setImported] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/sneaker-api/status')
      if (response.ok) {
        setApiStatus(await response.json())
      }
    } catch (e) {
      console.error('Failed to fetch API status:', e)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setSearching(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/admin/sneaker-api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 12 })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Search failed')
      }

      const data = await response.json()
      setResults(data.previews)
      setCached(data.cached)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleImport = async (preview: ImportPreview) => {
    const key = preview.sneaker.sku || preview.sneaker.externalId || preview.sneaker.model
    setImporting(prev => ({ ...prev, [key]: true }))

    try {
      const response = await fetch('/api/admin/sneaker-api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sneaker: preview.sneaker })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImported(prev => ({ ...prev, [key]: data.productId }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(prev => ({ ...prev, [key]: false }))
    }
  }

  const formatPrice = (cents: number | null) => {
    if (!cents) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
          ← Back to Admin
        </Link>
        <h1 className="text-2xl font-bold mt-2">Sneaker Database Search</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Search for sneakers and import them to your inventory.
        </p>
      </div>

      {/* API Status */}
      {apiStatus && (
        <Surface padding="sm" className="mb-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${apiStatus.configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-[var(--text-muted)]">
                Provider: <span className="text-[var(--text-primary)]">{apiStatus.provider}</span>
              </span>
            </div>
            {!apiStatus.configured && apiStatus.documentation && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {apiStatus.documentation}
              </span>
            )}
          </div>
        </Surface>
      )}

      {/* Search Form */}
      <Surface padding="lg" className="mb-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch() }}>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder='Search sneakers... (e.g., "Jordan 1 Bred" or "555088-001")'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-lg"
              disabled={searching}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={searching || !query.trim()}
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>
        
        {cached && (
          <p className="text-sm text-[var(--text-muted)] mt-2">
            ⚡ Results from cache
          </p>
        )}
      </Surface>

      {/* Error */}
      {error && (
        <Surface padding="md" className="mb-6 bg-red-500/10 border-red-500/30">
          <p className="text-red-500">{error}</p>
        </Surface>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((preview, i) => {
            const sneaker = preview.sneaker
            const key = sneaker.sku || sneaker.externalId || `${sneaker.brand}-${sneaker.model}-${i}`
            const isImporting = importing[key]
            const wasImported = imported[key]

            return (
              <Surface key={key} padding="md" className="flex flex-col">
                {/* Image */}
                <div className="relative w-full h-40 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden mb-4">
                  {sneaker.externalImageUrl ? (
                    <Image
                      src={sneaker.externalImageUrl}
                      alt={`${sneaker.brand} ${sneaker.model}`}
                      fill
                      className="object-contain p-2"
                      unoptimized
                      onError={(e) => {
                        // Fallback on error
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                    {sneaker.brand}
                  </p>
                  <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2">
                    {sneaker.model}
                  </h3>
                  {sneaker.colorway && (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-1">
                      {sneaker.colorway}
                    </p>
                  )}
                  
                  <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
                    {sneaker.sku && (
                      <p>SKU: <span className="font-mono">{sneaker.sku}</span></p>
                    )}
                    {sneaker.releaseDate && (
                      <p>Released: {new Date(sneaker.releaseDate).toLocaleDateString()}</p>
                    )}
                    {sneaker.retailPriceCents && (
                      <p>Retail: {formatPrice(sneaker.retailPriceCents)}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                  {wasImported ? (
                    <Link
                      href={`/admin/products/${wasImported}`}
                      className="block text-center text-sm text-green-500 hover:text-green-400"
                    >
                      ✓ Imported — View Product
                    </Link>
                  ) : preview.matchesExisting ? (
                    <Link
                      href={`/admin/products/${preview.existingProductId}`}
                      className="block text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      Already exists — View
                    </Link>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleImport(preview)}
                      disabled={isImporting}
                    >
                      {isImporting ? 'Importing...' : 'Add to Inventory'}
                    </Button>
                  )}
                </div>
              </Surface>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!searching && results.length === 0 && query && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p>No results found for &quot;{query}&quot;</p>
          <p className="text-sm mt-2">Try a different search term or SKU</p>
        </div>
      )}

      {/* Manual import reminder */}
      <Surface padding="md" className="mt-8">
        <h3 className="font-semibold mb-2">Manual Import</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Can&apos;t find what you&apos;re looking for? You can always{' '}
          <Link href="/admin/products/new" className="text-[var(--accent)] hover:underline">
            add products manually
          </Link>
          . The site works fine without the sneaker API.
        </p>
      </Surface>
    </div>
  )
}
