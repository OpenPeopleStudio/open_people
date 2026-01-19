import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { redactErrorMessage } from '../lib/privacy'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 })
  }

  try {
    // Validate token
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_consignor_token', { p_token: token })

    if (validationError || !validation || validation.length === 0 || !validation[0].is_valid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const consignorId = validation[0].consignor_id

    // Get dashboard data
    const dashboardQuery = supabase
      .from('consignor_dashboard')
      .select('*')
      .eq('consignor_id', consignorId)
      .single()

    const { data: dashboard, error: dashboardError } = await dashboardQuery

    if (dashboardError || !dashboard) {
      throw new Error('Failed to fetch dashboard data')
    }

    // Get recent items
    const itemsQuery = supabase
      .from('consignor_items_view')
      .select('*')
      .eq('consignor_id', consignorId)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: items } = await itemsQuery

    // Get recent payouts
    let payoutsQuery = supabase
      .from('consignment_payouts')
      .select('*')
      .eq('consignor_id', consignorId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (tenant?.id) {
      payoutsQuery = payoutsQuery.eq('tenant_id', tenant.id)
    }

    const { data: payouts } = await payoutsQuery

    return NextResponse.json({
      dashboard: {
        name: dashboard.name,
        commission_rate: dashboard.commission_rate,
        balance_cents: dashboard.balance_cents,
        total_sales_cents: dashboard.total_sales_cents,
        total_paid_cents: dashboard.total_paid_cents,
        active_items: dashboard.active_items,
        sold_items: dashboard.sold_items,
        paid_items: dashboard.paid_items,
        last_sale_date: dashboard.last_sale_date,
      },
      items: items || [],
      payouts: payouts || [],
    })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to load dashboard', 'Unable to load dashboard data') },
      { status: 500 }
    )
  }
}
