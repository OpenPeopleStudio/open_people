import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { getTenantFromRequest } from '../lib/tenant'
import { sendSms } from '@/lib/sms'
import { sendSupportEmail } from '@/lib/email/support'
import { resolveEmailProvider, resolveSmsProvider } from '@/lib/integrations'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin/staff access
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id || '')
    .single()

  if (!hasAdminAccess(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { channel, to, subject, body } = await request.json()

  if (!channel || !to || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (channel !== 'email' && channel !== 'sms') {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }

  try {
    if (channel === 'email') {
      const emailProvider = resolveEmailProvider(tenant?.settings)
      if (emailProvider === 'disabled') {
        return NextResponse.json({ error: 'Email provider is disabled' }, { status: 400 })
      }

      await sendSupportEmail(emailProvider, {
        to,
        subject: subject || 'Message from Support',
        html: body.replace(/\n/g, '<br>')
      })

      return NextResponse.json({ ok: true, message: 'Email sent' })
    }

    if (channel === 'sms') {
      const smsProvider = resolveSmsProvider(tenant?.settings)
      if (smsProvider === 'disabled') {
        return NextResponse.json({ error: 'SMS provider is disabled' }, { status: 400 })
      }

      await sendSms(smsProvider, {
        to,
        body
      })

      return NextResponse.json({ ok: true, message: 'SMS sent' })
    }

    return NextResponse.json({ error: 'Unknown channel' }, { status: 400 })
  } catch (err) {
    console.error(`Failed to send ${channel}:`, err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : `Failed to send ${channel}` },
      { status: 500 }
    )
  }
}
