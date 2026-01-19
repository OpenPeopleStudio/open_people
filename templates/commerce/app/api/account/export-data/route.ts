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
    // Fetch user profile
    const { data: profile } = await supabase
      .from('709_profiles')
      .select('*')
      .eq('id', user.id)
      .eq('tenant_id', tenant?.id)
      .single()

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          variant:product_variants (
            sku,
            size,
            condition,
            product:products (brand, model, name)
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .order('created_at', { ascending: false })

    // Fetch messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('customer_id', user.id)
      .eq('tenant_id', tenant?.id)
      .order('created_at', { ascending: false })

    // Fetch wishlist
    const { data: wishlist } = await supabase
      .from('wishlist_items')
      .select(`
        *,
        product:products (id, name, brand, model, slug)
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)

    // Fetch recently viewed
    const { data: recentlyViewed } = await supabase
      .from('recently_viewed')
      .select(`
        *,
        product:products (id, name, brand, model, slug)
      `)
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .order('viewed_at', { ascending: false })

    // Fetch stock alerts
    const { data: stockAlerts } = await supabase
      .from('stock_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)

    // Fetch drop alerts
    const { data: dropAlerts } = await supabase
      .from('drop_alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)

    // Fetch user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .maybeSingle()

    // Fetch staff locations (if staff role)
    let staffLocations = null
    if (profile?.role && ['staff', 'admin', 'owner'].includes(profile.role)) {
      const { data } = await supabase
        .from('staff_locations')
        .select('recorded_at, latitude, longitude, accuracy_m, task_id, source')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant?.id)
        .order('recorded_at', { ascending: false })
        .limit(500)
      staffLocations = data
    }

    // Fetch consignment data (if consignor)
    const { data: consignmentItems } = await supabase
      .from('consignment_items')
      .select(`
        *,
        consignor:consignors (name, email, commission_rate)
      `)
      .eq('tenant_id', tenant?.id)
      .or(`consignor_id.in.(select id from consignors where email = '${user.email}')`)

    // Fetch activity logs related to user
    const { data: activityLogs } = await supabase
      .from('activity_logs')
      .select('action, entity_type, entity_id, details, created_at')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .order('created_at', { ascending: false })
      .limit(500)

    // Compile comprehensive data export
    const exportData = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        tenant: {
          id: tenant?.id,
          slug: tenant?.slug,
          name: tenant?.name,
        },
        export_type: 'complete_user_data',
        format_version: '1.0',
      },
      profile: {
        ...profile,
        // Include encryption keys if present
        public_key: profile?.public_key || null,
        message_retention_enabled: profile?.message_retention_enabled || false,
        message_retention_days: profile?.message_retention_days || null,
      },
      authentication: {
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      orders: {
        total_count: orders?.length || 0,
        data: orders || [],
      },
      messages: {
        total_count: messages?.length || 0,
        data: messages || [],
        note: 'Encrypted messages can only be decrypted with your private key',
      },
      wishlist: {
        total_count: wishlist?.length || 0,
        data: wishlist || [],
      },
      recently_viewed: {
        total_count: recentlyViewed?.length || 0,
        data: recentlyViewed || [],
      },
      alerts: {
        stock_alerts: stockAlerts || [],
        drop_alerts: dropAlerts || [],
      },
      preferences: preferences || null,
      staff_data: staffLocations ? {
        total_location_points: staffLocations.length,
        locations: staffLocations,
        note: 'Location data is automatically deleted after retention period',
      } : null,
      consignment_data: consignmentItems && consignmentItems.length > 0 ? {
        total_items: consignmentItems.length,
        items: consignmentItems,
      } : null,
      activity_logs: {
        total_count: activityLogs?.length || 0,
        recent_activities: activityLogs || [],
        note: 'Showing up to 500 most recent activities',
      },
    }

    // Log the export request
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'data_export_requested',
      entity_type: 'user_data',
      entity_id: user.id,
      details: {
        orders_count: orders?.length || 0,
        messages_count: messages?.length || 0,
        export_timestamp: new Date().toISOString(),
      },
    })

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="709exclusive-data-export-${user.id}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to export data', 'Unable to complete data export') },
      { status: 500 }
    )
  }
}
