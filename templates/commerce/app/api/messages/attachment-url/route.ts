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
    .from('709_profiles')
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

  if (!message || !message.attachment_path) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const isAdmin = hasAdminAccess(profile?.role)
  const isOwner = message.customer_id === user.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data, error } = await supabase
    .storage
    .from('message-attachments')
    .createSignedUrl(message.attachment_path, 60)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: redactErrorMessage('Failed to generate URL') }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
