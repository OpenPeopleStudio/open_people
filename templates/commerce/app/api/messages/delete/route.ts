import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { redactErrorMessage } from '../lib/privacy'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messageId } = await request.json()

  if (!messageId) {
    return NextResponse.json({ error: 'Message id required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  let messageQuery = supabase
    .from('messages')
    .select('id, customer_id, attachment_path')
    .eq('id', messageId)

  if (tenant?.id) {
    messageQuery = messageQuery.eq('tenant_id', tenant.id)
  }

  const { data: message } = await messageQuery.single()

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  const isAdmin = hasAdminAccess(profile?.role)
  const isOwner = message.customer_id === user.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const now = new Date().toISOString()

  let deleteQuery = supabase
    .from('messages')
    .update({
      deleted_at: now,
      deleted_by: user.id,
      deleted_for_both: true,
      content: '',
      encrypted: false,
      iv: null,
      sender_public_key: null,
      message_index: 0,
      attachment_path: null,
      attachment_name: null,
      attachment_type: null,
      attachment_size: null,
      attachment_key: null,
      attachment_key_iv: null,
      attachment_key_sender_public_key: null,
      attachment_key_message_index: null,
    })
    .eq('id', messageId)

  if (tenant?.id) {
    deleteQuery = deleteQuery.eq('tenant_id', tenant.id)
  }

  const { error } = await deleteQuery

  if (error) {
    return NextResponse.json({ error: redactErrorMessage('Failed to delete message') }, { status: 500 })
  }

  if (message.attachment_path) {
    await supabase.storage.from('message-attachments').remove([message.attachment_path])
  }

  return NextResponse.json({ success: true })
}
