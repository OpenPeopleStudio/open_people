'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Button from '../../../../../components/ui/Button'
import Surface from '../../../../../components/ui/Surface'

interface ModelImage {
  id: string
  url: string
  source: string
  is_primary: boolean
  position: number
  created_at: string
}

interface GoogleImageResult {
  imageUrl: string
  thumbnail: string
  width: number
  height: number
  sourcePage: string
}

export default function ModelImagesPage() {
  const params = useParams()
  const router = useRouter()
  const modelId = params.id as string

  const [model, setModel] = useState<{ id: string; brand: string; model: string } | null>(null)
  const [images, setImages] = useState<ModelImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoogleImport, setShowGoogleImport] = useState(false)
  const [googleImages, setGoogleImages] = useState<GoogleImageResult[]>([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [colorSearch, setColorSearch] = useState('')
  const [manualUrls, setManualUrls] = useState('')
  const [manualImporting, setManualImporting] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}`)
      if (response.ok) {
        const data = await response.json()
        setModel(data.model)
        setImages(data.images || [])
      } else if (response.status === 404) {
        router.push('/admin/models')
        return
      } else {
        console.error('Failed to fetch model data')
      }
    } catch (error) {
      console.error('Error fetching model data:', error)
    } finally {
      setLoading(false)
    }
  }, [modelId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const [searchError, setSearchError] = useState<string | null>(null)

  const searchGoogleImages = async () => {
    if (!model) return

    setSearching(true)
    setSearchError(null)
    try {
      const response = await fetch('/api/admin/models/google-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: model.brand,
          model: model.model,
          color: colorSearch || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setGoogleImages(data.images || [])
        setShowGoogleImport(true)
      } else {
        setSearchError(data.error || 'Failed to search images')
      }
    } catch (error) {
      console.error('Google search error:', error)
      setSearchError('Network error. Please check your connection.')
    } finally {
      setSearching(false)
    }
  }

  const importSelectedImages = async () => {
    if (selectedImages.size === 0) return

    setImporting(true)
    try {
      const response = await fetch('/api/admin/models/import-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          images: Array.from(selectedImages)
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Imported ${data.imported} of ${data.total} images`)
        setShowGoogleImport(false)
        setSelectedImages(new Set())
        await fetchData()
      } else {
        alert('Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Import failed')
    } finally {
      setImporting(false)
    }
  }

  const importManualUrls = async () => {
    const urls = manualUrls
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (urls.length === 0) {
      setManualError('Enter at least one image URL')
      return
    }

    setManualImporting(true)
    setManualError(null)
    try {
      const response = await fetch('/api/admin/models/import-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          images: urls,
          source: 'manual',
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Imported ${data.imported} of ${data.total} images`)
        setManualUrls('')
        await fetchData()
      } else {
        const data = await response.json().catch(() => null)
        setManualError(data?.error || 'Import failed')
      }
    } catch (error) {
      console.error('Manual import error:', error)
      setManualError('Import failed')
    } finally {
      setManualImporting(false)
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm('Delete this image?')) return

    try {
      const response = await fetch(`/api/admin/models/${modelId}/images?imageId=${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
      } else {
        alert('Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Link href="/admin/models" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            ← Back to Models
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Model Images</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!model) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Model Images</h1>
        <p className="text-[var(--error)]">Model not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/models" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          ← Back to Models
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Model Images</h1>
            <p className="text-[var(--text-secondary)]">{model.brand} {model.model}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Color (e.g., Red, Black)"
              value={colorSearch}
              onChange={(e) => setColorSearch(e.target.value)}
              className="min-w-[180px]"
            />
            <Button
              onClick={searchGoogleImages}
              disabled={searching}
              variant="primary"
              size="sm"
              className="whitespace-nowrap"
            >
              {searching ? 'Searching...' : 'Search images'}
            </Button>
          </div>
        </div>
        
        {/* Search Error */}
        {searchError && (
          <div className="mt-4 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--error)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-[var(--error)]">Image search failed</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{searchError}</p>
                {searchError.includes('not configured') && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    To enable image search, add your Google Custom Search API credentials to the environment variables.
                  </p>
                )}
              </div>
              <button
                onClick={() => setSearchError(null)}
                className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual URL Import */}
      <Surface padding="md" className="mb-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-2">Manual URL import</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Paste one image URL per line. Images are stored in the model images bucket.
        </p>
        <textarea
          value={manualUrls}
          onChange={(e) => setManualUrls(e.target.value)}
          rows={4}
          placeholder="https://example.com/image1.jpg"
          className="w-full"
        />
        {manualError && (
          <p className="text-sm text-[var(--error)] mt-2">{manualError}</p>
        )}
        <div className="mt-4">
          <Button
            onClick={importManualUrls}
            disabled={manualImporting}
            variant="secondary"
            size="sm"
          >
            {manualImporting ? 'Importing...' : 'Import URLs'}
          </Button>
        </div>
      </Surface>

      {/* Existing Images */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Images ({images.length})
          </h2>
        </div>
        {images.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)]">No images yet. Search and import from Google.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                    <Image
                      src={image.url}
                      alt={`${model.brand} ${model.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
                        {image.is_primary && (
                          <span className="bg-[var(--success)] text-white px-2 py-1 rounded text-xs font-medium">
                            Primary
                          </span>
                        )}
                        <button
                          onClick={() => deleteImage(image.id)}
                          className="bg-[var(--error)] text-white px-3 py-1 rounded text-sm font-medium hover:bg-[var(--error)]/90 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {image.source} • {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Google Import Modal */}
      {showGoogleImport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-primary)] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Import from Google — {model.brand} {model.model}
                {colorSearch && <span className="text-[var(--accent)]"> ({colorSearch})</span>}
              </h2>
              <button
                onClick={() => setShowGoogleImport(false)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {googleImages.length === 0 ? (
                <p className="text-center text-[var(--text-muted)] py-8">No images found. Try a different color or search term.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {googleImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const newSelected = new Set(selectedImages)
                        if (newSelected.has(image.imageUrl)) {
                          newSelected.delete(image.imageUrl)
                        } else {
                          newSelected.add(image.imageUrl)
                        }
                        setSelectedImages(newSelected)
                      }}
                      className="relative text-left"
                    >
                      <div className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImages.has(image.imageUrl)
                          ? 'border-[var(--accent)]'
                          : 'border-transparent hover:border-[var(--border-secondary)]'
                      }`}>
                        <Image
                          src={image.thumbnail}
                          alt={`Search result ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {selectedImages.has(image.imageUrl) && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {image.width}×{image.height}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border-primary)] flex justify-between items-center">
              <p className="text-sm text-[var(--text-secondary)]">
                {selectedImages.size} images selected
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowGoogleImport(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={importSelectedImages}
                  disabled={selectedImages.size === 0 || importing}
                  className="btn-primary"
                >
                  {importing ? 'Importing...' : `Import ${selectedImages.size} Images`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
