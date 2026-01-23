import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isStaff } from '../lib/roles'
import { redactErrorMessage } from '../lib/privacy'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!isStaff(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  const days = parseInt(searchParams.get('days') || '7')

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('staff_locations')
      .select('recorded_at, latitude, longitude, accuracy_m, task_id, source')
      .eq('user_id', user.id)
      .gte('recorded_at', startDate)
      .order('recorded_at', { ascending: false })

    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id)
    }

    const { data: locations, error } = await query

    if (error) {
      throw error
    }

    // Log the export request
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'location_data_exported',
      entity_type: 'staff_location',
      entity_id: user.id,
      details: {
        format,
        days,
        location_count: locations?.length || 0,
      },
    })

    if (format === 'csv') {
      // Export as CSV
      let csv = 'Timestamp,Latitude,Longitude,Accuracy (m),Task ID,Source\n'
      for (const loc of locations || []) {
        csv += `${loc.recorded_at},${loc.latitude},${loc.longitude},${loc.accuracy_m || ''},${loc.task_id || ''},${loc.source}\n`
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="location-history-${user.id}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else if (format === 'geojson') {
      // Export as GeoJSON for mapping applications
      const geojson = {
        type: 'FeatureCollection',
        features: (locations || []).map((loc) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [loc.longitude, loc.latitude],
          },
          properties: {
            timestamp: loc.recorded_at,
            accuracy_m: loc.accuracy_m,
            task_id: loc.task_id,
            source: loc.source,
          },
        })),
      }

      return new NextResponse(JSON.stringify(geojson, null, 2), {
        headers: {
          'Content-Type': 'application/geo+json',
          'Content-Disposition': `attachment; filename="location-history-${user.id}-${new Date().toISOString().split('T')[0]}.geojson"`,
        },
      })
    } else {
      // Export as JSON
      const exportData = {
        export_metadata: {
          user_id: user.id,
          user_name: profile?.full_name,
          generated_at: new Date().toISOString(),
          period_days: days,
          total_locations: locations?.length || 0,
        },
        locations: locations || [],
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="location-history-${user.id}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }
  } catch (error) {
    console.error('Location export error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to export location data', 'Unable to export location history') },
      { status: 500 }
    )
  }
}
