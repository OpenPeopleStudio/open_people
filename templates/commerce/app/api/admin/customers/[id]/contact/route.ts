import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'
import { resolveEmailProvider, resolveSmsProvider } from '@/lib/integrations'
import { sendSupportEmail } from '@/lib/email/support'
import { sendSms } from '@/lib/sms'

type ContactChannel = 'email' | 'sms'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

const extractPhoneFromShippingAddress = (shippingAddress: unknown): string => {
  if (!isRecord(shippingAddress)) return ''
  return (
    asString(shippingAddress.phone) ||
    asString(shippingAddress.phone_number) ||
    asString(shippingAddress.telephone) ||
    asString(shippingAddress.mobile) ||
    ''
  )
}

const escapeHtml = (input: string) =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params
    const supabase = await createSupabaseServer()
    const tenant = await getTenantFromRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('709_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner', 'staff'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!tenant?.id || profile.tenant_id !== tenant.id) {
      return NextResponse.json({ error: 'Tenant mismatch' }, { status: 403 })
    }

    // Verify customer belongs to tenant
    const { data: customerProfile } = await supabase
      .from('709_profiles')
      .select('id, tenant_id')
      .eq('id', customerId)
      .eq('tenant_id', tenant.id)
      .single()

    if (!customerProfile) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => null) as
      | { channel?: ContactChannel; to?: string; subject?: string; body?: string }
      | null

    const channel = body?.channel
    const messageBody = (body?.body || '').trim()
    if (!channel || !['email', 'sms'].includes(channel)) {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }
    if (!messageBody) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }

    // Derive email (auth.users) via service role client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: authUserData, error: authUserError } = await adminClient.auth.admin.getUserById(customerId)
    if (authUserError) {
      console.error('Failed to fetch auth user:', authUserError)
    }
    const derivedEmail = authUserData?.user?.email || ''

    // Derive phone from latest order shipping address (best-effort)
    let derivedPhone = ''
    try {
      const { data: recentOrderRows } = await supabase
        .from('orders')
        .select('shipping_address, created_at')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(1)
      const shippingAddress = recentOrderRows?.[0]?.shipping_address as unknown
      derivedPhone = extractPhoneFromShippingAddress(shippingAddress)
    } catch (err) {
      console.error('Failed to derive phone:', err)
    }

    const to = (body?.to || '').trim() || (channel === 'email' ? derivedEmail : derivedPhone)
    if (!to) {
      return NextResponse.json(
        { error: `No ${channel === 'email' ? 'email' : 'phone'} found for this customer` },
        { status: 400 }
      )
    }

    if (channel === 'email') {
      const subject = (body?.subject || '').trim()
      if (!subject) {
        return NextResponse.json({ error: 'Subject is required for email' }, { status: 400 })
      }

      const provider = resolveEmailProvider(tenant.settings)
      if (provider === 'disabled') {
        return NextResponse.json({ error: 'Email provider is disabled for this tenant' }, { status: 400 })
      }

      const brandName = tenant.settings?.theme?.brand_name || tenant.name || 'Support'
      const fromEmail = process.env.SUPPORT_FROM_EMAIL || 'support@709exclusive.com'
      const safe = escapeHtml(messageBody).replaceAll('\n', '<br />')
      const html = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
          <p>${safe}</p>
          <hr style="border: 0; border-top: 1px solid #272A33; margin: 16px 0;" />
          <p style="color:#8A8F98; font-size: 12px;">Sent from ${escapeHtml(brandName)} support inbox.</p>
        </div>
      `
      await sendSupportEmail(provider, {
        to,
        subject,
        html,
        text: messageBody,
        fromEmail,
        fromName: brandName,
      })

      return NextResponse.json({ ok: true })
    }

    // SMS
    const provider = resolveSmsProvider(tenant.settings)
    if (provider === 'disabled') {
      return NextResponse.json({ error: 'SMS provider is disabled for this tenant' }, { status: 400 })
    }

    await sendSms(provider, { to, body: messageBody })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Customer contact error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

