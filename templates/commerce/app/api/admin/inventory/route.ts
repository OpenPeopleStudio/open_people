import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!hasAdminAccess(await getUserRole(supabase, user.id!, tenant?.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Fetch variants with availability
    let variantsQuery = supabase
      .from('variant_availability')
      .select('*')
      .order('sku')

    if (tenant?.id) {
      variantsQuery = variantsQuery.eq('tenant_id', tenant.id)
    }

    const { data: variants, error: variantsError } = await variantsQuery

    if (variantsError) throw variantsError

    // Fetch audit history (recent 100)
    let auditQuery = supabase
      .from('inventory_audit')
      .select(`
        *,
        product_variants!inner(sku)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (tenant?.id) {
      auditQuery = auditQuery.eq('tenant_id', tenant.id)
    }

    const { data: auditHistory, error: auditError } = await auditQuery

    if (auditError) throw auditError

    return NextResponse.json({ variants, auditHistory })
  } catch (error) {
    console.error('Admin inventory fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string, tenantId?: string): Promise<string | undefined> {
  let query = supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()

  return profile?.role
}