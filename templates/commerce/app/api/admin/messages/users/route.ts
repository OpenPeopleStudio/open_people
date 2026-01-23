import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Use service role client to get auth users
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const { data: tenantProfiles } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('tenant_id', tenant?.id)

    const profileById = new Map((tenantProfiles || []).map(p => [p.id, p]))
    const allowedIds = new Set((tenantProfiles || []).map(p => p.id))

    // Map users to a simpler format
    const users = authData.users
      .filter(u => allowedIds.has(u.id))
      .map(u => ({
      id: u.id,
      email: u.email || '',
      full_name: profileById.get(u.id)?.full_name || u.user_metadata?.full_name || null,
      role: profileById.get(u.id)?.role || null,
      created_at: u.created_at,
    }))

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
