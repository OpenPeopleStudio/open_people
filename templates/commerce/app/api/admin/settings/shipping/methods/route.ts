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

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { supabase, user, tenant } = auth

  try {
    const body = await request.json()
    const { code, updates } = body as {
      code: string
      updates: Record<string, unknown>
    }

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Shipping method code required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (typeof updates.label === 'string') updateData.label = updates.label.trim()
    if (typeof updates.description === 'string' || updates.description === null) updateData.description = updates.description
    if (typeof updates.active === 'boolean') updateData.active = updates.active
    if (typeof updates.sort_order === 'number' && Number.isFinite(updates.sort_order)) {
      updateData.sort_order = Math.round(updates.sort_order)
    }
    if (typeof updates.amount_cents === 'number' && Number.isFinite(updates.amount_cents)) {
      updateData.amount_cents = Math.max(0, Math.round(updates.amount_cents))
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('shipping_methods')
      .update(updateData)
      .eq('code', code)
      .eq('tenant_id', tenant?.id)

    if (error) throw error

    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'update_shipping_method',
      entity_type: 'shipping_method',
      entity_id: code,
      details: updateData
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update shipping method error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update shipping method' },
      { status: 500 }
    )
  }
}

