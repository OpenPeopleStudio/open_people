'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewModelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, model })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create model')
      }

      router.push('/admin/models')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create model')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/models" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
          ← Back to Models
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Add New Model</h1>
        <p className="text-[var(--text-secondary)] mt-1">Create a new product model to manage images for</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 space-y-6">
          <div>
            <label>Brand *</label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., Nike, Jordan, Yeezy"
            />
          </div>

          <div>
            <label>Model *</label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., Air Force 1, Retro 4, 350 V2"
            />
          </div>

          {error && (
            <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Model'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
