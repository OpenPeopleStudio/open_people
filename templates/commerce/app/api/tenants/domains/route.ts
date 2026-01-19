import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isOwner } from '../lib/roles'

const normalizeDomain = (value: string) => value.trim().toLowerCase()

const isValidDomain = (value: string) =>
  /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)

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
    .from('709_profiles')
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
  const { data: domains } = await supabase
    .from('tenant_domains')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ domains: domains || [] })
}

export async function POST(request: Request) {
  const auth = await requireOwner(request)
  if ('error' in auth) return auth.error

  const { supabase, tenant } = auth

  let payload: { domain?: string; makePrimary?: boolean }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const domain = typeof payload.domain === 'string' ? normalizeDomain(payload.domain) : ''
  const makePrimary = Boolean(payload.makePrimary)

  if (!domain || !isValidDomain(domain)) {
    return NextResponse.json({ error: 'Valid domain required' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('tenant_domains')
    .select('id')
    .eq('domain', domain)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Domain already claimed' }, { status: 409 })
  }

  if (makePrimary) {
    await supabase
      .from('tenant_domains')
      .update({ is_primary: false })
      .eq('tenant_id', tenant.id)
  }

  const { data: created, error } = await supabase
    .from('tenant_domains')
    .insert({
      tenant_id: tenant.id,
      domain,
      is_primary: makePrimary,
    })
    .select()
    .single()

  if (error || !created) {
    console.error('Domain add error:', error)
    return NextResponse.json({ error: 'Failed to add domain' }, { status: 500 })
  }

  if (makePrimary) {
    await supabase
      .from('tenants')
      .update({ primary_domain: domain })
      .eq('id', tenant.id)
  }

  return NextResponse.json({ domain: created })
}
