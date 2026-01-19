'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Surface from '../../../components/ui/Surface'
import Badge from '../../../components/ui/Badge'

type StaffLocationSummary = {
  live: number
  recent: number
  stale: number
  total: number
}

export default function StaffLocationWidget() {
  const [summary, setSummary] = useState<StaffLocationSummary>({
    live: 0,
    recent: 0,
    stale: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/staff/location?windowHours=48&maxPerStaff=1&limit=100')
        if (response.ok) {
          const data = await response.json()
          
          const LIVE_THRESHOLD_MS = 2 * 60 * 1000
          const RECENT_THRESHOLD_MS = 10 * 60 * 1000
          
          let live = 0
          let recent = 0
          let stale = 0
          
          for (const staff of data.staff || []) {
            if (!staff.latest) continue
            const diffMs = Date.now() - new Date(staff.latest.recorded_at).getTime()
            if (diffMs <= LIVE_THRESHOLD_MS) live++
            else if (diffMs <= RECENT_THRESHOLD_MS) recent++
            else stale++
          }
          
          setSummary({
            live,
            recent,
            stale,
            total: live + recent + stale,
          })
        }
      } catch (error) {
        console.error('Failed to fetch staff location summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSummary, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Surface padding="md" className="animate-pulse">
        <div className="h-32 bg-[var(--bg-tertiary)] rounded-lg" />
      </Surface>
    )
  }

  return (
    <Link href="/admin/staff-location">
      <Surface 
        padding="md" 
        className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-purple)] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                Staff Tracking
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Live location updates
              </p>
            </div>
          </div>
          
          {summary.total > 0 && (
            <Badge variant="success">{summary.total}</Badge>
          )}
        </div>

        {summary.total === 0 ? (
          <div className="text-xs text-[var(--text-muted)] text-center py-4">
            No active staff locations
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
                <span className="text-xs text-[var(--text-muted)]">Live</span>
              </div>
              <div className="text-xl font-bold text-[var(--success)]">
                {summary.live}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
                <span className="text-xs text-[var(--text-muted)]">Recent</span>
              </div>
              <div className="text-xl font-bold text-[var(--accent-blue)]">
                {summary.recent}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-purple)]" />
                <span className="text-xs text-[var(--text-muted)]">Stale</span>
              </div>
              <div className="text-xl font-bold text-[var(--text-secondary)]">
                {summary.stale}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">View full map</span>
          <svg className="w-4 h-4 text-[var(--accent)] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Surface>
    </Link>
  )
}
