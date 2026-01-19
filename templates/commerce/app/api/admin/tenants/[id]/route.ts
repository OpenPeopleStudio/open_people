import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isOwner } from '../lib/roles'

const TENANT_STATUSES = new Set(['active', 'inactive', 'suspended'])
const BILLING_STATUSES = new Set(['trialing', 'active', 'past_due', 'canceled'])

export async function PATCH(
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

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('status')
    .eq('id', resolvedParams.id)
    .single()

  const { data: existingBilling } = await supabase
    .from('tenant_billing')
    .select('plan, status, billing_email')
    .eq('tenant_id', resolvedParams.id)
    .single()

  let payload: {
    status?: string
    plan?: string
    billingStatus?: string
    billingEmail?: string
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const tenantUpdates: Record<string, unknown> = {}
  if (typeof payload.status === 'string') {
    if (!TENANT_STATUSES.has(payload.status)) {
      return NextResponse.json({ error: 'Invalid tenant status' }, { status: 400 })
    }
    tenantUpdates.status = payload.status
  }

  if (Object.keys(tenantUpdates).length > 0) {
    const { error } = await supabase
      .from('tenants')
      .update(tenantUpdates)
      .eq('id', resolvedParams.id)
    if (error) {
      console.error('Tenant update error:', error)
      return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
    }
  }

  const billingUpdates: Record<string, unknown> = { tenant_id: resolvedParams.id }
  if (typeof payload.plan === 'string' && payload.plan.trim()) {
    billingUpdates.plan = payload.plan.trim()
  }
  if (typeof payload.billingStatus === 'string') {
    if (!BILLING_STATUSES.has(payload.billingStatus)) {
      return NextResponse.json({ error: 'Invalid billing status' }, { status: 400 })
    }
    billingUpdates.status = payload.billingStatus
  }
  if (typeof payload.billingEmail === 'string') {
    billingUpdates.billing_email = payload.billingEmail.trim().toLowerCase() || null
  }

  if (Object.keys(billingUpdates).length > 1) {
    const { error } = await supabase
      .from('tenant_billing')
      .upsert(billingUpdates, { onConflict: 'tenant_id' })
    if (error) {
      console.error('Tenant billing update error:', error)
      return NextResponse.json({ error: 'Failed to update billing' }, { status: 500 })
    }
  }

  const { data: updated, error: fetchError } = await supabase
    .from('tenants')
    .select(`
      id,
      name,
      slug,
      status,
      primary_domain,
      settings,
      created_at,
      updated_at,
      tenant_domains(domain, is_primary, verified_at),
      tenant_billing(plan, status, billing_email, trial_ends_at)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (fetchError) {
    console.error('Tenant fetch error:', fetchError)
    return NextResponse.json({ error: 'Failed to load tenant' }, { status: 500 })
  }

  const tenantStatusChanged =
    typeof tenantUpdates.status === 'string' &&
    tenantUpdates.status !== existingTenant?.status

  const billingChanges: Record<string, { previous: string | null; next: string | null }> = {}
  if (typeof billingUpdates.plan === 'string' && billingUpdates.plan !== existingBilling?.plan) {
    billingChanges.plan = { previous: existingBilling?.plan ?? null, next: billingUpdates.plan }
  }
  if (typeof billingUpdates.status === 'string' && billingUpdates.status !== existingBilling?.status) {
    billingChanges.status = { previous: existingBilling?.status ?? null, next: billingUpdates.status }
  }
  if (Object.prototype.hasOwnProperty.call(billingUpdates, 'billing_email') &&
      billingUpdates.billing_email !== existingBilling?.billing_email) {
    billingChanges.billing_email = {
      previous: existingBilling?.billing_email ?? null,
      next: (billingUpdates.billing_email as string | null) ?? null,
    }
  }

  const auditEntries = []
  if (tenantStatusChanged) {
    auditEntries.push({
      tenant_id: resolvedParams.id,
      user_id: user.id,
      user_email: user.email,
      action: 'tenant_status_updated',
      entity_type: 'tenant',
      entity_id: resolvedParams.id,
      details: {
        previous: existingTenant?.status ?? null,
        next: tenantUpdates.status,
      },
    })
  }
  if (Object.keys(billingChanges).length > 0) {
    auditEntries.push({
      tenant_id: resolvedParams.id,
      user_id: user.id,
      user_email: user.email,
      action: 'tenant_billing_updated',
      entity_type: 'tenant_billing',
      entity_id: resolvedParams.id,
      details: billingChanges,
    })
  }

  if (auditEntries.length > 0) {
    await supabase.from('activity_logs').insert(auditEntries)
  }

  return NextResponse.json({ tenant: updated })
}
