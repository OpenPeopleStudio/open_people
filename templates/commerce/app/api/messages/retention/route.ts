import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { redactErrorMessage } from '../lib/privacy'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { customerId, enabled, days } = await request.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  const isAdmin = hasAdminAccess(profile?.role)
  const targetCustomerId = customerId || user.id

  if (customerId && !isAdmin) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const retentionDays = enabled ? Math.max(1, Number(days || 0)) : null
  const retentionEnabled = Boolean(enabled)

  const { error } = await supabase
    .from('profiles')
    .update({
      message_retention_enabled: retentionEnabled,
      message_retention_days: retentionEnabled ? retentionDays : null,
    })
    .eq('id', targetCustomerId)
    .eq('tenant_id', tenant?.id)

  if (error) {
    return NextResponse.json({ error: redactErrorMessage('Failed to update retention') }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    retention_enabled: retentionEnabled,
    retention_days: retentionDays,
  })
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const customerId = url.searchParams.get('customerId')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  const isAdmin = hasAdminAccess(profile?.role)
  const targetCustomerId = customerId || user.id

  if (customerId && !isAdmin) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('message_retention_enabled, message_retention_days')
    .eq('id', targetCustomerId)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!targetProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    retention_enabled: Boolean(targetProfile.message_retention_enabled),
    retention_days: targetProfile.message_retention_days || null,
  })
}
