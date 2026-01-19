import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/subscribe
 * Newsletter/email signup endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, message } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // TODO: In production, implement one of these:
    // 1. Save to Supabase database
    // 2. Add to Mailchimp/ConvertKit/Klaviyo
    // 3. Send via Resend API
    
    // Example Supabase implementation:
    // const supabase = createClient()
    // const { error } = await supabase
    //   .from('email_signups')
    //   .insert({
    //     email: email.toLowerCase().trim(),
    //     message: message?.trim() || null,
    //     source: 'website',
    //     created_at: new Date().toISOString(),
    //   })
    // 
    // if (error?.code === '23505') {
    //   return NextResponse.json(
    //     { error: 'Email already registered' },
    //     { status: 409 }
    //   )
    // }

    console.log('Newsletter signup:', { email, message: message?.substring(0, 100) })

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing',
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}
