import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isStaff } from '../lib/roles'

const MESSAGE_LIMIT = 200

async function ensureMembership(supabase: Awaited<ReturnType<typeof createSupabaseServer>>, threadId: string, userId: string) {
  const { data: membership } = await supabase
    .from('chat_members')
    .select('thread_id')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle()

  return Boolean(membership)
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!isStaff(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const threadId = new URL(request.url).searchParams.get('threadId') || ''
  if (!threadId) {
    return NextResponse.json({ error: 'threadId required' }, { status: 400 })
  }

  const isMember = await ensureMembership(supabase, threadId, user.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, thread_id, sender_id, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(MESSAGE_LIMIT)

  if (error) {
    console.error('Team chat messages error:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }

  return NextResponse.json({ messages: messages || [] })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!isStaff(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  let payload: { threadId?: string; content?: string }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const threadId = payload.threadId || ''
  const content = (payload.content || '').trim()
  if (!threadId || !content) {
    return NextResponse.json({ error: 'threadId and content required' }, { status: 400 })
  }

  const isMember = await ensureMembership(supabase, threadId, user.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Not a member of this chat' }, { status: 403 })
  }

  const { data: message, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      content,
    })
    .select('id, thread_id, sender_id, content, created_at')
    .single()

  if (error) {
    console.error('Send team chat message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ message })
}
