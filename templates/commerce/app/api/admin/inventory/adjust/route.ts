import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { SupabaseClient } from '@supabase/supabase-js'
import { adjustInventory } from '@/lib/inventory'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!hasAdminAccess(await getUserRole(supabase, user.id!, tenant?.id))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { variantId, adjustment, reason }: {
    variantId: string
    adjustment: number
    reason: string
  } = await req.json()

  if (!variantId || !reason.trim()) {
    return NextResponse.json({ error: 'Variant ID and reason required' }, { status: 400 })
  }

  try {
    await adjustInventory(variantId, adjustment, reason, user.id, tenant?.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 })
  }
}

async function getUserRole(supabase: SupabaseClient, userId: string, tenantId?: string): Promise<string | undefined> {
  let query = supabase
    .from('709_profiles')
    .select('role')
    .eq('id', userId)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data: profile } = await query.single()

  return profile?.role
}