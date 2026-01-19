'use client'

import { useEffect, useState } from 'react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Surface from '../../../components/ui/Surface'
import Button from '../../../components/ui/Button'
import PrivacyControls from '../../../components/account/PrivacyControls'

interface PrivacyStats {
  account: {
    created_at: string
    account_age_days: number
  }
  data_stored: {
    orders: number
    messages: number
    wishlist_items: number
    location_points: number
  }
  privacy_settings: {
    message_retention_enabled: boolean
    message_retention_days: number | null
    location_sharing_enabled: boolean
    active_consents: number
    total_consents: number
  }
  data_exports: {
    total: number
    recent: Array<{ created_at: string; export_type: string }>
  }
  deletion_request: {
    scheduled_for: string
    status: string
  } | null
}

export default function PrivacyDashboard() {
  const [stats, setStats] = useState<PrivacyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPrivacyStats()
  }, [])

  const fetchPrivacyStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/account/privacy/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch privacy statistics')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load privacy dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/account/export-data')
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      await fetchPrivacyStats() // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true)
      const response = await fetch('/api/account/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmEmail: deleteEmail,
          immediate: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Deletion request failed')
      }

      const data = await response.json()
      alert(`Account deletion scheduled for ${new Date(data.scheduled_for).toLocaleDateString()}. You can cancel before then.`)
      setShowDeleteConfirm(false)
      setDeleteEmail('')
      await fetchPrivacyStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deletion failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDeletion = async () => {
    try {
      const response = await fetch('/api/account/delete-account', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel deletion')
      }

      alert('Account deletion cancelled')
      await fetchPrivacyStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-[var(--text-muted)]">Loading privacy dashboard...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Privacy Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Control your data and privacy settings
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          {stats?.deletion_request && (
            <div className="mb-4 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
              <h3 className="text-sm font-semibold text-[var(--warning)] mb-2">
                Account Deletion Scheduled
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Your account is scheduled for deletion on{' '}
                {new Date(stats.deletion_request.scheduled_for).toLocaleDateString()}
              </p>
              <Button onClick={handleCancelDeletion} variant="ghost" size="sm">
                Cancel Deletion
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Surface padding="md">
              <div className="text-sm text-[var(--text-muted)] mb-1">Account Age</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {stats?.account.account_age_days} days
              </div>
            </Surface>

            <Surface padding="md">
              <div className="text-sm text-[var(--text-muted)] mb-1">Active Consents</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {stats?.privacy_settings.active_consents} / {stats?.privacy_settings.total_consents}
              </div>
            </Surface>

            <Surface padding="md">
              <div className="text-sm text-[var(--text-muted)] mb-1">Data Exports</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {stats?.data_exports.total}
              </div>
            </Surface>
          </div>

          <Surface padding="md" className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Your Data
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Orders</div>
                <div className="text-xl font-semibold text-[var(--text-primary)]">
                  {stats?.data_stored.orders}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Messages</div>
                <div className="text-xl font-semibold text-[var(--text-primary)]">
                  {stats?.data_stored.messages}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Wishlist Items</div>
                <div className="text-xl font-semibold text-[var(--text-primary)]">
                  {stats?.data_stored.wishlist_items}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Location Points</div>
                <div className="text-xl font-semibold text-[var(--text-primary)]">
                  {stats?.data_stored.location_points}
                </div>
              </div>
            </div>
          </Surface>

          <PrivacyControls />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Surface padding="md">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Export Your Data
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Download all your personal data in JSON format. This includes orders, messages, wishlist, and more.
              </p>
              <Button onClick={handleExportData} variant="ghost" size="sm">
                Export All Data
              </Button>
            </Surface>

            <Surface padding="md">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Delete Account
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Permanently delete your account and personal data. Orders will be anonymized for business records.
              </p>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="ghost"
                size="sm"
                className="text-[var(--error)]"
              >
                Request Deletion
              </Button>
            </Surface>
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Surface padding="lg" className="max-w-md w-full">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
                  Confirm Account Deletion
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  This will schedule your account for deletion in 30 days. You can cancel at any time before then.
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Type your email to confirm:
                </p>
                <input
                  type="email"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded mb-4"
                  placeholder="your@email.com"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleDeleteAccount}
                    variant="primary"
                    disabled={deleting || !deleteEmail}
                  >
                    {deleting ? 'Processing...' : 'Confirm Deletion'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteEmail('')
                    }}
                    variant="ghost"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                </div>
              </Surface>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
