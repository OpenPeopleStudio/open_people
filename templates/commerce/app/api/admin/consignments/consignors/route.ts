import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  let profileQuery = supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
  if (tenant?.id) {
    profileQuery = profileQuery.eq('tenant_id', tenant.id)
  }
  const { data: profile } = await profileQuery.single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { name, email, phone, commissionRate } = await request.json()

    const { data: consignor, error } = await supabase
      .from('consignors')
      .insert({
        tenant_id: tenant?.id,
        name,
        email,
        phone,
        commission_rate: commissionRate,
        balance_cents: 0,
        total_sales_cents: 0,
        total_paid_cents: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ consignor })

  } catch (error) {
    console.error('Add consignor error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to add consignor'
    }, { status: 500 })
  }
}
