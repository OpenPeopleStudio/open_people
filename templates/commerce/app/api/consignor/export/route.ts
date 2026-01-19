import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { redactErrorMessage } from '../lib/privacy'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const format = searchParams.get('format') || 'json'

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
    const consignorEmail = validation[0].email

    // Get consignor details
    let consignorQuery = supabase
      .from('consignors')
      .select('*')
      .eq('id', consignorId)

    if (tenant?.id) {
      consignorQuery = consignorQuery.eq('tenant_id', tenant.id)
    }

    const { data: consignor } = await consignorQuery.single()

    // Get all items
    const itemsQuery = supabase
      .from('consignor_items_view')
      .select('*')
      .eq('consignor_id', consignorId)
      .order('created_at', { ascending: false })

    const { data: items } = await itemsQuery

    // Get all payouts
    let payoutsQuery = supabase
      .from('consignment_payouts')
      .select('*')
      .eq('consignor_id', consignorId)
      .order('created_at', { ascending: false })

    if (tenant?.id) {
      payoutsQuery = payoutsQuery.eq('tenant_id', tenant.id)
    }

    const { data: payouts } = await payoutsQuery

    // Log export
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: null,
      user_email: consignorEmail,
      action: 'consignor_data_exported',
      entity_type: 'consignor',
      entity_id: consignorId,
      details: {
        format,
        items_count: items?.length || 0,
        payouts_count: payouts?.length || 0,
      },
    })

    if (format === 'csv') {
      // Export as CSV
      let csv = 'Consignment Items\n'
      csv += 'SKU,Product,Size,Condition,Status,List Price,Sold Price,Commission,Payout,Created,Sold\n'
      for (const item of items || []) {
        csv += `${item.sku || ''},${item.product_name || ''},${item.size || ''},${item.condition || ''},${item.status},`
        csv += `${(item.list_price_cents / 100).toFixed(2)},${item.sold_price_cents ? (item.sold_price_cents / 100).toFixed(2) : ''},`
        csv += `${item.commission_cents ? (item.commission_cents / 100).toFixed(2) : ''},${item.payout_cents ? (item.payout_cents / 100).toFixed(2) : ''},`
        csv += `${item.created_at || ''},${item.sold_at || ''}\n`
      }

      csv += '\n\nPayouts\n'
      csv += 'Amount,Method,Status,Notes,Created,Completed\n'
      for (const payout of payouts || []) {
        csv += `${(payout.amount_cents / 100).toFixed(2)},${payout.method || ''},${payout.status},${payout.notes || ''},${payout.created_at || ''},${payout.completed_at || ''}\n`
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="consignment-data-${consignorId}.csv"`,
        },
      })
    } else {
      // Export as JSON
      const exportData = {
        export_metadata: {
          consignor_id: consignorId,
          consignor_name: consignor?.name,
          generated_at: new Date().toISOString(),
          format_version: '1.0',
        },
        consignor: {
          name: consignor?.name,
          email: consignor?.email,
          commission_rate: consignor?.commission_rate,
          balance_cents: consignor?.balance_cents,
          total_sales_cents: consignor?.total_sales_cents,
          total_paid_cents: consignor?.total_paid_cents,
        },
        items: items || [],
        payouts: payouts || [],
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="consignment-data-${consignorId}.json"`,
        },
      })
    }
  } catch (error) {
    console.error('Consignor export error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Export failed', 'Unable to export consignment data') },
      { status: 500 }
    )
  }
}
