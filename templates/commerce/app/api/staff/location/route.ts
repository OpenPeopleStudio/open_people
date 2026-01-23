import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { isStaff } from '../lib/roles'
import { redactErrorMessage } from '../lib/privacy'
import { getTenantFromRequest } from '../lib/tenant'

const RETENTION_HOURS = 48
const MAX_WINDOW_HOURS = 72
const MAX_POINTS_PER_STAFF = 200
const MAX_ROWS = 5000
const MAX_RECORDING_PAST_MINUTES = 15
const MAX_RECORDING_FUTURE_MINUTES = 5

type LocationEvent = 'start' | 'stop'

const parseNumber = (value: unknown) => {
  const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const isValidLatLng = (lat: number, lng: number) =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, staff_location_opt_in')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!isStaff(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  if (!profile?.staff_location_opt_in) {
    return NextResponse.json({ error: 'Location sharing is disabled' }, { status: 403 })
  }

  let payload: Record<string, unknown> = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const lat = parseNumber(payload.lat)
  const lng = parseNumber(payload.lng)
  const accuracy = parseNumber(payload.accuracy)
  const recordedAt = typeof payload.recordedAt === 'string' ? payload.recordedAt : null
  const taskId = typeof payload.taskId === 'string' ? payload.taskId : null
  const event = (payload.event === 'start' || payload.event === 'stop') ? payload.event : null
  
  // E2E encryption support
  const encryptedLocation = payload.encryptedLocation && typeof payload.encryptedLocation === 'object'
    ? payload.encryptedLocation as Record<string, unknown>
    : null
  const encryptionKeyId = typeof payload.encryptionKeyId === 'string' ? payload.encryptionKeyId : null

  const hasCoords = lat !== null && lng !== null
  const hasEncrypted = encryptedLocation !== null
  
  if (!hasCoords && !hasEncrypted && !event) {
    return NextResponse.json({ error: 'Location or event required' }, { status: 400 })
  }

  if (hasCoords && !isValidLatLng(lat, lng)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const now = new Date()
  const parsedRecordedAt = recordedAt ? new Date(recordedAt) : null
  if (recordedAt && (!parsedRecordedAt || Number.isNaN(parsedRecordedAt.getTime()))) {
    return NextResponse.json({ error: 'Invalid recordedAt' }, { status: 400 })
  }
  if (parsedRecordedAt) {
    const diffMs = parsedRecordedAt.getTime() - now.getTime()
    if (
      diffMs > MAX_RECORDING_FUTURE_MINUTES * 60 * 1000 ||
      diffMs < -MAX_RECORDING_PAST_MINUTES * 60 * 1000
    ) {
      return NextResponse.json({ error: 'recordedAt out of range' }, { status: 400 })
    }
  }

  try {
    if (event) {
      const action =
        event === 'start'
          ? 'staff_location_tracking_started'
          : 'staff_location_tracking_stopped'

      await supabase.from('activity_logs').insert({
        tenant_id: tenant?.id,
        user_id: user.id,
        user_email: user.email,
        action,
        entity_type: 'staff_location',
        entity_id: user.id,
        details: {
          source: 'web',
          task_id: taskId,
          name: profile?.full_name || null,
        },
      })
    }

    if (!hasCoords) {
      return NextResponse.json({ success: true, recorded: false })
    }

    const effectiveRecordedAt = parsedRecordedAt ?? now
    const expiresAt = new Date(effectiveRecordedAt.getTime() + RETENTION_HOURS * 60 * 60 * 1000)
    const normalizedAccuracy = accuracy !== null ? Math.max(0, accuracy) : null

    // Prepare insert data (without encrypted fields for now - will be enabled after migration)
    const insertData: Record<string, unknown> = {
      tenant_id: tenant?.id,
      user_id: user.id,
      recorded_at: effectiveRecordedAt.toISOString(),
      latitude: lat,
      longitude: lng,
      accuracy_m: normalizedAccuracy,
      task_id: taskId,
      source: 'web',
      expires_at: expiresAt.toISOString(),
    }

    // TODO: Re-enable encrypted location after running migration 041
    // if (hasEncrypted && encryptedLocation) {
    //   insertData.encrypted_location = encryptedLocation
    //   insertData.encryption_key_id = encryptionKeyId
    // }

    const { data, error } = await supabase
      .from('staff_locations')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: redactErrorMessage('Failed to save location') }, { status: 500 })
    }

    return NextResponse.json({ success: true, recorded: Boolean(data?.id) })
  } catch (error) {
    console.error('Staff location error:', error)
    return NextResponse.json({ error: redactErrorMessage('Location update failed') }, { status: 500 })
  }
}

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

  const url = new URL(request.url)
  const windowHours = clamp(
    parseNumber(url.searchParams.get('windowHours')) ?? 48,
    1,
    MAX_WINDOW_HOURS
  )
  const maxPerStaff = clamp(
    parseNumber(url.searchParams.get('maxPerStaff')) ?? 60,
    5,
    MAX_POINTS_PER_STAFF
  )
  const limit = clamp(
    parseNumber(url.searchParams.get('limit')) ?? 2000,
    50,
    MAX_ROWS
  )

  const now = new Date()
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000)

  let locationsQuery = supabase
    .from('staff_locations')
    .select('user_id, recorded_at, latitude, longitude, accuracy_m')
    .gte('recorded_at', since.toISOString())
    .gt('expires_at', now.toISOString())
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (tenant?.id) {
    locationsQuery = locationsQuery.eq('tenant_id', tenant.id)
  }

  const { data: locations, error } = await locationsQuery

  if (error) {
    return NextResponse.json({ error: redactErrorMessage('Failed to load locations') }, { status: 500 })
  }

  if (!locations || locations.length === 0) {
    return NextResponse.json({ staff: [] })
  }

  const userIds = Array.from(new Set(locations.map((row) => row.user_id)))
  let profilesQuery = supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', userIds)

  if (tenant?.id) {
    profilesQuery = profilesQuery.eq('tenant_id', tenant.id)
  }

  const { data: profiles } = await profilesQuery

  const profileById = new Map(
    (profiles || []).map((entry) => [entry.id, entry])
  )

  const grouped = new Map<string, {
    user_id: string
    name: string | null
    role: string | null
    trail: Array<{
      lat: number
      lng: number
      accuracy_m: number | null
      recorded_at: string
    }>
  }>()

  for (const row of locations) {
    const existing = grouped.get(row.user_id)
    const profileEntry = profileById.get(row.user_id)
    const name = profileEntry?.full_name || null
    const role = profileEntry?.role || null

    if (!existing) {
      grouped.set(row.user_id, {
        user_id: row.user_id,
        name,
        role,
        trail: [],
      })
    }

    const entry = grouped.get(row.user_id)
    if (!entry) continue
    if (entry.trail.length >= maxPerStaff) continue

    entry.trail.push({
      lat: row.latitude,
      lng: row.longitude,
      accuracy_m: row.accuracy_m,
      recorded_at: row.recorded_at,
    })
  }

  const staff = Array.from(grouped.values())
    .filter((entry) => ['staff', 'admin', 'owner'].includes(entry.role || ''))
    .map((entry) => {
      const trail = [...entry.trail].reverse()
      return {
        user_id: entry.user_id,
        name: entry.name,
        latest: trail[trail.length - 1] || null,
        trail,
      }
    })
    .sort((a, b) => {
      const aTime = a.latest ? new Date(a.latest.recorded_at).getTime() : 0
      const bTime = b.latest ? new Date(b.latest.recorded_at).getTime() : 0
      return bTime - aTime
    })

  return NextResponse.json({
    staff,
    window_hours: windowHours,
    max_per_staff: maxPerStaff,
  })
}
