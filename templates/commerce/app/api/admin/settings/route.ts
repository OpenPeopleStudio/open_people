import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

type Role = 'owner' | 'admin' | 'staff' | 'customer'

async function getAuthedRole(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  const role = (profile?.role || 'customer') as Role
  return { supabase, user, role, full_name: profile?.full_name || null, tenant }
}

export async function GET(request: Request) {
  const auth = await getAuthedRole(request)
  if ('error' in auth) return auth.error

  if (!['admin', 'owner'].includes(auth.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab')

  try {
    if (tab === 'me') {
      return NextResponse.json({
        id: auth.user.id,
        email: auth.user.email || null,
        role: auth.role,
        full_name: auth.full_name,
      })
    }

    if (tab === 'users') {
      const { data: profiles } = await auth.supabase
        .from('profiles')
        .select('id, role, full_name, created_at')
        .eq('tenant_id', auth.tenant?.id)
        .order('created_at', { ascending: false })

      // Try to get user emails - this requires either:
      // 1. Service role key access to auth.users
      // 2. Storing email in profiles table
      // For now, we'll try to get emails via a custom RPC or fall back to ID-based display
      
      // Attempt to fetch user data via service role (if configured)
      const authUsers: Record<string, { email: string; last_sign_in_at: string | null }> = {}
      
      try {
        // This uses the service role to list users - only works if SUPABASE_SERVICE_ROLE_KEY is set
        const { createClient } = await import('@supabase/supabase-js')
        const serviceClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const { data: authData } = await serviceClient.auth.admin.listUsers()
          if (authData?.users) {
            for (const u of authData.users) {
              authUsers[u.id] = { 
                email: u.email || '', 
                last_sign_in_at: u.last_sign_in_at || null 
              }
            }
          }
        }
      } catch {
        // Service role not available, continue without emails
        console.log('Service role not available for user emails')
      }

      const users = profiles?.map(p => ({
        id: p.id,
        email: authUsers[p.id]?.email || `User ${p.id.slice(0, 8)}`,
        full_name: p.full_name,
        role: p.role,
        created_at: p.created_at,
        last_sign_in: authUsers[p.id]?.last_sign_in_at || null
      })) || []

      return NextResponse.json({ users })
    }

    if (tab === 'activity') {
      const { data: logs } = await auth.supabase
        .from('activity_logs')
        .select('*')
        .eq('tenant_id', auth.tenant?.id)
        .order('created_at', { ascending: false })
        .limit(100)

      return NextResponse.json({ logs: logs || [] })
    }

    if (tab === 'pricing') {
      const { data: rules } = await auth.supabase
        .from('pricing_rules')
        .select('*')
        .eq('tenant_id', auth.tenant?.id)
        .order('rule_type', { ascending: true })

      return NextResponse.json({ rules: rules || [] })
    }

    if (tab === 'shipping') {
      const { data: shippingMethods } = await auth.supabase
        .from('shipping_methods')
        .select('*')
        .eq('tenant_id', auth.tenant?.id)
        .order('sort_order', { ascending: true })

      const { data: deliveryZones } = await auth.supabase
        .from('local_delivery_zones')
        .select('*')
        .eq('tenant_id', auth.tenant?.id)
        .order('sort_order', { ascending: true })

      return NextResponse.json({
        shippingMethods: shippingMethods || [],
        deliveryZones: deliveryZones || []
      })
    }

    return NextResponse.json({})

  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await getAuthedRole(request)
  if ('error' in auth) return auth.error

  if (auth.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: string; confirm?: string }
    | null

  if (!body || body.action !== 'purge_customers') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (body.confirm !== 'DELETE ALL CUSTOMERS') {
    return NextResponse.json({ error: 'Confirmation text mismatch' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Clear all messages first.
  let messagesQuery = adminClient
    .from('messages')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (auth.tenant?.id) {
    messagesQuery = messagesQuery.eq('tenant_id', auth.tenant.id)
  }

  const { error: messagesError, count: messagesDeleted } = await messagesQuery

  if (messagesError) {
    console.error('Purge messages error:', messagesError)
    return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 })
  }

  const { data: customers, error: customersError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'customer')
    .eq('tenant_id', auth.tenant?.id)

  if (customersError) {
    console.error('Purge customers fetch error:', customersError)
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 })
  }

  const customerIds = (customers || []).map((c) => c.id).filter(Boolean)

  // Unlink blocking foreign keys so auth.users deletion can proceed.
  for (const customerId of customerIds) {
    await adminClient.from('orders').update({ customer_id: null }).eq('customer_id', customerId).eq('tenant_id', auth.tenant?.id)
    await adminClient.from('activity_logs').update({ user_id: null, user_email: null }).eq('user_id', customerId).eq('tenant_id', auth.tenant?.id)
    await adminClient.from('operations').update({ created_by: null }).eq('created_by', customerId).eq('tenant_id', auth.tenant?.id)

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(customerId)
    if (deleteError) {
      console.error('Delete user error:', customerId, deleteError)
    }
  }

  return NextResponse.json({
    ok: true,
    messages_deleted: messagesDeleted ?? null,
    customers_targeted: customerIds.length,
  })
}
