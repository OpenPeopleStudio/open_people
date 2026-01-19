import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { redactErrorMessage } from '../lib/privacy'

// Get user's current consents
export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: consents, error } = await supabase
      .rpc('get_user_consents', {
        p_user_id: user.id,
        p_tenant_id: tenant?.id,
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      consents: consents || [],
      user_id: user.id,
      tenant_id: tenant?.id,
    })
  } catch (error) {
    console.error('Fetch consents error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to fetch consents', 'Unable to load consent preferences') },
      { status: 500 }
    )
  }
}

// Update user consents
export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { consents } = await request.json()

    if (!Array.isArray(consents)) {
      return NextResponse.json(
        { error: 'Consents must be an array' },
        { status: 400 }
      )
    }

    // Get consent types to validate and get versions
    const { data: consentTypes } = await supabase
      .from('consent_types')
      .select('code, version, is_required')
      .eq('active', true)

    if (!consentTypes) {
      throw new Error('Failed to fetch consent types')
    }

    const consentTypeMap = new Map(
      consentTypes.map(ct => [ct.code, { version: ct.version, is_required: ct.is_required }])
    )

    // Validate and prepare consent records
    const consentRecords = []
    for (const consent of consents) {
      const { code, granted } = consent

      if (!code || typeof granted !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid consent format' },
          { status: 400 }
        )
      }

      const consentType = consentTypeMap.get(code)
      if (!consentType) {
        return NextResponse.json(
          { error: `Unknown consent type: ${code}` },
          { status: 400 }
        )
      }

      // Can't withdraw required consents
      if (consentType.is_required && !granted) {
        return NextResponse.json(
          { error: `Cannot withdraw required consent: ${code}` },
          { status: 400 }
        )
      }

      consentRecords.push({
        user_id: user.id,
        tenant_id: tenant?.id,
        consent_type_code: code,
        consent_given: granted,
        consent_version: consentType.version,
        consented_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        source: 'web',
      })
    }

    // Upsert consent records
    const { error: upsertError } = await supabase
      .from('user_consents')
      .upsert(consentRecords, {
        onConflict: 'user_id,tenant_id,consent_type_code,consent_version',
      })

    if (upsertError) {
      throw upsertError
    }

    // Log consent changes
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'consents_updated',
      entity_type: 'user_consent',
      entity_id: user.id,
      details: {
        consents_updated: consents.length,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      consents_updated: consents.length,
    })
  } catch (error) {
    console.error('Update consents error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to update consents', 'Unable to save consent preferences') },
      { status: 500 }
    )
  }
}

// Get consent audit history
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: auditLog, error } = await supabase
      .from('consent_audit')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant?.id)
      .order('changed_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json({
      audit_log: auditLog || [],
      total: auditLog?.length || 0,
    })
  } catch (error) {
    console.error('Fetch consent audit error:', error)
    return NextResponse.json(
      { error: redactErrorMessage('Failed to fetch audit log', 'Unable to load consent history') },
      { status: 500 }
    )
  }
}
