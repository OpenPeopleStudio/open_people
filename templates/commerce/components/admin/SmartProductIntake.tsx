'use client'

import { useState } from 'react'
import Image from 'next/image'
import Surface from '../../../components/ui/Surface'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'

interface ProductIntelligence {
  product: {
    brand?: string
    model?: string
    colorway?: string
    style_code?: string
    year?: number
    category?: string
    confidence: number
    description?: string
  }
  market_prices: Array<{
    source: string
    price_usd?: number
    price_cad?: number
    condition: string
    url: string
    last_updated: string
  }>
  suggested_price_cad: number
  price_range: { min: number; max: number }
  avg_price: number
  trending: 'up' | 'down' | 'stable'
  demand_score: number
  stock_images?: Array<{
    imageUrl: string
    thumbnail: string
    width: number
    height: number
    sourcePage: string
  }>
}

export default function SmartProductIntake() {
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [intelligence, setIntelligence] = useState<ProductIntelligence | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [stockSelected, setStockSelected] = useState<Record<string, boolean>>({})
  const [importingStock, setImportingStock] = useState(false)
  
  // Manual override fields
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [styleCode, setStyleCode] = useState('')
  const [condition, setCondition] = useState('DS')
  const [price, setPrice] = useState(0)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const analyzeProduct = async () => {
    if (!imageFile && !brand) {
      setError('Upload an image or enter brand/model manually')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Upload image first if provided
      let imageUrl = ''
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        
        const uploadRes = await fetch('/api/admin/products/upload-image', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json()
          throw new Error(errorData.error || 'Image upload failed')
        }
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url
      }
      setUploadedImageUrl(imageUrl)
      setSelectedImages(imageUrl ? [imageUrl] : [])

      // Fetch product intelligence
      const res = await fetch('/api/admin/products/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          brand: brand || undefined,
          model: model || undefined,
          styleCode: styleCode || undefined,
          condition,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Intelligence fetch failed' }))
        throw new Error(errorData.error || `Intelligence fetch failed with status ${res.status}`)
      }
      
      const data = await res.json()
      console.log('Intelligence data received:', data)
      
      if (!data.intelligence || data.intelligence.product.confidence === 0) {
        throw new Error('AI could not recognize the product. Check console for details.')
      }
      
      setIntelligence(data.intelligence)
      setStockSelected({})
      
      // Pre-fill form fields
      setBrand(data.intelligence.product.brand || brand)
      setModel(data.intelligence.product.model || model)
      setStyleCode(data.intelligence.product.style_code || styleCode)
      setPrice(data.intelligence.suggested_price_cad || 0)
      
      setStep('review')
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const importSelectedStockImages = async () => {
    if (!intelligence?.stock_images?.length) return
    const picked = intelligence.stock_images
      .filter((img) => stockSelected[img.imageUrl])
      .slice(0, 6)

    if (picked.length === 0) return

    setImportingStock(true)
    setError(null)
    try {
      const imported: string[] = []
      for (const img of picked) {
        const res = await fetch('/api/admin/products/import-image-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: img.imageUrl }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to import stock image')
        }
        const data = await res.json()
        if (data.url) imported.push(data.url)
      }

      if (imported.length > 0) {
        // Prefer imported stock images (clean studio shots) over the uploaded snap
        setSelectedImages(imported)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to import stock images')
    } finally {
      setImportingStock(false)
    }
  }

  const createProduct = async () => {
    // Call product creation API with filled data
    try {
      const res = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          name: model,
          style_code: styleCode,
          description: intelligence?.product.description,
          images: selectedImages,
          variants: [{
            size: 'OS',
            condition,
            price_cents: Math.round((price || 0) * 100),
            stock: 1,
          }],
        }),
      })

      if (!res.ok) throw new Error('Product creation failed')
      
      setStep('confirm')
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (step === 'confirm') {
    return (
      <Surface className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Product Created!</h3>
        <p className="text-[var(--text-secondary)] mb-6">
          {brand} {model} has been added to your inventory
        </p>
        <Button onClick={() => {
          setStep('upload')
          setImageFile(null)
          setImagePreview(null)
          setUploadedImageUrl('')
          setIntelligence(null)
          setSelectedImages([])
          setStockSelected({})
          setImportingStock(false)
          setBrand('')
          setModel('')
          setStyleCode('')
          setPrice(0)
        }}>
          Add Another Product
        </Button>
      </Surface>
    )
  }

  if (step === 'review' && intelligence) {
    return (
      <div className="space-y-6">
        {/* Product Recognition Results */}
        <Surface className="p-6">
          <div className="flex items-start gap-4 mb-6">
            {imagePreview && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0">
                <Image src={imagePreview} alt="Product" fill className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {intelligence.product.brand} {intelligence.product.model}
                </h3>
                <Badge variant={intelligence.product.confidence > 0.8 ? 'success' : 'neutral'}>
                  {Math.round(intelligence.product.confidence * 100)}% match
                </Badge>
              </div>
              {intelligence.product.style_code && (
                <p className="text-sm text-[var(--text-muted)]">
                  Style: {intelligence.product.style_code}
                </p>
              )}
              {intelligence.product.description && (
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  {intelligence.product.description}
                </p>
              )}
            </div>
          </div>

          {/* Stock photos */}
          {Array.isArray(intelligence.stock_images) && intelligence.stock_images.length > 0 && (
            <div className="mt-6 border-t border-[var(--border-primary)] pt-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Stock photos</h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Cleaner studio shots (import into your storage so they don’t break later).
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={importSelectedStockImages}
                  disabled={importingStock}
                >
                  {importingStock ? 'Importing…' : 'Import selected'}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {intelligence.stock_images.slice(0, 8).map((img) => (
                  <label
                    key={img.imageUrl}
                    className="group relative rounded-lg overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-tertiary)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="absolute top-2 left-2 z-10"
                      checked={Boolean(stockSelected[img.imageUrl])}
                      onChange={(e) =>
                        setStockSelected((prev) => ({ ...prev, [img.imageUrl]: e.target.checked }))
                      }
                    />
                    {/* Use <img> so we don't depend on next/image optimization for external sources */}
                    <img
                      src={img.thumbnail || img.imageUrl}
                      alt="Stock"
                      className="w-full aspect-square object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-white/90">Preview</span>
                    </div>
                  </label>
                ))}
              </div>

              {selectedImages.length > 0 && (
                <div className="mt-3 text-xs text-[var(--text-muted)]">
                  Using {selectedImages.length} image(s) for product creation.
                </div>
              )}
            </div>
          )}

          {/* Editable Fields */}
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-[var(--text-secondary)] block mb-2">Brand</span>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
              />
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-secondary)] block mb-2">Model</span>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
              />
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-secondary)] block mb-2">Style Code</span>
              <input
                type="text"
                value={styleCode}
                onChange={(e) => setStyleCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
              />
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-secondary)] block mb-2">Condition</span>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
              >
                <option value="DS">DS - Deadstock</option>
                <option value="VNDS">VNDS - Very Near Deadstock</option>
                <option value="8/10">8/10 - Very Good</option>
                <option value="6/10">6/10 - Good</option>
              </select>
            </label>
          </div>
        </Surface>

        {/* Market Intelligence */}
        <Surface className="p-6">
          <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Market Intelligence
          </h4>

          {intelligence.market_prices.length === 0 && intelligence.suggested_price_cad === 0 && (
            <div className="mb-6 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
              <p className="text-sm text-[var(--text-secondary)]">
                No market prices were found. You can still proceed and set a price manually.
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Tip: pricing uses OpenAI web search; if it’s disabled/unavailable for your model/account, prices may be empty.
              </p>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-2xl font-bold text-[var(--accent)]">
                ${intelligence.suggested_price_cad}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Suggested Price</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                ${intelligence.avg_price}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Avg Market Price</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                ${intelligence.price_range.min} - ${intelligence.price_range.max}
              </p>
              <p className="text-xs text-[var(--text-muted)]">Price Range</p>
            </div>
            <div className="flex items-center gap-2">
              {intelligence.trending === 'up' && (
                <>
                  <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm text-[var(--success)]">Trending Up</span>
                </>
              )}
              {intelligence.trending === 'down' && (
                <>
                  <svg className="w-5 h-5 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  <span className="text-sm text-[var(--error)]">Trending Down</span>
                </>
              )}
              {intelligence.trending === 'stable' && (
                <span className="text-sm text-[var(--text-muted)]">Stable</span>
              )}
            </div>
          </div>

          {/* Demand Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Demand Score</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {intelligence.demand_score}/100
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)] rounded-full"
                style={{ width: `${intelligence.demand_score}%` }}
              />
            </div>
          </div>

          {/* Recent Market Prices */}
          {intelligence.market_prices.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Recent Sales ({intelligence.market_prices.length} found)
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {intelligence.market_prices.slice(0, 5).map((price, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {price.source}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {price.condition}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        ${price.price_cad || (price.price_usd || 0) * 1.35} CAD
                      </p>
                      {price.url ? (
                        <a
                          href={price.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Surface>

        {/* Price Override */}
        <Surface className="p-6">
          <label className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[var(--text-secondary)]">Your Price (CAD)</span>
              {price !== intelligence.suggested_price_cad && (
                <button
                  onClick={() => setPrice(intelligence.suggested_price_cad)}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Use suggested: ${intelligence.suggested_price_cad}
                </button>
              )}
            </div>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-lg font-bold text-[var(--text-primary)]"
            />
          </label>
        </Surface>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setStep('upload')}
            className="flex-1"
          >
            Start Over
          </Button>
          <Button
            onClick={createProduct}
            className="flex-1"
          >
            Create Product
          </Button>
        </div>

        {error && (
          <p className="text-sm text-[var(--error)] text-center">{error}</p>
        )}
      </div>
    )
  }

  // Upload Step
  return (
    <Surface className="p-6">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
        AI Product Intake
      </h2>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm text-[var(--text-secondary)] mb-3">
          Upload Product Photo
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="product-image"
          />
          <label
            htmlFor="product-image"
            className="block w-full h-48 border-2 border-dashed border-[var(--border-primary)] rounded-xl cursor-pointer hover:border-[var(--accent)] transition-colors overflow-hidden"
          >
            {imagePreview ? (
              <div className="relative w-full h-full">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <svg className="w-12 h-12 text-[var(--text-muted)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-[var(--text-secondary)]">Click to upload photo</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  AI will recognize brand, model & suggest pricing
                </p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* OR divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-primary)]"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-[var(--bg-secondary)] text-sm text-[var(--text-muted)]">
            OR
          </span>
        </div>
      </div>

      {/* Manual Entry */}
      <div className="space-y-4 mb-6">
        <label className="text-sm">
          <span className="text-[var(--text-secondary)] block mb-2">Brand</span>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g., Nike, Adidas"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
          />
        </label>
        <label className="text-sm">
          <span className="text-[var(--text-secondary)] block mb-2">Model</span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g., Air Jordan 1 High"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
          />
        </label>
        <label className="text-sm">
          <span className="text-[var(--text-secondary)] block mb-2">Style Code (Optional)</span>
          <input
            type="text"
            value={styleCode}
            onChange={(e) => setStyleCode(e.target.value)}
            placeholder="e.g., DZ5485-612"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)]"
          />
        </label>
      </div>

      <Button
        onClick={analyzeProduct}
        disabled={loading || (!imageFile && !brand)}
        className="w-full"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Analyzing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Get AI Intelligence
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-[var(--error)] text-center mt-4">{error}</p>
      )}
    </Surface>
  )
}
