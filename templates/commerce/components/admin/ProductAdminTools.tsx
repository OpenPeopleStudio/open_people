'use client'

import { useState } from 'react'
import Link from 'next/link'
import Surface from '../../../components/ui/Surface'
import Badge from '../../../components/ui/Badge'

interface ProductStats {
  views?: number
  wishlistCount?: number
  stockAlerts?: number
  totalOrders?: number
  avgPrice?: number
  profitMargin?: number
  daysInStock?: number
}

interface ProductAdminToolsProps {
  productId: string
  productSlug: string
  stats?: ProductStats
  userRole: string
  onRefresh?: () => void
}

export default function ProductAdminTools({
  productId,
  productSlug,
  stats,
  userRole,
  onRefresh,
}: ProductAdminToolsProps) {
  const [copied, setCopied] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const isAdmin = ['admin', 'owner'].includes(userRole)
  const isStaff = ['staff', 'admin', 'owner'].includes(userRole)

  if (!isStaff) return null

  const handleCopyLink = () => {
    const url = `${window.location.origin}/product/${productSlug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Admin Quick Actions Bar */}
      <Surface className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Admin Tools</h3>
            <Badge variant="time">Staff</Badge>
          </div>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {isAdmin && (
            <>
              <Link
                href={`/admin/products?edit=${productId}`}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent)] text-sm font-medium text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              <Link
                href={`/admin/inventory?product=${productId}`}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent)] text-sm font-medium text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Stock
              </Link>
            </>
          )}
          <Link
            href={`/admin/orders?product=${productId}`}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent)] text-sm font-medium text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Orders
          </Link>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--accent)] text-sm font-medium text-[var(--text-primary)] transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      </Surface>

      {/* Live Analytics */}
      {showAnalytics && stats && (
        <Surface className="p-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.views !== undefined && (
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.views.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-muted)]">Total views</p>
              </div>
            )}
            {stats.wishlistCount !== undefined && (
              <div>
                <p className="text-2xl font-bold text-[var(--accent)]">{stats.wishlistCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Wishlisted</p>
              </div>
            )}
            {stats.stockAlerts !== undefined && (
              <div>
                <p className="text-2xl font-bold text-[var(--accent-amber)]">{stats.stockAlerts}</p>
                <p className="text-xs text-[var(--text-muted)]">Stock alerts</p>
              </div>
            )}
            {stats.totalOrders !== undefined && (
              <div>
                <p className="text-2xl font-bold text-[var(--success)]">{stats.totalOrders}</p>
                <p className="text-xs text-[var(--text-muted)]">Total sold</p>
              </div>
            )}
            {stats.profitMargin !== undefined && (
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.profitMargin}%</p>
                <p className="text-xs text-[var(--text-muted)]">Avg margin</p>
              </div>
            )}
            {stats.daysInStock !== undefined && (
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.daysInStock}</p>
                <p className="text-xs text-[var(--text-muted)]">Days listed</p>
              </div>
            )}
          </div>
        </Surface>
      )}

      {/* Price History Chart (if data available) */}
      {showAnalytics && stats?.avgPrice && (
        <Surface className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Pricing</h4>
            <span className="text-sm text-[var(--text-muted)]">
              Avg: ${(stats.avgPrice / 100).toFixed(0)}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            View detailed price history and competitive analysis in admin dashboard
          </p>
          {isAdmin && (
            <Link
              href={`/admin/reports?product=${productId}`}
              className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              View detailed analytics
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </Surface>
      )}

      {/* Customer Intelligence */}
      {showAnalytics && (stats?.wishlistCount || stats?.stockAlerts) && (
        <Surface className="p-4">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Customer Interest</h4>
          <div className="space-y-2 text-sm">
            {stats.wishlistCount && stats.wishlistCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Active wishlists</span>
                <span className="font-medium text-[var(--text-primary)]">{stats.wishlistCount}</span>
              </div>
            )}
            {stats.stockAlerts && stats.stockAlerts > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Waiting for restock</span>
                <span className="font-medium text-[var(--accent-amber)]">{stats.stockAlerts}</span>
              </div>
            )}
            {stats.totalOrders && stats.totalOrders > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Previous orders</span>
                <span className="font-medium text-[var(--success)]">{stats.totalOrders}</span>
              </div>
            )}
          </div>
          {stats.stockAlerts && stats.stockAlerts > 5 && (
            <div className="mt-3 p-2 bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/30 rounded text-xs text-[var(--accent-amber)]">
              <strong>High demand!</strong> {stats.stockAlerts} customers waiting for restock
            </div>
          )}
        </Surface>
      )}
    </div>
  )
}
