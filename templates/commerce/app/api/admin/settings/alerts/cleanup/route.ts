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

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Get stuck reservations
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    let reservationsQuery = supabase
      .from('inventory_reservations')
      .select('id, variant_id, quantity')
      .lt('created_at', thirtyMinutesAgo)
      .eq('status', 'pending')

    if (tenant?.id) {
      reservationsQuery = reservationsQuery.eq('tenant_id', tenant.id)
    }

    const { data: reservations } = await reservationsQuery

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ message: 'No stuck reservations to clean up' })
    }

    // Release each reservation
    for (const res of reservations) {
      // Add stock back
      await supabase.rpc('release_inventory_reservation', {
        p_reservation_id: res.id
      })
    }

    // If RPC doesn't exist, manually release
    let deleteQuery = supabase
      .from('inventory_reservations')
      .delete()
      .lt('created_at', thirtyMinutesAgo)
      .eq('status', 'pending')

    if (tenant?.id) {
      deleteQuery = deleteQuery.eq('tenant_id', tenant.id)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Delete error:', deleteError)
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'cleanup_reservations',
      entity_type: 'inventory_reservation',
      entity_id: null,
      details: { count: reservations.length }
    })

    return NextResponse.json({
      success: true,
      released: reservations.length
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to clean up'
    }, { status: 500 })
  }
}
