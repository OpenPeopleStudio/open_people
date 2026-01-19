import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'

/**
 * GET /api/presence/status?userIds=id1,id2,id3
 * Returns presence information (online status, last_active_at) for a list of users.
 * Used by the inbox to display online indicators and last seen timestamps.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    
    // Get current user for auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user IDs from query params
    const { searchParams } = new URL(request.url)
    const userIdsParam = searchParams.get('userIds')
    
    if (!userIdsParam) {
      return NextResponse.json(
        { error: 'userIds parameter required' },
        { status: 400 }
      )
    }

    const userIds = userIdsParam.split(',').filter(Boolean)
    
    if (userIds.length === 0) {
      return NextResponse.json({ presenceData: {} })
    }

    // Fetch presence data for requested users
    const { data: profiles, error: fetchError } = await supabase
      .from('709_profiles')
      .select('id, is_online, last_active_at')
      .in('id', userIds)

    if (fetchError) {
      console.error('Failed to fetch presence:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch presence data' },
        { status: 500 }
      )
    }

    // Format as a map of userId -> presence info
    const presenceData: Record<string, {
      isOnline: boolean
      lastActiveAt: string | null
    }> = {}

    profiles?.forEach(profile => {
      presenceData[profile.id] = {
        isOnline: profile.is_online || false,
        lastActiveAt: profile.last_active_at || null
      }
    })

    return NextResponse.json({ presenceData })
  } catch (error) {
    console.error('Presence status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
