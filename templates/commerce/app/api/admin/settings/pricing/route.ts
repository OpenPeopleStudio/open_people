import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { ruleType, matchValue, multiplier } = await request.json()

    const { data: rule, error } = await supabase
      .from('pricing_rules')
      .insert({
        tenant_id: tenant?.id,
        rule_type: ruleType,
        match_value: matchValue,
        multiplier,
        active: true
      })
      .select()
      .single()

    if (error) throw error

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'create_pricing_rule',
      entity_type: 'pricing_rule',
      entity_id: rule.id,
      details: { rule_type: ruleType, match_value: matchValue, multiplier }
    })

    return NextResponse.json({ rule })

  } catch (error) {
    console.error('Create pricing rule error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create rule'
    }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { ruleId, active } = await request.json()

    const { error } = await supabase
      .from('pricing_rules')
      .update({ active })
      .eq('id', ruleId)
      .eq('tenant_id', tenant?.id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Update pricing rule error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to update rule'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId)
      .eq('tenant_id', tenant?.id)

    if (error) throw error

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'delete_pricing_rule',
      entity_type: 'pricing_rule',
      entity_id: ruleId,
      details: {}
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete pricing rule error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete rule'
    }, { status: 500 })
  }
}
