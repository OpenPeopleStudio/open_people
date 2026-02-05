import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isAdmin } from '../lib/roles'
import type { TenantSettings } from '../types/tenant'

async function requireAdmin(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!tenant?.id) {
    return { error: NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!isAdmin(profile?.role)) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  return { supabase, tenant }
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { supabase, tenant } = auth
  const { data: row } = await supabase
    .from('tenants')
    .select('id, name, slug, status, primary_domain, settings, created_at, updated_at')
    .eq('id', tenant.id)
    .single()

  return NextResponse.json({ tenant: row || null })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { supabase, tenant } = auth

  let payload: { name?: string; settings?: TenantSettings }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data: current } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenant.id)
    .single()

  const currentSettings = (current?.settings || {}) as TenantSettings
  const incoming = payload.settings || {}

  const merged: TenantSettings = {
    ...currentSettings,
    ...incoming,
    theme: {
      ...currentSettings.theme,
      ...incoming.theme,
      colors: {
        ...currentSettings.theme?.colors,
        ...incoming.theme?.colors,
      },
    },
    content: {
      ...currentSettings.content,
      ...incoming.content,
    },
    features: {
      ...currentSettings.features,
      ...incoming.features,
    },
    integrations: {
      ...currentSettings.integrations,
      ...incoming.integrations,
    },
    commerce: {
      ...currentSettings.commerce,
      ...incoming.commerce,
    },
  }

  const updates: Record<string, unknown> = { settings: merged }
  if (typeof payload.name === 'string' && payload.name.trim()) {
    updates.name = payload.name.trim()
  }

  const { data: updated, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenant.id)
    .select('id, name, slug, status, primary_domain, settings, created_at, updated_at')
    .single()

  if (error) {
    console.error('Tenant settings update error:', error)
    return NextResponse.json({ error: 'Failed to update tenant settings' }, { status: 500 })
  }

  return NextResponse.json({ tenant: updated })
}
