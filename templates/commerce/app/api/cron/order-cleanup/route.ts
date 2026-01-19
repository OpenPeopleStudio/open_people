import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { releaseStalePendingOrders } from '@/lib/workflows/order-automation'

/**
 * Cron job to clean up stale pending orders
 * Should be run hourly via Vercel Cron or similar
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'dev-secret'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServer()

  try {
    // Get all tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, slug')
      .eq('status', 'active')

    const results = []

    for (const tenant of tenants || []) {
      const result = await releaseStalePendingOrders(supabase, tenant.id)
      results.push({
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
        orders_released: result.released,
      })

      // Log the cleanup
      if (result.released > 0) {
        await supabase.from('activity_logs').insert({
          tenant_id: tenant.id,
          user_id: null,
          action: 'stale_orders_cleanup',
          entity_type: 'order',
          entity_id: null,
          details: {
            orders_released: result.released,
            executed_at: new Date().toISOString(),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      executed_at: new Date().toISOString(),
      results,
      total_released: results.reduce((sum, r) => sum + r.orders_released, 0),
    })
  } catch (error) {
    console.error('Order cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
