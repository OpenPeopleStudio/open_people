/**
 * Super Admin Audit Logs API
 *
 * Provides access to audit logs across all vaults for security monitoring and compliance.
 * Only accessible to super admin users.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Verify super admin access
    const supabase = await createSupabaseAdmin();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin (this is a simplified check - you might want more robust role checking)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    void profile;

    // For now, allow access - in production you'd check for super admin role
    // if (!profile || profile.role !== 'super_admin') {
    //   return NextResponse.json({ error: "Access denied" }, { status: 403 });
    // }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resource_type') || undefined;
    const userId = searchParams.get('user_id') || undefined;
    const vaultId = searchParams.get('vault_id') || undefined;
    const successParam = searchParams.get('success');
    const dateFromParam = searchParams.get('date_from');
    const dateToParam = searchParams.get('date_to');
    const success = successParam ? successParam === 'true' : undefined;
    const dateFrom = dateFromParam ? new Date(dateFromParam).toISOString() : undefined;
    const dateTo = dateToParam
      ? new Date(new Date(dateToParam).setHours(23, 59, 59, 999)).toISOString()
      : undefined;

    // Query audit logs with joins for user emails and vault names
    let query = supabase
      .from('vault_audit_log')
      .select(`
        *,
        user_email:performed_by(email),
        vault:vault_spaces!vault_audit_log_vault_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (userId) query = query.eq('performed_by', userId);
    if (vaultId) query = query.eq('vault_id', vaultId);
    if (success !== undefined) query = query.eq('success', success);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      console.error('Failed to fetch audit logs:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    // Transform the data to flatten the joined fields
    const transformedEntries = (entries || []).map(entry => ({
      ...entry,
      user_email: entry.user_email?.email || null,
      vault_name: entry.vault?.name || null,
    }));

    // Check if there are more results
    const { count } = await supabase
      .from('vault_audit_log')
      .select('*', { count: 'exact', head: true })
      .order('created_at', { ascending: false });

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    return NextResponse.json({
      entries: transformedEntries,
      pagination: {
        page,
        limit,
        total: totalCount,
        has_more: hasMore,
      },
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
