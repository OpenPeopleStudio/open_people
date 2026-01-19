'use client'

import { useEffect, useRef, useState } from 'react'
import { type StaffLocation, type StaffLocationStatus } from '@/hooks/useStaffLocations'

// Leaflet CSS must be imported in a client component
import 'leaflet/dist/leaflet.css'

type StaffLocationMapProps = {
  locations: StaffLocation[]
  selectedUserId?: string | null
  onSelectLocation?: (userId: string) => void
  showTrails?: boolean
  className?: string
}

// Status colors matching 709EXCLUSIVE design system
const STATUS_COLORS: Record<StaffLocationStatus, { primary: string; glow: string; pulse: boolean }> = {
  live: { primary: '#00FF88', glow: 'rgba(0, 255, 136, 0.6)', pulse: true },
  recent: { primary: '#00F0FF', glow: 'rgba(0, 240, 255, 0.6)', pulse: false },
  stale: { primary: '#A855F7', glow: 'rgba(168, 85, 247, 0.6)', pulse: false },
  unknown: { primary: '#6B6B80', glow: 'rgba(107, 107, 128, 0.6)', pulse: false },
}

export default function StaffLocationMap({
  locations,
  selectedUserId,
  onSelectLocation,
  showTrails = false,
  className = '',
}: StaffLocationMapProps) {
  const mapRef = useRef<any>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      if (!mapRef.current || mapInstanceRef.current) return

      // Create map instance with dark tiles
      const map = L.map(mapRef.current, {
        center: [47.5615, -52.7126], // St. John's, NL
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
        // Enable touch interactions for mobile
        touchZoom: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        // Better performance on mobile
        preferCanvas: true,
      })

      // Dark theme tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      setMapLoaded(true)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Create custom marker icon
  const createMarkerIcon = async (status: StaffLocationStatus, isSelected: boolean) => {
    const L = (await import('leaflet')).default
    const colors = STATUS_COLORS[status]
    const size = isSelected ? 48 : 36
    const pulseClass = colors.pulse ? 'animate-pulse' : ''

    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-${status}">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="8" fill="${colors.primary}" filter="url(#glow-${status})" opacity="0.3"/>
        <circle cx="12" cy="12" r="6" fill="${colors.primary}" stroke="#000" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="#fff"/>
      </svg>
    `

    return L.divIcon({
      html: `<div class="${pulseClass}" style="filter: drop-shadow(0 0 8px ${colors.glow});">${svg}</div>`,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }

  // Update markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || locations.length === 0) return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current

      // Remove markers that no longer exist
      const currentUserIds = new Set(locations.map(l => l.user_id))
      markersRef.current.forEach((marker, userId) => {
        if (!currentUserIds.has(userId)) {
          marker.remove()
          markersRef.current.delete(userId)
        }
      })

      // Add or update markers
      for (const location of locations) {
        const isSelected = location.user_id === selectedUserId
        const icon = await createMarkerIcon(location.status, isSelected)

        let marker = markersRef.current.get(location.user_id)

        if (marker) {
          // Update existing marker
          marker.setLatLng([location.lat, location.lng])
          marker.setIcon(icon)
        } else {
          // Create new marker
          marker = L.marker([location.lat, location.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="
                background: rgba(17, 17, 24, 0.95);
                border: 1px solid ${STATUS_COLORS[location.status].primary};
                border-radius: 12px;
                padding: 12px;
                color: #fff;
                font-family: system-ui;
                min-width: 200px;
              ">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">
                  ${location.name || `Staff ${location.user_id.slice(-6)}`}
                </div>
                <div style="font-size: 12px; color: #C4C4D6; margin-bottom: 4px;">
                  Status: <span style="color: ${STATUS_COLORS[location.status].primary}; text-transform: uppercase; font-weight: 600;">${location.status}</span>
                </div>
                <div style="font-size: 11px; color: #6B6B80;">
                  Last update: ${new Date(location.recorded_at).toLocaleTimeString()}
                </div>
                ${location.accuracy_m ? `
                  <div style="font-size: 11px; color: #6B6B80;">
                    Accuracy: ±${Math.round(location.accuracy_m)}m
                  </div>
                ` : ''}
              </div>
            `)

          if (onSelectLocation) {
            marker.on('click', () => {
              onSelectLocation(location.user_id)
            })
          }

          markersRef.current.set(location.user_id, marker)
        }

        // Open popup for selected marker
        if (isSelected) {
          marker.openPopup()
        }
      }

      // Fit bounds to show all markers
      if (locations.length > 0) {
        const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      }
    }

    updateMarkers()
  }, [locations, mapLoaded, selectedUserId, onSelectLocation])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden border border-[var(--border-primary)] touch-pan-y touch-pinch-zoom"
        style={{ 
          minHeight: '400px',
          touchAction: 'pan-x pan-y pinch-zoom'
        }}
      />
      
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm rounded-xl">
          <div className="text-center">
            <div className="text-[var(--text-muted)] text-sm">
              No staff locations available
            </div>
            <div className="text-[var(--text-muted)] text-xs mt-2">
              Staff members need to opt-in and share their location
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        
        .leaflet-popup-tip {
          background: rgba(17, 17, 24, 0.95) !important;
        }
        
        .leaflet-control-zoom {
          border: 1px solid var(--border-primary) !important;
          border-radius: 12px !important;
          overflow: hidden;
          background: var(--bg-secondary) !important;
          z-index: 400 !important;
        }
        
        .leaflet-pane {
          z-index: 400 !important;
        }
        
        .leaflet-top,
        .leaflet-bottom {
          z-index: 400 !important;
        }
        
        .leaflet-control-zoom a {
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border-bottom: 1px solid var(--border-primary) !important;
          transition: all 0.2s ease;
        }
        
        .leaflet-control-zoom a:hover {
          background: var(--bg-tertiary) !important;
          color: var(--accent) !important;
        }
        
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}
