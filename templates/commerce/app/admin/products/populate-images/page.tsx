'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '../../../../../components/ui/Button'
import Surface from '../../../../../components/ui/Surface'

interface ImageStatus {
  total: number
  withExternalImages: number
  withUploadedImages: number
  withoutImages: number
  byBrand: Record<string, number>
}

interface ProcessResult {
  id: string
  name: string
  success: boolean
  imageUrl?: string
}

interface BatchResult {
  complete: boolean
  processed: number
  updated: number
  remaining: number
  nextOffset: number
  results: ProcessResult[]
}

export default function PopulateImagesPage() {
  const [status, setStatus] = useState<ImageStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ProcessResult[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/products/populate-images')
      if (response.ok) {
        setStatus(await response.json())
      }
    } catch (e) {
      console.error('Failed to fetch status:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const processNextBatch = useCallback(async (offset: number): Promise<BatchResult | null> => {
    try {
      const response = await fetch('/api/admin/products/populate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brand: selectedBrand || undefined,
          offset 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process batch')
      }

      return await response.json()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Processing failed')
      return null
    }
  }, [selectedBrand])

  const startProcessing = async () => {
    setProcessing(true)
    setError(null)
    setResults([])
    setProgress(0)

    let offset = 0
    let totalProcessed = 0
    const allResults: ProcessResult[] = []

    while (true) {
      const batch = await processNextBatch(offset)
      
      if (!batch) {
        break
      }

      totalProcessed += batch.processed
      allResults.push(...batch.results)
      setResults([...allResults])

      // Calculate progress
      if (status) {
        const progressPct = Math.min(100, Math.round(
          (totalProcessed / status.withoutImages) * 100
        ))
        setProgress(progressPct)
      }

      if (batch.complete || batch.processed === 0) {
        break
      }

      offset = batch.nextOffset

      // Small delay between batches
      await new Promise(r => setTimeout(r, 500))
    }

    setProcessing(false)
    fetchStatus() // Refresh status
  }

  const sortedBrands = status?.byBrand 
    ? Object.entries(status.byBrand).sort((a, b) => b[1] - a[1])
    : []

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Populate Product Images</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-[var(--bg-secondary)] rounded-lg" />
          <div className="h-48 bg-[var(--bg-secondary)] rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-bold mt-2">Populate Product Images</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Automatically find and add images for products using the sneaker API.
        </p>
      </div>

      {/* Status Overview */}
      <Surface padding="lg" className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Image Status</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-[var(--bg-tertiary)]">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{status?.total || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">Total Products</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-500">{status?.withExternalImages || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">With External Images</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-500">{status?.withUploadedImages || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">With Uploaded Images</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-500">{status?.withoutImages || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">Need Images</p>
          </div>
        </div>

        {/* Progress bar */}
        {processing && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--text-muted)]">Processing...</span>
              <span className="text-[var(--text-muted)]">{progress}%</span>
            </div>
            <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Surface>

      {/* Brand Filter */}
      {sortedBrands.length > 0 && (
        <Surface padding="md" className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Filter by Brand (products needing images)</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBrand('')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedBrand === '' 
                  ? 'bg-[var(--accent)] text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              All ({status?.withoutImages})
            </button>
            {sortedBrands.map(([brand, count]) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedBrand === brand 
                    ? 'bg-[var(--accent)] text-white' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {brand} ({count})
              </button>
            ))}
          </div>
        </Surface>
      )}

      {/* Action Button */}
      <Surface padding="md" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Start Auto-Population</h3>
            <p className="text-sm text-[var(--text-muted)]">
              This will search the sneaker API for images and update your products.
              {selectedBrand && ` Only ${selectedBrand} products will be processed.`}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={startProcessing}
            disabled={processing || (status?.withoutImages || 0) === 0}
          >
            {processing ? 'Processing...' : 'Start'}
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </Surface>

      {/* Results */}
      {results.length > 0 && (
        <Surface padding="md">
          <h3 className="font-semibold mb-4">
            Results ({results.filter(r => r.success).length} of {results.length} found)
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  result.success 
                    ? 'bg-green-500/10' 
                    : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                {result.success && result.imageUrl ? (
                  <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={result.imageUrl}
                      alt={result.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-[var(--text-muted)] text-xs">N/A</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {result.name}
                  </p>
                  <p className={`text-xs ${result.success ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                    {result.success ? '✓ Image found' : 'No image found'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}

      {/* Tips */}
      <Surface padding="md" className="mt-6">
        <h3 className="font-semibold mb-2">Tips</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          <li>• The sneaker API works best for popular releases and known colorways</li>
          <li>• Products not found can be manually added via <Link href="/admin/models/bulk-images" className="text-[var(--accent)] hover:underline">Bulk Image Import</Link></li>
          <li>• Images are stored as external URLs - they&apos;re not downloaded to your storage</li>
          <li>• Rate limits may slow down processing - be patient with large catalogs</li>
        </ul>
      </Surface>
    </div>
  )
}
