import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { requireSuperAdmin as requireSuperAdminAuth } from '../lib/tenantAuth'
import { createStripeCustomer } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { sendInviteEmail } from '@/lib/email'
import { resolveEmailProvider } from '@/lib/integrations'

const TRIAL_DAYS = 14
const TENANT_STATUSES = new Set(['active', 'inactive', 'suspended'])

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

export async function GET(request: Request) {
  try {
    await requireSuperAdminAuth(request)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 403 })
  }

  const supabase = await createSupabaseServer()
  const { data: tenants, error } = await supabase
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
      tenant_billing(plan, status, billing_email, trial_ends_at, stripe_customer_id, stripe_subscription_id)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Tenant list error:', error)
    return NextResponse.json({ error: 'Failed to load tenants' }, { status: 500 })
  }

  return NextResponse.json({ tenants: tenants || [] })
}

export async function POST(request: Request) {
  let auth
  try {
    auth = await requireSuperAdminAuth(request)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 403 })
  }

  const supabase = await createSupabaseServer()
  const user = auth.user
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }

  let payload: {
    name?: string
    slug?: string
    primaryDomain?: string
    billingEmail?: string
    plan?: string
    status?: string
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
    : ''
  const plan = typeof payload.plan === 'string' && payload.plan.trim()
    ? payload.plan.trim()
    : 'starter'
  const status = typeof payload.status === 'string' && payload.status.trim()
    ? payload.status.trim()
    : 'active'

  if (!name || !slug) {
    return NextResponse.json({ error: 'Tenant name and slug are required' }, { status: 400 })
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Invalid tenant slug' }, { status: 400 })
  }

  if (primaryDomain && !isValidDomain(primaryDomain)) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }
  if (!TENANT_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid tenant status' }, { status: 400 })
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

    const { data: existingPrimary } = await supabase
      .from('tenants')
      .select('id')
      .eq('primary_domain', primaryDomain)
      .maybeSingle()

    if (existingPrimary) {
      return NextResponse.json({ error: 'Domain already assigned' }, { status: 409 })
    }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      status,
      primary_domain: primaryDomain || null,
      settings: {
        theme: { brand_name: name },
      },
    })
    .select('id, name, slug, status, primary_domain, settings, created_at, updated_at')
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
      email: billingEmail || '',
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
      plan,
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

  // Send owner invite if billing email is provided
  let inviteUrl: string | null = null
  if (billingEmail) {
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      
      if (serviceRoleKey && supabaseUrl) {
        const adminClient = createClient(
          supabaseUrl,
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const origin = new URL(request.url).origin
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          billingEmail,
          {
            redirectTo: `${origin}/auth/callback?type=invite`,
            data: {
              role: 'owner',
              tenant_id: tenant.id,
              tenant_slug: tenant.slug,
            },
          }
        )

        if (!inviteError && inviteData?.user) {
          inviteUrl = `${origin}/auth/callback?type=invite`
          
          // Update profile with role and tenant
          await adminClient
            .from('709_profiles')
            .upsert({
              id: inviteData.user.id,
              role: 'owner',
              tenant_id: tenant.id,
            })

          // Send invite email
          const emailProvider = resolveEmailProvider()
          await sendInviteEmail({
            inviteeEmail: billingEmail,
            inviteLink: inviteUrl,
            tenantName: name,
            role: 'owner',
            inviterEmail: user.email,
            emailProvider,
          })
        }
      }
    } catch (err) {
      console.error('Owner invite error:', err)
      // Continue - invite can be sent manually later
    }
  }

  await supabase.from('activity_logs').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    user_email: user.email,
    action: 'tenant_created',
    entity_type: 'tenant',
    entity_id: tenant.id,
    details: {
      name,
      slug,
      primary_domain: primaryDomain || null,
      status,
      plan,
      source: 'super_admin',
      billing_email: billingEmail || null,
      invite_sent: !!inviteUrl,
    },
  })

  const { data: tenantWithBilling } = await supabase
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
      tenant_billing(plan, status, billing_email, trial_ends_at, stripe_customer_id)
    `)
    .eq('id', tenant.id)
    .single()

  return NextResponse.json({ tenant: tenantWithBilling || tenant, inviteUrl })
}
