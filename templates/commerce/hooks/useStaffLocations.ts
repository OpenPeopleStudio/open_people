'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { decryptLocationBatch } from '@/lib/crypto/location'
import { getActiveKeyPair } from '@/lib/crypto/indexedDB'

export type StaffLocationStatus = 'live' | 'recent' | 'stale' | 'unknown'

export type StaffLocation = {
  user_id: string
  name: string | null
  lat: number
  lng: number
  accuracy_m: number | null
  recorded_at: string
  status: StaffLocationStatus
  encrypted: boolean
}

type ApiStaffLocation = {
  user_id: string
  name: string | null
  latest: {
    lat: number
    lng: number
    accuracy_m: number | null
    recorded_at: string
  } | null
  trail: Array<{
    lat: number
    lng: number
    accuracy_m: number | null
    recorded_at: string
  }>
}

type UseStaffLocationsOptions = {
  autoRefresh?: boolean
  refreshInterval?: number
  decryptLocations?: boolean
}

const LIVE_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes
const RECENT_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

function getStatus(timestamp?: string | null): StaffLocationStatus {
  if (!timestamp) return 'unknown'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  if (diffMs <= LIVE_THRESHOLD_MS) return 'live'
  if (diffMs <= RECENT_THRESHOLD_MS) return 'recent'
  return 'stale'
}

export function useStaffLocations(options: UseStaffLocationsOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 15000, // 15 seconds
    decryptLocations = true,
  } = options

  const [locations, setLocations] = useState<StaffLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const decryptionKeyRef = useRef<string | null>(null)

  // Load decryption key once
  useEffect(() => {
    if (!decryptLocations) return

    const loadKey = async () => {
      try {
        const keyPair = await getActiveKeyPair()
        if (keyPair?.privateKey) {
          decryptionKeyRef.current = keyPair.privateKey
        }
      } catch (err) {
        console.error('Failed to load decryption key:', err)
      }
    }

    loadKey()
  }, [decryptLocations])

  const fetchLocations = useCallback(async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/staff/location?windowHours=48&maxPerStaff=60&limit=2000')
      
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to load locations')
      }

      const data: { staff: ApiStaffLocation[] } = await response.json()
      
      // Convert to flat location list
      const flatLocations: StaffLocation[] = data.staff
        .filter(s => s.latest)
        .map(s => ({
          user_id: s.user_id,
          name: s.name,
          lat: s.latest!.lat,
          lng: s.latest!.lng,
          accuracy_m: s.latest!.accuracy_m,
          recorded_at: s.latest!.recorded_at,
          status: getStatus(s.latest!.recorded_at),
          encrypted: false, // Will be updated if decrypted
        }))

      // TODO: Implement decryption when encrypted_location is available
      // For now, just use plaintext coordinates
      
      if (!isMountedRef.current) return
      
      setLocations(flatLocations)
      setLastUpdated(new Date())
      setLoading(false)
    } catch (err) {
      if (!isMountedRef.current) return
      
      setError(err instanceof Error ? err.message : 'Failed to load locations')
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchLocations()
      }
    }, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, fetchLocations])

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        fetchLocations()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [autoRefresh, fetchLocations])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const refetch = useCallback(() => {
    setLoading(true)
    return fetchLocations()
  }, [fetchLocations])

  // Filter helpers
  const liveLocations = locations.filter(l => l.status === 'live')
  const recentLocations = locations.filter(l => l.status === 'recent')
  const staleLocations = locations.filter(l => l.status === 'stale')

  const statusCounts = {
    live: liveLocations.length,
    recent: recentLocations.length,
    stale: staleLocations.length,
    total: locations.length,
  }

  return {
    locations,
    liveLocations,
    recentLocations,
    staleLocations,
    statusCounts,
    loading,
    error,
    lastUpdated,
    refetch,
  }
}
