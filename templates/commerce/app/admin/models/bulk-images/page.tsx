'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '../../../../../components/ui/Button'
import Surface from '../../../../../components/ui/Surface'

interface ProductModel {
  id: string
  brand: string
  model: string
  slug: string
  hasImage?: boolean
}

export default function BulkImagesPage() {
  const [models, setModels] = useState<ProductModel[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, 'success' | 'error' | 'pending'>>({})
  const [filterBrand, setFilterBrand] = useState<string>('')
  const [showOnlyWithoutImages, setShowOnlyWithoutImages] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlChange = (modelId: string, url: string) => {
    setImageUrls(prev => ({ ...prev, [modelId]: url }))
  }

  const importSingleImage = async (modelId: string, imageUrl: string) => {
    if (!imageUrl.trim()) return false

    try {
      setResults(prev => ({ ...prev, [modelId]: 'pending' }))
      
      const response = await fetch('/api/admin/models/import-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          images: [imageUrl.trim()],
          source: 'bulk-import'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.imported > 0) {
          setResults(prev => ({ ...prev, [modelId]: 'success' }))
          return true
        }
      }
      setResults(prev => ({ ...prev, [modelId]: 'error' }))
      return false
    } catch (error) {
      setResults(prev => ({ ...prev, [modelId]: 'error' }))
      return false
    }
  }

  const importAllImages = async () => {
    setImporting(true)
    const urlsToImport = Object.entries(imageUrls).filter(([_, url]) => url.trim())
    
    let success = 0
    for (const [modelId, url] of urlsToImport) {
      const result = await importSingleImage(modelId, url)
      if (result) success++
      // Small delay between imports
      await new Promise(r => setTimeout(r, 500))
    }

    setImporting(false)
    alert(`Imported ${success} of ${urlsToImport.length} images`)
    fetchModels() // Refresh to update hasImage status
  }

  const brands = [...new Set(models.map(m => m.brand))].sort()
  
  const filteredModels = models.filter(m => {
    if (filterBrand && m.brand !== filterBrand) return false
    if (showOnlyWithoutImages && m.hasImage) return false
    return true
  })

  const urlCount = Object.values(imageUrls).filter(u => u.trim()).length

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Bulk Image Import</h1>
        <div className="animate-pulse space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-[var(--bg-secondary)] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/admin/models" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
          ← Back to Models
        </Link>
        <h1 className="text-2xl font-bold mt-2">Bulk Image Import</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Paste image URLs for each model. Images will be downloaded and stored in your catalog.
        </p>
      </div>

      {/* Filters */}
      <Surface padding="md" className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm text-[var(--text-muted)] block mb-1">Filter by Brand</label>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showOnlyWithoutImages"
              checked={showOnlyWithoutImages}
              onChange={(e) => setShowOnlyWithoutImages(e.target.checked)}
            />
            <label htmlFor="showOnlyWithoutImages" className="text-sm">
              Only show models without images
            </label>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">
              {urlCount} URLs ready to import
            </span>
            <Button
              onClick={importAllImages}
              disabled={importing || urlCount === 0}
              variant="primary"
            >
              {importing ? 'Importing...' : `Import ${urlCount} Images`}
            </Button>
          </div>
        </div>
      </Surface>

      {/* Models List */}
      <div className="space-y-2">
        {filteredModels.map(model => (
          <div 
            key={model.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
              results[model.id] === 'success' 
                ? 'bg-green-500/10 border-green-500/30'
                : results[model.id] === 'error'
                ? 'bg-red-500/10 border-red-500/30'
                : results[model.id] === 'pending'
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-[var(--bg-secondary)] border-[var(--border-primary)]'
            }`}
          >
            {/* Model Info */}
            <div className="w-48 flex-shrink-0">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                {model.brand}
              </p>
              <p className="font-medium text-[var(--text-primary)] truncate">
                {model.model}
              </p>
            </div>

            {/* Image Preview (if URL entered) */}
            <div className="w-16 h-16 flex-shrink-0 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden">
              {imageUrls[model.id] ? (
                <Image
                  src={imageUrls[model.id]}
                  alt={model.model}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ''
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* URL Input */}
            <div className="flex-1">
              <input
                type="url"
                placeholder="Paste image URL..."
                value={imageUrls[model.id] || ''}
                onChange={(e) => handleUrlChange(model.id, e.target.value)}
                className="w-full text-sm"
                disabled={results[model.id] === 'success'}
              />
            </div>

            {/* Status */}
            <div className="w-24 flex-shrink-0 text-right">
              {results[model.id] === 'success' && (
                <span className="text-green-500 text-sm font-medium">✓ Done</span>
              )}
              {results[model.id] === 'error' && (
                <span className="text-red-500 text-sm font-medium">✗ Failed</span>
              )}
              {results[model.id] === 'pending' && (
                <span className="text-yellow-500 text-sm font-medium">Importing...</span>
              )}
              {!results[model.id] && model.hasImage && (
                <span className="text-[var(--text-muted)] text-sm">Has image</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          {showOnlyWithoutImages 
            ? 'All models have images! Uncheck the filter to see all.'
            : 'No models found matching the filter.'}
        </div>
      )}

      {/* Tips */}
      <Surface padding="md" className="mt-8">
        <h3 className="font-semibold mb-2">Tips for Finding Shoe Images</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          <li>• Search &quot;[brand] [model] product image white background&quot; on Google Images</li>
          <li>• Right-click images and select &quot;Copy image address&quot;</li>
          <li>• StockX, GOAT, and brand websites have high-quality product photos</li>
          <li>• Images are automatically downloaded and stored in your catalog</li>
        </ul>
      </Surface>
    </div>
  )
}
