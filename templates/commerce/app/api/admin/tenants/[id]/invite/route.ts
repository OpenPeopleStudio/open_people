import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { getTenantFromRequest } from '../lib/tenant'
import { isOwner } from '../lib/roles'
import { sendInviteEmail } from '@/lib/email'
import { resolveEmailProvider } from '@/lib/integrations'

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
    .from('profiles')
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

  let payload: { email?: string }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
    }

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const origin = new URL(request.url).origin
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${origin}/auth/callback?type=invite`,
        data: {
          role: 'owner',
          tenant_id: resolvedParams.id,
        },
      }
    )

    if (inviteError) {
      console.error('Invite error:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    if (inviteData?.user) {
      await adminClient
        .from('profiles')
        .upsert({
          id: inviteData.user.id,
          role: 'owner',
          tenant_id: resolvedParams.id,
        })
    }

    // Fetch tenant name for email
    const { data: targetTenant } = await supabase
      .from('tenants')
      .select('name, settings')
      .eq('id', resolvedParams.id)
      .single()

    // Send invite email
    const emailProvider = resolveEmailProvider(targetTenant?.settings)
    await sendInviteEmail({
      inviteeEmail: email,
      inviteLink: `${origin}/auth/callback?type=invite`,
      tenantName: targetTenant?.name || 'Store',
      role: 'owner',
      inviterEmail: user.email,
      emailProvider,
    })

    await supabase.from('activity_logs').insert({
      tenant_id: resolvedParams.id,
      user_id: user.id,
      user_email: user.email,
      action: 'tenant_invite_sent',
      entity_type: 'tenant',
      entity_id: resolvedParams.id,
      details: { invite_email: email },
    })

    return NextResponse.json({ success: true, inviteUrl: `${origin}/auth/callback?type=invite` })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}
