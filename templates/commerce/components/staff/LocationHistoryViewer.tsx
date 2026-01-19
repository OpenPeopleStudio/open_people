'use client'

import { useEffect, useState } from 'react'
import Surface from '../../../components/ui/Surface'
import Button from '../../../components/ui/Button'

interface LocationPoint {
  recorded_at: string
  latitude: number
  longitude: number
  accuracy_m: number | null
  task_id: string | null
  source: string
}

interface LocationHistoryProps {
  userId?: string
  days?: number
}

export default function LocationHistoryViewer({ userId, days = 7 }: LocationHistoryProps) {
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(days)

  useEffect(() => {
    fetchLocationHistory()
  }, [selectedPeriod])

  const fetchLocationHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = new Date(Date.now() - selectedPeriod * 24 * 60 * 60 * 1000).toISOString()
      
      const query = `/api/staff/location?windowHours=${selectedPeriod * 24}&maxPerStaff=500`
      
      const response = await fetch(query)
      if (!response.ok) {
        throw new Error('Failed to fetch location history')
      }

      const data = await response.json()
      
      // Extract user's own locations
      const userLocations = data.staff?.[0]?.trail || []
      setLocations(userLocations.map((loc: any) => ({
        recorded_at: loc.recorded_at,
        latitude: loc.lat,
        longitude: loc.lng,
        accuracy_m: loc.accuracy_m,
        task_id: null,
        source: 'web',
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load location history')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv' | 'geojson') => {
    try {
      const response = await fetch(`/api/staff/location/export?format=${format}&days=${selectedPeriod}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `location-history.${format === 'geojson' ? 'geojson' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const groupLocationsByDay = () => {
    const grouped = new Map<string, LocationPoint[]>()
    
    for (const loc of locations) {
      const date = new Date(loc.recorded_at).toLocaleDateString()
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(loc)
    }
    
    return Array.from(grouped.entries()).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    )
  }

  const calculateDailyStats = (dayLocations: LocationPoint[]) => {
    const hours = new Set(
      dayLocations.map(loc => new Date(loc.recorded_at).getHours())
    ).size
    
    const avgAccuracy = dayLocations
      .filter(loc => loc.accuracy_m !== null)
      .reduce((sum, loc) => sum + (loc.accuracy_m || 0), 0) / dayLocations.length
    
    return {
      points: dayLocations.length,
      hours,
      avgAccuracy: Math.round(avgAccuracy),
    }
  }

  if (loading) {
    return (
      <Surface padding="md">
        <div className="text-center py-8">
          <div className="text-[var(--text-muted)]">Loading location history...</div>
        </div>
      </Surface>
    )
  }

  const groupedLocations = groupLocationsByDay()

  return (
    <div className="space-y-4">
      <Surface padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Location History
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {locations.length} location points in the last {selectedPeriod} days
            </p>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
              className="px-3 py-1.5 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded"
            >
              <option value="1">Last 24 hours</option>
              <option value="2">Last 2 days</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => handleExport('json')}
            variant="ghost"
            size="sm"
          >
            Export JSON
          </Button>
          <Button
            onClick={() => handleExport('csv')}
            variant="ghost"
            size="sm"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport('geojson')}
            variant="ghost"
            size="sm"
          >
            Export GeoJSON
          </Button>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)]">No location data in this period</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedLocations.map(([date, dayLocations]) => {
              const stats = calculateDailyStats(dayLocations)
              return (
                <div key={date} className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
                  <div className="bg-[var(--bg-secondary)] px-4 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {date}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {stats.points} points • {stats.hours} hours • ±{stats.avgAccuracy}m avg accuracy
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {dayLocations.slice(0, 10).map((loc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 bg-[var(--bg-primary)] rounded"
                        >
                          <div className="flex-1">
                            <div className="text-[var(--text-secondary)]">
                              {new Date(loc.recorded_at).toLocaleTimeString()}
                            </div>
                            <div className="text-[var(--text-muted)] font-mono">
                              {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                            </div>
                          </div>
                          {loc.accuracy_m !== null && (
                            <div className="text-[var(--text-muted)]">
                              ±{Math.round(loc.accuracy_m)}m
                            </div>
                          )}
                        </div>
                      ))}
                      {dayLocations.length > 10 && (
                        <div className="text-xs text-center text-[var(--text-muted)] py-2">
                          + {dayLocations.length - 10} more locations
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Surface>

      <Surface padding="md" variant="outline">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
          Privacy & Data Retention
        </h3>
        <div className="text-xs text-[var(--text-muted)] space-y-2">
          <p>
            Location data is automatically deleted after 48 hours by default. You can export your data at any time.
          </p>
          <p>
            Only you and dispatch administrators can view your location history. Exported data belongs to you.
          </p>
        </div>
      </Surface>
    </div>
  )
}
