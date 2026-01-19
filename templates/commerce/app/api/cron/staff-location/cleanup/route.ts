import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { redactErrorMessage } from '../lib/privacy'

const CRON_SECRET = process.env.STAFF_LOCATION_CRON_SECRET

const authorizeCron = (request: Request) => {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

const runCleanup = async () => {
  const supabase = await createSupabaseServer()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('staff_locations')
    .delete()
    .lt('expires_at', now)
    .select('id')

  if (error) {
    return NextResponse.json({ error: redactErrorMessage('Failed to purge locations') }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: data?.length || 0 })
}

const handleCleanup = async (request: Request) => {
  const authError = authorizeCron(request)
  if (authError) return authError

  try {
    return await runCleanup()
  } catch (error) {
    console.error('Staff location cron cleanup error:', error)
    return NextResponse.json({ error: redactErrorMessage('Cleanup failed') }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleCleanup(request)
}

export async function POST(request: Request) {
  return handleCleanup(request)
}
