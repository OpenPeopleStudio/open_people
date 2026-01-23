import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { redactErrorMessage } from '../lib/privacy'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, created_at, message_retention_enabled, message_retention_days, staff_location_opt_in')
      .eq('id', user.id)
      .eq('tenant_id', tenant?.id)
      .single()

    // Count orders
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)

    // Count messages
    const { count: messagesCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', user.id)
      .eq('tenant_id', tenant?.id)

    // Count wishlist items
    const { count: wishlistCount } = await supabase
      .from('wishlist_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)

    // Count location points (if staff)
    let locationCount = 0
    if (profile?.role && ['staff', 'admin', 'owner'].includes(profile.role)) {
      const { count } = await supabase
        .from('staff_locations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('tenant_id', tenant?.id)
      locationCount = count || 0
    }

    // Get recent data exports
    const { data: recentExports } = await supabase
      .from('data_exports')
      .select('created_at, export_type')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get active consents
    const { data: consents } = await supabase
      .rpc('get_user_consents', {
        p_user_id: user.id,
        p_tenant_id: tenant?.id,
      })

    const activeConsents = consents?.filter((c: any) => c.consent_given).length || 0
    const totalConsents = consents?.length || 0

    // Check for pending deletion
    const { data: deletionRequest } = await supabase
      .from('account_deletions')
      .select('scheduled_for, status')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .eq('status', 'scheduled')
      .maybeSingle()

    return NextResponse.json({
      account: {
        created_at: profile?.created_at,
        account_age_days: Math.floor(
          (Date.now() - new Date(profile?.created_at || 0).getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
      data_stored: {
        orders: ordersCount || 0,
        messages: messagesCount || 0,
        wishlist_items: wishlistCount || 0,
        location_points: locationCount,
      },
      privacy_settings: {
        message_retention_enabled: profile?.message_retention_enabled || false,
        message_retention_days: profile?.message_retention_days || null,
        location_sharing_enabled: profile?.staff_location_opt_in || false,
        active_consents: activeConsents,
        total_consents: totalConsents,
      },
      data_exports: {
        total: recentExports?.length || 0,
        recent: recentExports || [],
      },
      deletion_request: deletionRequest || null,
    })
  } catch (error) {
    console.error('Privacy stats error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to load privacy stats', 'Unable to load statistics') },
      { status: 500 }
    )
  }
}
