import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const resolvedParams = await params
  const { searchParams } = new URL(request.url)
  const imageId = searchParams.get('imageId')

  if (!imageId) {
    return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
  }

  try {
    // Verify the image belongs to the model
    const { data: image, error: imageError } = await supabase
      .from('model_images')
      .select('model_id, url')
      .eq('id', imageId)
      .eq('tenant_id', tenant?.id)
      .single()

    if (imageError || !image || image.model_id !== resolvedParams.id) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('model_images')
      .delete()
      .eq('id', imageId)
      .eq('tenant_id', tenant?.id)

    if (deleteError) throw deleteError

    // TODO: Delete from Supabase storage as well
    // This would require extracting the file path from the URL

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete model image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}