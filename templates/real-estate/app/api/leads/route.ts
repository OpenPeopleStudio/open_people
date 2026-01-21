import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabaseServer'
import type { LeadFormData } from '@/types/real-estate'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LeadFormData

    // Basic validation
    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServer()

    // Get current user (if authenticated) or use default agent
    const { data: { user } } = await supabase.auth.getUser()
    const agentId = user?.id || '00000000-0000-0000-0000-000000000000' // Default agent ID

    // Create the lead
    const leadData = {
      agent_id: agentId,
      lead_type: body.lead_type || 'buyer',
      status: 'new',
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone || null,
      preferred_contact_method: body.preferred_contact_method || 'email',
      budget_min: body.budget_min || null,
      budget_max: body.budget_max || null,
      property_types: body.property_types || null,
      preferred_locations: body.preferred_locations || null,
      timeline: body.timeline || null,
      financing_status: body.financing_status || null,
      notes: body.notes || null,
      lead_source: 'website',
      source_details: 'Lead capture form',
      next_follow_up_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Follow up in 24 hours
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Send welcome email (if email service is configured)
    try {
      // This would integrate with your email service (Resend, SendGrid, etc.)
      console.log('Lead created, would send welcome email to:', body.email)
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      lead: data,
      message: 'Lead created successfully'
    })

  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get leads for the current agent
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('agent_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    return NextResponse.json({ leads: data })

  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}