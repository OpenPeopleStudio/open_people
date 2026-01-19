'use client'

import { useState, useMemo } from 'react'
import Surface from '../../../../components/ui/Surface'
import Button from '../../../../components/ui/Button'
import Badge, { type BadgeVariant } from '../../../../components/ui/Badge'
import StaffLocationMap from '../../../../components/admin/StaffLocationMap'
import { useStaffLocations, type StaffLocationStatus } from '@/hooks/useStaffLocations'

const STATUS_LABELS: Record<StaffLocationStatus, string> = {
  live: 'Live',
  recent: 'Recent',
  stale: 'Stale',
  unknown: 'Unknown',
}

const STATUS_VARIANTS: Record<StaffLocationStatus, BadgeVariant> = {
  live: 'success',
  recent: 'info',
  stale: 'neutral',
  unknown: 'neutral',
}

type StatusFilter = 'all' | StaffLocationStatus

const formatRelative = (timestamp?: string | null) => {
  if (!timestamp) return 'Unknown'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  if (diffMs < 60 * 1000) return 'Just now'
  const minutes = Math.round(diffMs / (60 * 1000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

const formatTimestamp = (timestamp?: string | null) =>
  timestamp ? new Date(timestamp).toLocaleString() : '—'

export default function OperationsPage() {
  const { 
    locations, 
    statusCounts, 
    loading, 
    error, 
    lastUpdated, 
    refetch 
  } = useStaffLocations({ autoRefresh: true, refreshInterval: 15000 })

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [drawerOpen, setDrawerOpen] = useState(true)

  const filteredLocations = useMemo(() => {
    if (statusFilter === 'all') return locations
    return locations.filter(l => l.status === statusFilter)
  }, [locations, statusFilter])

  const selectedLocation = useMemo(() => {
    if (selectedUserId) {
      return filteredLocations.find(l => l.user_id === selectedUserId) || filteredLocations[0] || null
    }
    return filteredLocations[0] || null
  }, [filteredLocations, selectedUserId])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalStaff = locations.length
    const activeStaff = statusCounts.live + statusCounts.recent
    const coverage = totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0

    return {
      totalStaff,
      activeStaff,
      coverage: Math.round(coverage),
      liveNow: statusCounts.live,
    }
  }, [locations, statusCounts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Operations Center
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Advanced dispatch and routing dashboard with real-time tracking.
            </p>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                {statusCounts.live}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                {statusCounts.recent}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-purple)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                {statusCounts.stale}
              </span>
            </div>
          </div>

          {lastUpdated && (
            <span className="text-xs text-[var(--text-muted)]">
              Updated {formatRelative(lastUpdated.toISOString())}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {/* Filter Buttons */}
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'live' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('live')}
          >
            Live
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'recent' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('recent')}
          >
            Recent
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'stale' ? 'primary' : 'ghost'}
            onClick={() => setStatusFilter('stale')}
          >
            Stale
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => refetch()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Total Staff
            </span>
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {metrics.totalStaff}
          </div>
        </Surface>

        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Active Now
            </span>
            <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--success)]">
            {metrics.activeStaff}
          </div>
        </Surface>

        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Live Tracking
            </span>
            <div className="w-3 h-3 rounded-full bg-[var(--success)] shadow-[0_0_12px_var(--success)] animate-pulse" />
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {metrics.liveNow}
          </div>
        </Surface>

        <Surface padding="md">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              Coverage
            </span>
            <svg className="w-5 h-5 text-[var(--accent-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-[var(--accent-blue)]">
            {metrics.coverage}%
          </div>
        </Surface>
      </div>

      {/* Error Display */}
      {error && (
        <Surface padding="sm" className="border border-[var(--error)]/30 bg-[var(--error)]/10">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </Surface>
      )}

      {/* Full Width Map with Floating Drawer */}
      <div className="relative" style={{ isolation: 'isolate' }}>
        <Surface padding="none" className="h-[calc(100vh-340px)] relative" style={{ zIndex: 1 }}>
          <StaffLocationMap
            locations={filteredLocations}
            selectedUserId={selectedLocation?.user_id}
            onSelectLocation={setSelectedUserId}
            className="w-full h-full"
          />
        </Surface>

        {/* Floating Drawer Toggle Button */}
        {!drawerOpen && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="absolute top-4 right-4 z-[1001] px-4 py-2 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-xl text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent)] transition-all shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Show Staff List ({filteredLocations.length})
          </button>
        )}

        {/* Collapsible Staff Drawer */}
        {drawerOpen && (
          <div className="absolute top-4 right-4 z-[1001] w-80 max-h-[calc(100vh-420px)]">
            <Surface 
              padding="none" 
              className="backdrop-blur-xl bg-[var(--bg-secondary)]/95 border-[var(--glass-border)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              style={{ position: 'relative', zIndex: 1001 }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    Staff Locations
                  </h3>
                  <Badge variant="neutral">
                    {filteredLocations.length}
                  </Badge>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Staff List */}
              <div className="overflow-y-auto max-h-[calc(100vh-520px)] p-3 space-y-2">
                {filteredLocations.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      {statusFilter === 'all'
                        ? 'No staff locations available yet.'
                        : `No ${statusFilter} staff locations.`}
                    </p>
                  </div>
                ) : (
                  filteredLocations.map((location) => (
                    <button
                      key={location.user_id}
                      onClick={() => setSelectedUserId(location.user_id)}
                      className={`w-full text-left transition-all duration-200 ${
                        selectedLocation?.user_id === location.user_id
                          ? 'scale-[1.02]'
                          : 'hover:scale-[1.01]'
                      }`}
                    >
                      <Surface
                        padding="sm"
                        variant={selectedLocation?.user_id === location.user_id ? 'elevated' : 'default'}
                        className={`${
                          selectedLocation?.user_id === location.user_id
                            ? 'border-[var(--accent)] shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-purple)] flex items-center justify-center text-white font-bold text-xs shadow-[0_0_12px_rgba(168,85,247,0.4)] flex-shrink-0">
                            {location.name
                              ? location.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                              : 'S'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              {location.name || `Staff ${location.user_id.slice(-6)}`}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {formatRelative(location.recorded_at)}
                            </p>
                          </div>
                          <Badge variant={STATUS_VARIANTS[location.status]} className="flex-shrink-0">
                            {STATUS_LABELS[location.status]}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs pl-12">
                          {location.accuracy_m && (
                            <div className="flex items-center justify-between text-[var(--text-muted)]">
                              <span>Accuracy:</span>
                              <span className="text-[var(--text-secondary)]">
                                ±{Math.round(location.accuracy_m)}m
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[var(--text-muted)]">
                            <span>Coordinates:</span>
                            <span className="text-[var(--text-secondary)] font-mono text-[10px]">
                              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </span>
                          </div>
                          {location.encrypted && (
                            <div className="flex items-center gap-1 text-[var(--success)] pt-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span className="text-[10px] font-medium">E2E Encrypted</span>
                            </div>
                          )}
                        </div>
                      </Surface>
                    </button>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50">
                <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                  <span>Auto-refreshing every 15s</span>
                </div>
              </div>
            </Surface>
          </div>
        )}
      </div>

      {/* Performance Metrics (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Surface padding="md">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Distance Today
          </h4>
          <div className="text-2xl font-bold text-[var(--accent-blue)] mb-1">
            —
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Coming soon
          </p>
        </Surface>

        <Surface padding="md">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Avg. Delivery Time
          </h4>
          <div className="text-2xl font-bold text-[var(--accent-purple)] mb-1">
            —
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Coming soon
          </p>
        </Surface>

        <Surface padding="md">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Deliveries Today
          </h4>
          <div className="text-2xl font-bold text-[var(--success)] mb-1">
            —
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Coming soon
          </p>
        </Surface>
      </div>
    </div>
  )
}
