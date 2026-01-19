import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { createStripeCustomer } from '@/lib/stripe'

const TRIAL_DAYS = 14

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const isValidSlug = (value: string) =>
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)

const normalizeDomain = (value: string) => value.trim().toLowerCase()

const isValidDomain = (value: string) =>
  /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: {
    name?: string
    slug?: string
    primaryDomain?: string
    billingEmail?: string
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const rawSlug = typeof payload.slug === 'string' ? payload.slug : name
  const slug = normalizeSlug(rawSlug)
  const primaryDomain = typeof payload.primaryDomain === 'string'
    ? normalizeDomain(payload.primaryDomain)
    : ''
  const billingEmail = typeof payload.billingEmail === 'string'
    ? payload.billingEmail.trim().toLowerCase()
    : (user.email || '')

  if (!name || !slug) {
    return NextResponse.json({ error: 'Tenant name and slug are required' }, { status: 400 })
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Invalid tenant slug' }, { status: 400 })
  }

  if (primaryDomain && !isValidDomain(primaryDomain)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingTenant) {
    return NextResponse.json({ error: 'Tenant slug already in use' }, { status: 409 })
  }

  if (primaryDomain) {
    const { data: existingDomain } = await supabase
      .from('tenant_domains')
      .select('id')
      .eq('domain', primaryDomain)
      .maybeSingle()

    if (existingDomain) {
      return NextResponse.json({ error: 'Domain already claimed' }, { status: 409 })
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      primary_domain: primaryDomain || null,
      settings: {
        theme: { brand_name: name },
      },
    })
    .select('id, name, slug, primary_domain, settings')
    .single()

  if (tenantError || !tenant) {
    console.error('Tenant creation error:', tenantError)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Create Stripe customer
  let stripeCustomerId: string | null = null
  try {
    const customer = await createStripeCustomer({
      email: billingEmail || user.email || '',
      name: name,
      metadata: {
        tenant_id: tenant.id,
        tenant_slug: tenant.slug,
      },
    })
    stripeCustomerId = customer.id
  } catch (err) {
    console.error('Stripe customer creation error:', err)
    // Continue without Stripe - can be set up later
  }

  const { error: billingError } = await supabase
    .from('tenant_billing')
    .insert({
      tenant_id: tenant.id,
      billing_email: billingEmail || null,
      plan: 'starter',
      status: 'trialing',
      trial_ends_at: trialEndsAt,
      stripe_customer_id: stripeCustomerId,
    })

  if (billingError) {
    console.error('Tenant billing error:', billingError)
    return NextResponse.json({ error: 'Failed to initialize billing' }, { status: 500 })
  }

  if (primaryDomain) {
    const { error: domainError } = await supabase
      .from('tenant_domains')
      .insert({
        tenant_id: tenant.id,
        domain: primaryDomain,
        is_primary: true,
      })

    if (domainError) {
      console.error('Tenant domain error:', domainError)
      return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
    }
  }

  const { error: profileError } = await supabase
    .from('709_profiles')
    .update({
      role: 'owner',
      tenant_id: tenant.id,
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('Profile update error:', profileError)
    return NextResponse.json({ error: 'Failed to assign tenant owner' }, { status: 500 })
  }

  // Log tenant creation
  await supabase.from('activity_logs').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    user_email: user.email,
    action: 'tenant_created',
    entity_type: 'tenant',
    entity_id: tenant.id,
    details: {
      name: tenant.name,
      slug: tenant.slug,
      source: 'self_serve_signup',
    },
  })

  return NextResponse.json({ tenant })
}
