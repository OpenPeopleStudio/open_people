import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function GET(
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

  try {
    // Get model info
    const { data: model, error: modelError } = await supabase
      .from('product_models')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('tenant_id', tenant?.id)
      .single()

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Get model images
    const { data: images, error: imagesError } = await supabase
      .from('model_images')
      .select('*')
      .eq('model_id', resolvedParams.id)
      .eq('tenant_id', tenant?.id)
      .order('position')

    if (imagesError) throw imagesError

    return NextResponse.json({
      model,
      images: images || []
    })
  } catch (error) {
    console.error('Model fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}