import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isOwner } from '../lib/roles'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!tenant?.id) {
    return NextResponse.json({ error: 'Tenant not resolved' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!isOwner(profile?.role)) {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  if (tenant.slug !== '709exclusive') {
    return NextResponse.json({ error: 'Internal access required' }, { status: 403 })
  }

  const resolvedParams = await params
  if (!resolvedParams?.id) {
    return NextResponse.json({ error: 'Tenant id required' }, { status: 400 })
  }

  try {
    const { data: billing } = await supabase
      .from('tenant_billing')
      .select('stripe_customer_id')
      .eq('tenant_id', resolvedParams.id)
      .single()

    if (!billing?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const session = await createBillingPortalSession({
      customerId: billing.stripe_customer_id,
      returnUrl: `${origin}/admin/tenants`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
}
