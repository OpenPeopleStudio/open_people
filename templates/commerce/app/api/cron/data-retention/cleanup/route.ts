import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import {
  executeAllRetentionPolicies,
  cleanupMessageAttachments,
  cleanupExpiredConsents,
  archiveOldOrders,
} from '@/lib/retention/policies'

/**
 * Master data retention cleanup job
 * Should be run daily via Vercel Cron or similar
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/data-retention/cleanup",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'dev-secret'

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseServer()
  const startTime = Date.now()

  try {
    console.log('Starting data retention cleanup...')

    // Execute all retention policies
    const policyResults = await executeAllRetentionPolicies(supabase)
    console.log('Retention policies executed:', policyResults)

    // Cleanup message attachments
    const attachmentCleanup = await cleanupMessageAttachments(supabase)
    console.log('Message attachments cleaned:', attachmentCleanup)

    // Cleanup expired consents
    const consentCleanup = await cleanupExpiredConsents(supabase)
    console.log('Expired consents cleaned:', consentCleanup)

    // Archive old orders (7+ years)
    const orderArchival = await archiveOldOrders(supabase, 7)
    console.log('Orders archived:', orderArchival)

    const duration = Date.now() - startTime

    // Log the cleanup execution
    await supabase.from('activity_logs').insert({
      user_id: null,
      action: 'data_retention_cleanup',
      entity_type: 'system',
      entity_id: null,
      details: {
        duration_ms: duration,
        policy_executions: policyResults.length,
        total_rows_deleted: policyResults.reduce((sum, r) => sum + r.rows_deleted, 0),
        attachments_deleted: attachmentCleanup.deleted,
        consents_expired: consentCleanup.expired,
        orders_archived: orderArchival.archived,
        executed_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      executed_at: new Date().toISOString(),
      duration_ms: duration,
      results: {
        policies: policyResults,
        attachments_deleted: attachmentCleanup.deleted,
        consents_expired: consentCleanup.expired,
        orders_archived: orderArchival.archived,
      },
      summary: {
        total_policies: policyResults.length,
        successful_policies: policyResults.filter(p => p.status === 'success').length,
        total_rows_deleted: policyResults.reduce((sum, r) => sum + r.rows_deleted, 0),
      },
    })
  } catch (error) {
    console.error('Data retention cleanup error:', error)

    // Log the error
    await supabase.from('activity_logs').insert({
      user_id: null,
      action: 'data_retention_cleanup_failed',
      entity_type: 'system',
      entity_id: null,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        executed_at: new Date().toISOString(),
      },
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
