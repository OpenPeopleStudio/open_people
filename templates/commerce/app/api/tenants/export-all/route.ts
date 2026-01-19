import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { redactErrorMessage } from '../lib/privacy'

/**
 * Full tenant data export (for migration/backup)
 * Only accessible to tenant owners
 */
export async function GET(request: Request) {
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

  // Only owners can export full tenant data
  if (profile?.role !== 'owner') {
    return NextResponse.json(
      { error: 'Owner access required for full tenant export' },
      { status: 403 }
    )
  }

  if (!tenant?.id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  try {
    // Export all tenant data
    const exportData: any = {
      export_metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        tenant_name: tenant.name,
        generated_at: new Date().toISOString(),
        exported_by: user.email,
        format_version: '1.0',
        purpose: 'full_tenant_backup',
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        settings: tenant.settings,
      },
    }

    // Products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.products = products || []

    // Product variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.product_variants = variants || []

    // Product images
    const { data: productImages } = await supabase
      .from('product_images')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.product_images = productImages || []

    // Product models
    const { data: models } = await supabase
      .from('product_models')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.product_models = models || []

    // Orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.orders = orders || []

    // Order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.order_items = orderItems || []

    // Customers (profiles)
    const { data: customers } = await supabase
      .from('709_profiles')
      .select('id, role, full_name, created_at')
      .eq('tenant_id', tenant.id)
    exportData.customers = customers || []

    // Messages (encrypted)
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.messages = messages || []

    // Consignors
    const { data: consignors } = await supabase
      .from('consignors')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.consignors = consignors || []

    // Consignment items
    const { data: consignmentItems } = await supabase
      .from('consignment_items')
      .select('*')
      .eq('tenant_id', tenant.id)
    exportData.consignment_items = consignmentItems || []

    // Inventory audit
    const { data: inventoryAudit } = await supabase
      .from('inventory_audit')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(1000)
    exportData.inventory_audit = inventoryAudit || []

    // Activity logs
    const { data: activityLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(1000)
    exportData.activity_logs = activityLogs || []

    // Log the export
    await supabase.from('activity_logs').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      user_email: user.email,
      action: 'tenant_full_export',
      entity_type: 'tenant',
      entity_id: tenant.id,
      details: {
        products: products?.length || 0,
        orders: orders?.length || 0,
        customers: customers?.length || 0,
        messages: messages?.length || 0,
      },
    })

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tenant-export-${tenant.slug}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Tenant export error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Export failed', 'Unable to export tenant data') },
      { status: 500 }
    )
  }
}
