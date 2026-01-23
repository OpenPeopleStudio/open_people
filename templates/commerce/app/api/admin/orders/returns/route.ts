import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
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

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    let returnsQuery = supabase
      .from('returns')
      .select(`
        *,
        order:orders(id, shipping_address, status)
      `)
      .order('created_at', { ascending: false })

    if (tenant?.id) {
      returnsQuery = returnsQuery.eq('tenant_id', tenant.id)
    }

    const { data: returns } = await returnsQuery

    // Transform to include customer info from shipping_address
    const transformedReturns = returns?.map(ret => {
      const shippingAddress = ret.order?.shipping_address as {
        name?: string
        email?: string
      } | null
      return {
        ...ret,
        order: ret.order ? {
          id: ret.order.id,
          status: ret.order.status,
          customer_email: shippingAddress?.email || '',
          shipping_name: shippingAddress?.name || ''
        } : null
      }
    }) || []

    return NextResponse.json({ returns: transformedReturns })

  } catch (error) {
    console.error('Returns fetch error:', error)
    return NextResponse.json({ returns: [] })
  }
}

export async function PATCH(request: Request) {
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

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { returnId, status } = await request.json()

    const updateData: Record<string, unknown> = { status }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    let updateQuery = supabase
      .from('returns')
      .update(updateData)
      .eq('id', returnId)
      .select()

    if (tenant?.id) {
      updateQuery = updateQuery.eq('tenant_id', tenant.id)
    }

    const { data: returnRecord, error } = await updateQuery.single()

    if (error) throw error

    return NextResponse.json({ return: returnRecord })

  } catch (error) {
    console.error('Return update error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update return'
    }, { status: 500 })
  }
}
