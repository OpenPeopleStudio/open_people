import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { redactErrorMessage } from '../lib/privacy'

// Request access token
export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)

  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    // Check if consignor exists
    let consignorQuery = supabase
      .from('consignors')
      .select('id, name, email')
      .eq('email', email.toLowerCase().trim())

    if (tenant?.id) {
      consignorQuery = consignorQuery.eq('tenant_id', tenant.id)
    }

    const { data: consignor } = await consignorQuery.maybeSingle()

    if (!consignor) {
      // Don't reveal if email exists or not (security)
      return NextResponse.json({
        message: 'If a consignor account exists with this email, an access link will be sent.',
      })
    }

    // Generate access token (24 hour validity)
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_consignor_access_token', {
        p_consignor_id: consignor.id,
        p_email: consignor.email,
        p_validity_hours: 24,
      })

    if (tokenError || !tokenData) {
      throw new Error('Failed to generate access token')
    }

    // TODO: Send email with access link
    // For now, return the token (in production, only send via email)
    const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/consignor/portal?token=${tokenData}`

    // Log access request
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: null,
      user_email: email,
      action: 'consignor_portal_access_requested',
      entity_type: 'consignor',
      entity_id: consignor.id,
      details: {
        consignor_name: consignor.name,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      },
    })

    return NextResponse.json({
      message: 'Access link generated',
      // In production, remove this and only send via email
      access_link: process.env.NODE_ENV === 'development' ? accessLink : undefined,
    })
  } catch (error) {
    console.error('Consignor auth error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Authentication failed', 'Unable to process request') },
      { status: 500 }
    )
  }
}

// Validate token
export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  try {
    const { data: validation, error } = await supabase
      .rpc('validate_consignor_token', { p_token: token })

    if (error || !validation || validation.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const tokenInfo = validation[0]

    if (!tokenInfo.is_valid) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      consignor_id: tokenInfo.consignor_id,
      email: tokenInfo.email,
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Validation failed', 'Unable to validate token') },
      { status: 500 }
    )
  }
}
