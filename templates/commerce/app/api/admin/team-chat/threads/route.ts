import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'
import { isStaff } from '../lib/roles'

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

  const { data: memberships } = await supabase
    .from('chat_members')
    .select('thread_id')
    .eq('user_id', user.id)

  const threadIds = (memberships || []).map((m) => m.thread_id)
  if (threadIds.length === 0) {
    return NextResponse.json({ threads: [] })
  }

  const { data: threads, error: threadsError } = await supabase
    .from('chat_threads')
    .select('id, type, title, created_by, created_at')
    .in('id', threadIds)
    .order('created_at', { ascending: false })

  if (threadsError) {
    console.error('Team chat threads error:', threadsError)
    return NextResponse.json({ error: 'Failed to load chats' }, { status: 500 })
  }

  const { data: members } = await supabase
    .from('chat_members')
    .select('thread_id, user_id')
    .in('thread_id', threadIds)

  const { data: lastMessages } = await supabase
    .from('chat_messages')
    .select('thread_id, content, created_at, sender_id')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false })

  const lastByThread = new Map<string, { content: string; created_at: string; sender_id: string | null }>()
  for (const msg of lastMessages || []) {
    if (!lastByThread.has(msg.thread_id)) {
      lastByThread.set(msg.thread_id, {
        content: msg.content,
        created_at: msg.created_at,
        sender_id: msg.sender_id,
      })
    }
  }

  const membersByThread = new Map<string, string[]>()
  for (const member of members || []) {
    const list = membersByThread.get(member.thread_id) || []
    list.push(member.user_id)
    membersByThread.set(member.thread_id, list)
  }

  const payload = (threads || []).map((thread) => ({
    ...thread,
    members: membersByThread.get(thread.id) || [],
    last_message: lastByThread.get(thread.id) || null,
  }))

  return NextResponse.json({ threads: payload })
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

  let payload: { type?: string; title?: string; memberIds?: string[] }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const type = payload.type === 'group' ? 'group' : 'direct'
  const memberIds = Array.isArray(payload.memberIds)
    ? payload.memberIds.filter((id) => typeof id === 'string' && id.trim())
    : []

  const uniqueMembers = Array.from(new Set([user.id, ...memberIds]))
  if (type === 'direct' && uniqueMembers.length !== 2) {
    return NextResponse.json({ error: 'Direct chats need exactly one other member' }, { status: 400 })
  }
  if (type === 'group' && uniqueMembers.length < 3) {
    return NextResponse.json({ error: 'Group chats need at least two members' }, { status: 400 })
  }

  const title = type === 'group' ? (payload.title || '').trim() : null
  if (type === 'group' && !title) {
    return NextResponse.json({ error: 'Group title is required' }, { status: 400 })
  }

  const { data: thread, error: threadError } = await supabase
    .from('chat_threads')
    .insert({
      tenant_id: tenant?.id,
      type,
      title,
      created_by: user.id,
    })
    .select('id, type, title, created_by, created_at')
    .single()

  if (threadError || !thread) {
    console.error('Create chat thread error:', threadError)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }

  const memberRows = uniqueMembers.map((memberId) => ({
    thread_id: thread.id,
    user_id: memberId,
  }))

  const { error: membersError } = await supabase
    .from('chat_members')
    .insert(memberRows)

  if (membersError) {
    console.error('Create chat members error:', membersError)
    return NextResponse.json({ error: 'Failed to add chat members' }, { status: 500 })
  }

  return NextResponse.json({ thread: { ...thread, members: uniqueMembers } })
}
