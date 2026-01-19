import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { hasAdminAccess } from '../lib/roles'
import { redactErrorMessage } from '../lib/privacy'
import { getTenantFromRequest } from '../lib/tenant'

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, '_')

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

  const formData = await request.formData()
  const file = formData.get('file')
  const filename = formData.get('filename')
  const customerId = formData.get('customerId') as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File required' }, { status: 400 })
  }

  if (customerId && !hasAdminAccess(profile?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const targetId = customerId || user.id
  const safeName = sanitizeFilename(typeof filename === 'string' ? filename : file.name)
  const tenantPrefix = tenant?.id || 'default'
  const path = `messages/${tenantPrefix}/${targetId}/${Date.now()}-${safeName}`

  const buffer = await file.arrayBuffer()
  const { error } = await supabase
    .storage
    .from('message-attachments')
    .upload(path, buffer, { contentType: 'application/octet-stream', upsert: false })

  if (error) {
    return NextResponse.json({ error: redactErrorMessage('Failed to upload attachment') }, { status: 500 })
  }

  return NextResponse.json({ path })
}
