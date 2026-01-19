import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'

/**
 * POST /api/presence/heartbeat
 * Updates the current user's presence timestamp and marks them as online.
 * Called every 60 seconds by the usePresence hook while the user is active.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update presence using the database function
    const { error: updateError } = await supabase.rpc('update_user_presence', {
      user_uuid: user.id
    })

    if (updateError) {
      console.error('Failed to update presence:', updateError)
      return NextResponse.json(
        { error: 'Failed to update presence' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Presence heartbeat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
