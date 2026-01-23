import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { redactErrorMessage } from '../lib/privacy'
import { getTenantFromRequest } from '../lib/tenant'
import { isStaff } from '../lib/roles'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!isStaff(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const now = new Date().toISOString()

  try {
    let deleteQuery = supabase
      .from('staff_locations')
      .delete()
      .lt('expires_at', now)
      .select('id')

    if (tenant?.id) {
      deleteQuery = deleteQuery.eq('tenant_id', tenant.id)
    }

    const { data, error } = await deleteQuery

    if (error) {
      return NextResponse.json({ error: redactErrorMessage('Failed to purge locations') }, { status: 500 })
    }

    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'cleanup_staff_locations',
      entity_type: 'staff_location',
      entity_id: null,
      details: { deleted: data?.length || 0 },
    })

    return NextResponse.json({ success: true, deleted: data?.length || 0 })
  } catch (error) {
    console.error('Staff location cleanup error:', error)
    return NextResponse.json({ error: redactErrorMessage('Cleanup failed') }, { status: 500 })
  }
}
