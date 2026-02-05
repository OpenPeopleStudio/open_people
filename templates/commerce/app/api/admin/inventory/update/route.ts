import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { getTenantFromRequest } from '../lib/tenant'
import { SupabaseClient } from '@supabase/supabase-js'

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

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!hasAdminAccess(await getUserRole(supabase, user.id, tenant?.id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { variantId, stock, priceCents } = body

    if (!variantId) {
      return NextResponse.json({ error: 'Variant ID required' }, { status: 400 })
    }

    // Build update object
    const updates: Record<string, number> = {}
    if (typeof stock === 'number') {
      updates.stock = Math.max(0, stock)
    }
    if (typeof priceCents === 'number') {
      updates.price_cents = Math.max(0, priceCents)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    // Update variant
    let updateQuery = supabase
      .from('product_variants')
      .update(updates)
      .eq('id', variantId)

    if (tenant?.id) {
      updateQuery = updateQuery.eq('tenant_id', tenant.id)
    }

    const { error } = await updateQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}
