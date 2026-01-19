/**
 * Data Retention Policy Engine
 * 
 * Manages automated data cleanup and retention policies
 */

export interface RetentionPolicy {
  id: string
  policy_name: string
  table_name: string
  retention_days: number
  delete_column: string
  enabled: boolean
  last_run_at: string | null
}

export interface RetentionExecution {
  policy_name: string
  rows_deleted: number
  status: 'success' | 'failed' | 'partial'
  error_message?: string
}

/**
 * Execute a single retention policy
 */
export async function executeRetentionPolicy(
  supabase: any,
  policyId: string
): Promise<{ rows_deleted: number; success: boolean }> {
  try {
    const { data, error } = await supabase
      .rpc('execute_retention_policy', { p_policy_id: policyId })

    if (error) {
      throw error
    }

    return {
      rows_deleted: data || 0,
      success: true,
    }
  } catch (error) {
    console.error('Retention policy execution error:', error)
    return {
      rows_deleted: 0,
      success: false,
    }
  }
}

/**
 * Execute all enabled retention policies
 */
export async function executeAllRetentionPolicies(
  supabase: any
): Promise<RetentionExecution[]> {
  try {
    const { data, error } = await supabase.rpc('execute_all_retention_policies')

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Execute all policies error:', error)
    return []
  }
}

/**
 * Cleanup expired message attachments
 */
export async function cleanupMessageAttachments(
  supabase: any
): Promise<{ deleted: number }> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_message_attachments')

    if (error) {
      throw error
    }

    return { deleted: data || 0 }
  } catch (error) {
    console.error('Message attachment cleanup error:', error)
    return { deleted: 0 }
  }
}

/**
 * Cleanup expired user consents
 */
export async function cleanupExpiredConsents(
  supabase: any
): Promise<{ expired: number }> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_consents')

    if (error) {
      throw error
    }

    return { expired: data || 0 }
  } catch (error) {
    console.error('Consent cleanup error:', error)
    return { expired: 0 }
  }
}

/**
 * Archive old orders
 */
export async function archiveOldOrders(
  supabase: any,
  years: number = 7
): Promise<{ archived: number }> {
  try {
    const { data, error } = await supabase.rpc('archive_old_orders', { p_years: years })

    if (error) {
      throw error
    }

    return { archived: data || 0 }
  } catch (error) {
    console.error('Order archival error:', error)
    return { archived: 0 }
  }
}
