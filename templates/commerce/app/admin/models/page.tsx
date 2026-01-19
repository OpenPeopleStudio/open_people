'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface ProductModel {
  id: string
  brand: string
  model: string
  slug: string
  created_at: string
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<ProductModel[]>([])
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState<string[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('')

  const fetchModels = useCallback(async () => {
    try {
      const url = selectedBrand
        ? `/api/admin/models?brand=${encodeURIComponent(selectedBrand)}`
        : '/api/admin/models'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
        setBrands(data.brands || [])
      } else {
        console.error('Failed to fetch models')
      }
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedBrand])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Models</h1>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Models</h1>
        <Link href="/admin/models/new" className="btn-primary">
          Add Model
        </Link>
      </div>

      {/* Brand Filter */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Filter by Brand:</label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="min-w-[200px]"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Models ({models.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                    {model.brand}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                    {model.model}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                    {new Date(model.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/models/${model.id}/images`}
                      className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      Manage Images
                    </Link>
                  </td>
                </tr>
              ))}
              {models.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No models yet. Add your first model to manage product images.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
