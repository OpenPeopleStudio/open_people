import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isOwner } from '../lib/roles'
import { createBillingPortalSession } from '@/lib/stripe'

async function requireOwner(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!tenant?.id) {
    return { error: NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!isOwner(profile?.role)) {
    return { error: NextResponse.json({ error: 'Owner access required' }, { status: 403 }) }
  }

  return { supabase, tenant }
}

export async function GET(request: Request) {
  const auth = await requireOwner(request)
  if ('error' in auth) return auth.error

  const { supabase, tenant } = auth
  const { data: billing } = await supabase
    .from('tenant_billing')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single()

  return NextResponse.json({ billing: billing || null })
}

export async function PATCH(request: Request) {
  const auth = await requireOwner(request)
  if ('error' in auth) return auth.error

  const { supabase, tenant } = auth

  let payload: { billingEmail?: string; plan?: string }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { tenant_id: tenant.id }

  if (typeof payload.billingEmail === 'string') {
    updates.billing_email = payload.billingEmail.trim().toLowerCase() || null
  }
  if (typeof payload.plan === 'string' && payload.plan.trim()) {
    updates.plan = payload.plan.trim()
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data: billing, error } = await supabase
    .from('tenant_billing')
    .upsert(updates, { onConflict: 'tenant_id' })
    .select()
    .single()

  if (error) {
    console.error('Billing update error:', error)
    return NextResponse.json({ error: 'Failed to update billing' }, { status: 500 })
  }

  return NextResponse.json({ billing })
}

export async function POST(request: Request) {
  const auth = await requireOwner(request)
  if ('error' in auth) return auth.error

  const { supabase, tenant } = auth
  const { data: billing } = await supabase
    .from('tenant_billing')
    .select('stripe_customer_id')
    .eq('tenant_id', tenant.id)
    .single()

  if (!billing?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
  }

  try {
    const origin = new URL(request.url).origin
    const session = await createBillingPortalSession({
      customerId: billing.stripe_customer_id,
      returnUrl: `${origin}/admin/tenant-settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
}
