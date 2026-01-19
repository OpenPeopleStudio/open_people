import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

async function requireAdmin(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, error: 'Unauthorized', status: 401 as const }
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return { supabase, error: 'Admin access required', status: 403 as const }
  }

  return { supabase, user, tenant }
}

function normalizeStringArray(value: unknown, opts?: { upper?: boolean; maxLen?: number; sliceLen?: number }) {
  if (!Array.isArray(value)) return null
  const upper = opts?.upper ?? false
  const maxLen = opts?.maxLen ?? 100
  const sliceLen = opts?.sliceLen

  const cleaned = value
    .filter(v => typeof v === 'string')
    .map(v => v.trim())
    .filter(Boolean)
    .map(v => {
      const normalized = upper ? v.toUpperCase() : v
      const stripped = upper ? normalized.replace(/[^A-Z0-9]/g, '') : normalized
      return sliceLen ? stripped.slice(0, sliceLen) : stripped
    })
    .filter(Boolean)

  return Array.from(new Set(cleaned)).slice(0, maxLen)
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { supabase, user, tenant } = auth

  try {
    const body = await request.json()
    const { id, updates } = body as {
      id: string
      updates: Record<string, unknown>
    }

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Zone id required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (typeof updates.name === 'string') updateData.name = updates.name.trim()
    if (typeof updates.active === 'boolean') updateData.active = updates.active
    if (typeof updates.sort_order === 'number' && Number.isFinite(updates.sort_order)) {
      updateData.sort_order = Math.round(updates.sort_order)
    }

    const cityNames = normalizeStringArray(updates.city_names)
    if (cityNames) updateData.city_names = cityNames

    const fsas = normalizeStringArray(updates.postal_fsa_prefixes, { upper: true, maxLen: 200, sliceLen: 3 })
    if (fsas) updateData.postal_fsa_prefixes = fsas

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('local_delivery_zones')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenant?.id)

    if (error) throw error

    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'update_local_delivery_zone',
      entity_type: 'local_delivery_zone',
      entity_id: id,
      details: updateData
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update local delivery zone error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update delivery zone' },
      { status: 500 }
    )
  }
}

