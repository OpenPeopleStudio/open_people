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
    .from('709_profiles')
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
    const { consignorId, amountCents, method, notes } = await request.json()

    // Create payout record
    const { data: payout, error: payoutError } = await supabase
      .from('consignment_payouts')
      .insert({
        tenant_id: tenant?.id,
        consignor_id: consignorId,
        amount_cents: amountCents,
        method,
        notes,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (payoutError) throw payoutError

    // Update consignor balance
    const { error: updateError } = await supabase.rpc('update_consignor_balance', {
      p_consignor_id: consignorId,
      p_amount_cents: -amountCents
    })

    // If RPC doesn't exist, do manual update
    if (updateError) {
      let consignorUpdate = supabase
        .from('consignors')
        .update({
          balance_cents: supabase.rpc('subtract', { value: amountCents }),
          total_paid_cents: supabase.rpc('add', { value: amountCents })
        })
        .eq('id', consignorId)
      if (tenant?.id) {
        consignorUpdate = consignorUpdate.eq('tenant_id', tenant.id)
      }
      await consignorUpdate
    }

    return NextResponse.json({ payout })

  } catch (error) {
    console.error('Record payout error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to record payout'
    }, { status: 500 })
  }
}
