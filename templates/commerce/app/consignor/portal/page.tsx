'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Surface from '../../../../components/ui/Surface'
import Button from '../../../../components/ui/Button'

function ConsignorPortalContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])

  useEffect(() => {
    if (token) {
      validateToken()
    } else {
      setLoading(false)
    }
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/consignor/auth?token=${token}`)
      if (!response.ok) {
        throw new Error('Invalid or expired access link')
      }
      setAuthenticated(true)
      await fetchDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setLoading(false)
    }
  }

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/consignor/dashboard?token=${token}`)
      if (!response.ok) {
        throw new Error('Failed to load dashboard')
      }
      const data = await response.json()
      setDashboard(data.dashboard)
      setItems(data.items)
      setPayouts(data.payouts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/consignor/export?token=${token}&format=${format}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `consignment-data.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    )
  }

  if (!token || !authenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <Surface padding="lg" className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            Consignor Portal
          </h1>
          {error && (
            <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Access your consignment dashboard with a secure link. Contact the store for access.
          </p>
        </Surface>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Consignor Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Welcome back, {dashboard?.name}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Surface padding="md">
            <div className="text-sm text-[var(--text-muted)] mb-1">Current Balance</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              ${((dashboard?.balance_cents || 0) / 100).toFixed(2)}
            </div>
          </Surface>

          <Surface padding="md">
            <div className="text-sm text-[var(--text-muted)] mb-1">Total Sales</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              ${((dashboard?.total_sales_cents || 0) / 100).toFixed(2)}
            </div>
          </Surface>

          <Surface padding="md">
            <div className="text-sm text-[var(--text-muted)] mb-1">Active Items</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {dashboard?.active_items || 0}
            </div>
          </Surface>

          <Surface padding="md">
            <div className="text-sm text-[var(--text-muted)] mb-1">Sold Items</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {dashboard?.sold_items || 0}
            </div>
          </Surface>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Surface padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Your Items
              </h2>
              <div className="text-sm text-[var(--text-muted)]">
                {items.length} total
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No items yet
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[var(--bg-secondary)] rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {item.product_name || `${item.brand} ${item.model}`}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {item.sku} • Size {item.size} • {item.condition}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded ${
                          item.status === 'sold' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                          item.status === 'paid' ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]' :
                          'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        }`}>
                          {item.status}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">
                          ${((item.sold_price_cents || item.list_price_cents) / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>

          <Surface padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Payout History
              </h2>
              <div className="text-sm text-[var(--text-muted)]">
                {payouts.length} total
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {payouts.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No payouts yet
                </div>
              ) : (
                payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-3 bg-[var(--bg-secondary)] rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          ${(payout.amount_cents / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {payout.method} • {new Date(payout.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        payout.status === 'completed' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                        'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                      }`}>
                        {payout.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Surface>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => handleExport('json')} variant="ghost">
            Export as JSON
          </Button>
          <Button onClick={() => handleExport('csv')} variant="ghost">
            Export as CSV
          </Button>
        </div>

        <Surface padding="md" variant="outline" className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            Privacy & Security
          </h3>
          <div className="text-xs text-[var(--text-muted)] space-y-1">
            <p>
              Your access link is valid for 24 hours. Request a new link if it expires.
            </p>
            <p>
              Payment information is encrypted and stored securely. We never share your data with third parties.
            </p>
            <p>
              Commission rate: {dashboard?.commission_rate}%
            </p>
          </div>
        </Surface>
      </div>
    </div>
  )
}

export default function ConsignorPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-[var(--text-muted)]">Loading...</div>
    </div>}>
      <ConsignorPortalContent />
    </Suspense>
  )
}
