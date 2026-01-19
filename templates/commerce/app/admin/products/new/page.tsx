'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Button from '../../../../../components/ui/Button'
import Surface from '../../../../../components/ui/Surface'
import SmartProductIntake from '../../../../../components/admin/SmartProductIntake'

interface VariantFormData {
  size: string
  condition: string
  price_cents: number | null
  stock: number | null
  sku?: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Product fields
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [styleCode, setStyleCode] = useState('')
  const [isDrop, setIsDrop] = useState(false)
  const [dropStartsAt, setDropStartsAt] = useState('')
  const [dropEndsAt, setDropEndsAt] = useState('')

  // Images
  const [images, setImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // Variants
  const [variants, setVariants] = useState<VariantFormData[]>([
    { size: '', condition: 'DS', price_cents: 0, stock: 1 }
  ])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploadingImage(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/admin/products/upload-image', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Image upload failed')
        }

        const data = await res.json()
        uploadedUrls.push(data.url)
      }

      setImages([...images, ...uploadedUrls])
    } catch (err: any) {
      setError(err.message || 'Failed to upload images')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const addVariant = () => {
    setVariants([...variants, { size: '', condition: 'DS', price_cents: 0, stock: 1 }])
  }

  const updateVariant = (index: number, field: keyof VariantFormData, value: string | number | null) => {
    const newVariants = [...variants]
    newVariants[index] = { ...newVariants[index], [field]: value }
    setVariants(newVariants)
  }

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          brand,
          category,
          description,
          style_code: styleCode,
          is_drop: isDrop,
          drop_starts_at: dropStartsAt || null,
          drop_ends_at: dropEndsAt || null,
          images,
          variants,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create product')
      }

      const data = await res.json()
      router.push(`/product/${data.product.slug}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mt-4">
          Create Product
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Add products manually or use AI to automatically extract details from photos
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-8">
        <div className="inline-flex rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'manual'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === 'ai'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Smart Intake
          </button>
        </div>
      </div>

      {/* AI Mode */}
      {mode === 'ai' && (
        <SmartProductIntake />
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg p-4 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          {/* Product Details */}
          <Surface className="p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
              Product Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="col-span-2">
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Product Name *
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Air Jordan 1 High Chicago"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                />
              </label>

              <label>
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Brand *
                </span>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  placeholder="e.g., Nike, Adidas"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                />
              </label>

              <label>
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                >
                  <option value="">Select category</option>
                  <option value="sneakers">Sneakers</option>
                  <option value="apparel">Apparel</option>
                  <option value="accessories">Accessories</option>
                </select>
              </label>

              <label className="col-span-2">
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Style Code / SKU
                </span>
                <input
                  type="text"
                  value={styleCode}
                  onChange={(e) => setStyleCode(e.target.value)}
                  placeholder="e.g., DZ5485-612"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                />
              </label>

              <label className="col-span-2">
                <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Product description..."
                  className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors resize-none"
                />
              </label>
            </div>
          </Surface>

          {/* Images */}
          <Surface className="p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
              Product Images
            </h2>
            
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`block w-full h-32 border-2 border-dashed border-[var(--border-primary)] rounded-lg cursor-pointer hover:border-[var(--accent)] transition-colors flex items-center justify-center ${
                  uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadingImage ? (
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-sm text-[var(--text-muted)]">Uploading...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-[var(--text-secondary)]">
                      Click to upload images
                    </span>
                    <span className="text-xs text-[var(--text-muted)] block mt-1">
                      PNG, JPG up to 10MB each
                    </span>
                  </div>
                )}
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full pt-[100%] rounded-lg overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                      <Image
                        src={url}
                        alt={`Product ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-[var(--error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-[var(--accent)] text-white text-xs font-medium rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Surface>

          {/* Variants */}
          <Surface className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Variants
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Add size, condition, and pricing options
                </p>
              </div>
              <Button type="button" onClick={addVariant} variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg"
                >
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                      Size
                    </label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      placeholder="e.g., 10"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                      Condition
                    </label>
                    <select
                      value={variant.condition}
                      onChange={(e) => updateVariant(index, 'condition', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm"
                    >
                      <option value="DS">DS</option>
                      <option value="VNDS">VNDS</option>
                      <option value="8/10">8/10</option>
                      <option value="6/10">6/10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                      Price (CAD)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={variant.price_cents === null ? '' : variant.price_cents / 100}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          updateVariant(index, 'price_cents', null)
                          return
                        }
                        const parsed = Number.parseFloat(raw)
                        if (!Number.isFinite(parsed)) {
                          updateVariant(index, 'price_cents', null)
                          return
                        }
                        updateVariant(index, 'price_cents', Math.round(parsed * 100))
                      }}
                      placeholder=""
                      step="0.01"
                      className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                      Stock
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={variant.stock === null ? '' : variant.stock}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') {
                          updateVariant(index, 'stock', null)
                          return
                        }
                        const parsed = Number.parseInt(raw, 10)
                        if (!Number.isFinite(parsed)) {
                          updateVariant(index, 'stock', null)
                          return
                        }
                        updateVariant(index, 'stock', parsed)
                      }}
                      min="0"
                      className="w-full px-3 py-2 min-h-[44px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      disabled={variants.length === 1}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm font-medium hover:bg-[var(--error)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          {/* Drop Settings */}
          <Surface className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Drop Settings
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Optional: Configure time-limited release
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDrop}
                  onChange={(e) => setIsDrop(e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--border-primary)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Enable Drop
                </span>
              </label>
            </div>

            {isDrop && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label>
                  <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Drop Starts At
                  </span>
                  <input
                    type="datetime-local"
                    value={dropStartsAt}
                    onChange={(e) => setDropStartsAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                  />
                </label>

                <label>
                  <span className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Drop Ends At
                  </span>
                  <input
                    type="datetime-local"
                    value={dropEndsAt}
                    onChange={(e) => setDropEndsAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] transition-colors"
                  />
                </label>
              </div>
            )}
          </Surface>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href="/admin/products" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !name || !brand}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
