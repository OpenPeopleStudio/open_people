import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/reservations
 * Create a new reservation request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, date, time, partySize, specialRequests } = body

    // Validate required fields
    if (!name || !email || !date || !time || !partySize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate date is in the future
    const reservationDate = new Date(`${date}T${time}`)
    if (reservationDate <= new Date()) {
      return NextResponse.json(
        { error: 'Reservation must be in the future' },
        { status: 400 }
      )
    }

    // TODO: In production, implement:
    // 1. Save to Supabase database
    // 2. Send confirmation email
    // 3. Check availability
    // 4. Handle deposits if required
    
    // Example Supabase implementation:
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('reservations')
    //   .insert({
    //     guest_name: name,
    //     guest_email: email.toLowerCase().trim(),
    //     guest_phone: phone || null,
    //     reservation_date: date,
    //     reservation_time: time,
    //     party_size: parseInt(partySize),
    //     special_requests: specialRequests || null,
    //     status: 'pending',
    //     created_at: new Date().toISOString(),
    //   })
    //   .select()
    //   .single()

    console.log('Reservation request:', { name, email, date, time, partySize })

    return NextResponse.json({
      success: true,
      message: 'Reservation request received',
      // id: data.id, // Return the reservation ID
    })
  } catch (error) {
    console.error('Reservation error:', error)
    return NextResponse.json(
      { error: 'Failed to process reservation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reservations
 * Get reservations (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement authentication check
    // const session = await getSession()
    // if (!session || session.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // TODO: Fetch from database
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('reservations')
    //   .select('*')
    //   .order('reservation_date', { ascending: true })

    return NextResponse.json({
      reservations: [],
    })
  } catch (error) {
    console.error('Get reservations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}
