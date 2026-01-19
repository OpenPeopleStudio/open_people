import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { redactErrorMessage } from '../lib/privacy'

const DELETION_DELAY_DAYS = 30 // Grace period before permanent deletion

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { confirmEmail, immediate } = await request.json()

    // Verify email confirmation
    if (confirmEmail !== user.email) {
      return NextResponse.json(
        { error: 'Email confirmation does not match' },
        { status: 400 }
      )
    }

    // Check if there's already a pending deletion request
    const { data: existingRequest } = await supabase
      .from('account_deletions')
      .select('id, status, scheduled_for')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json({
        error: 'Deletion request already pending',
        scheduled_for: existingRequest.scheduled_for,
      }, { status: 409 })
    }

    // Check for active orders that aren't completed
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .in('status', ['pending', 'paid', 'fulfilled', 'shipped'])

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete account with active orders',
        active_orders: activeOrders.length,
        message: 'Please wait for all orders to be completed or contact support',
      }, { status: 400 })
    }

    const scheduledFor = immediate 
      ? new Date()
      : new Date(Date.now() + DELETION_DELAY_DAYS * 24 * 60 * 60 * 1000)

    // Create deletion request
    const { data: deletionRequest, error: deletionError } = await supabase
      .from('account_deletions')
      .insert({
        user_id: user.id,
        tenant_id: tenant?.id,
        email: user.email || '',
        requested_at: new Date().toISOString(),
        scheduled_for: scheduledFor.toISOString(),
        status: immediate ? 'completed' : 'scheduled',
        requested_by: user.id,
      })
      .select('id')
      .single()

    if (deletionError || !deletionRequest) {
      throw new Error('Failed to create deletion request')
    }

    // If immediate deletion, process it now
    if (immediate) {
      await processAccountDeletion(user.id, tenant?.id || null, deletionRequest.id, supabase)
    }

    // Log the deletion request
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'account_deletion_requested',
      entity_type: 'user_account',
      entity_id: user.id,
      details: {
        scheduled_for: scheduledFor.toISOString(),
        immediate: immediate || false,
        grace_period_days: immediate ? 0 : DELETION_DELAY_DAYS,
      },
    })

    return NextResponse.json({
      success: true,
      deletion_request_id: deletionRequest.id,
      scheduled_for: scheduledFor.toISOString(),
      grace_period_days: immediate ? 0 : DELETION_DELAY_DAYS,
      message: immediate 
        ? 'Account data has been deleted'
        : `Account deletion scheduled for ${scheduledFor.toLocaleDateString()}. You can cancel this request before then.`,
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to process deletion request', 'Unable to delete account') },
      { status: 500 }
    )
  }
}

// Cancel a scheduled deletion
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: deletionRequest } = await supabase
      .from('account_deletions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .eq('status', 'scheduled')
      .maybeSingle()

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'No scheduled deletion found' },
        { status: 404 }
      )
    }

    // Cancel the deletion request
    await supabase
      .from('account_deletions')
      .update({ status: 'cancelled' })
      .eq('id', deletionRequest.id)

    // Log the cancellation
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'account_deletion_cancelled',
      entity_type: 'user_account',
      entity_id: user.id,
      details: {
        deletion_request_id: deletionRequest.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Account deletion cancelled',
    })
  } catch (error) {
    console.error('Deletion cancellation error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to cancel deletion', 'Unable to cancel deletion') },
      { status: 500 }
    )
  }
}

// Helper function to process account deletion
async function processAccountDeletion(
  userId: string,
  tenantId: string | null,
  deletionRequestId: string,
  supabase: any
) {
  try {
    // 1. Anonymize order data (keep for business records)
    const { data: orderAnonymization } = await supabase
      .rpc('anonymize_order_data', {
        p_user_id: userId,
        p_tenant_id: tenantId,
      })

    // 2. Delete personal data
    const { data: personalDataDeletion } = await supabase
      .rpc('delete_user_personal_data', {
        p_user_id: userId,
        p_tenant_id: tenantId,
      })

    // 3. Update deletion request with results
    await supabase
      .from('account_deletions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        anonymization_details: {
          orders_anonymized: orderAnonymization?.[0] || 0,
          personal_data_deleted: personalDataDeletion || {},
          completed_at: new Date().toISOString(),
        },
      })
      .eq('id', deletionRequestId)

    // 4. Delete user from auth (this will cascade delete the profile)
    // Note: This requires service role key and should be done carefully
    // await supabase.auth.admin.deleteUser(userId)

    return {
      success: true,
      orders_anonymized: orderAnonymization?.[0] || 0,
      personal_data_deleted: personalDataDeletion,
    }
  } catch (error) {
    console.error('Error processing account deletion:', error)
    throw error
  }
}
