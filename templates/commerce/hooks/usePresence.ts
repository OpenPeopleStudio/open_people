'use client'

import { useEffect, useRef, useState } from 'react'

interface PresenceData {
  [userId: string]: {
    isOnline: boolean
    lastActiveAt: string | null
  }
}

/**
 * Hook to manage user presence tracking
 * - Sends heartbeat every 60 seconds to keep user marked as online
 * - Fetches presence status for other users
 * - Uses Page Visibility API to pause heartbeats when tab is inactive
 */
export function usePresence(userIds: string[] = []) {
  const [presenceData, setPresenceData] = useState<PresenceData>({})
  const [isActive, setIsActive] = useState(true)
  const heartbeatInterval = useRef<NodeJS.Timeout | undefined>(undefined)
  const presenceFetchInterval = useRef<NodeJS.Timeout | undefined>(undefined)

  // Send heartbeat to mark this user as online
  const sendHeartbeat = async () => {
    try {
      const response = await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok && response.status === 401) {
        // User not authenticated, stop trying
        return false
      }
      
      return true
    } catch (error) {
      console.error('Failed to send presence heartbeat:', error)
      return false
    }
  }

  // Fetch presence data for specified users
  const fetchPresence = async () => {
    if (userIds.length === 0) return

    try {
      const response = await fetch(
        `/api/presence/status?userIds=${userIds.join(',')}`
      )
      if (response.ok) {
        const data = await response.json()
        setPresenceData(data.presenceData || {})
      }
    } catch (error) {
      console.error('Failed to fetch presence:', error)
    }
  }

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Send heartbeat when page becomes active
  useEffect(() => {
    if (isActive) {
      sendHeartbeat()
    }
  }, [isActive])

  // Set up heartbeat interval (every 60 seconds)
  useEffect(() => {
    if (!isActive) {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
      return
    }

    // Send initial heartbeat
    const initHeartbeat = async () => {
      const success = await sendHeartbeat()
      
      // Only set up interval if initial heartbeat succeeds
      if (success) {
        heartbeatInterval.current = setInterval(() => {
          sendHeartbeat()
        }, 60000) // 60 seconds
      }
    }
    
    initHeartbeat()

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }
    }
  }, [isActive])

  // Set up presence fetching interval (every 30 seconds)
  useEffect(() => {
    if (userIds.length === 0) return

    // Fetch immediately - wrap in async IIFE to avoid setState in effect warning
    void (async () => {
      await fetchPresence()
    })()

    // Set up interval
    presenceFetchInterval.current = setInterval(() => {
      void fetchPresence()
    }, 30000) // 30 seconds

    return () => {
      if (presenceFetchInterval.current) {
        clearInterval(presenceFetchInterval.current)
      }
    }
  }, [userIds.join(','), fetchPresence]) // Re-run if userIds change

  // Helper to get presence for a specific user
  const getPresence = (userId: string) => {
    return presenceData[userId] || { isOnline: false, lastActiveAt: null }
  }

  // Helper to format last seen
  const formatLastSeen = (lastActiveAt: string | null): string => {
    if (!lastActiveAt) return 'Never'

    const now = new Date()
    const lastActive = new Date(lastActiveAt)
    const diffMs = now.getTime() - lastActive.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    
    return lastActive.toLocaleDateString()
  }

  return {
    presenceData,
    getPresence,
    formatLastSeen,
    refetch: fetchPresence
  }
}
