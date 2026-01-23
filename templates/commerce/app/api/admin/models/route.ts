import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

async function checkAdminAuth(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  tenantId?: string
) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return { error: 'Unauthorized', status: 403 }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, profile }
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const auth = await checkAdminAuth(supabase, tenant?.id)
  
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')

    let query = supabase
      .from('product_models')
      .select('*')
      .order('brand, model')

    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id)
    }

    if (brand) {
      query = query.eq('brand', brand)
    }

    const { data: models, error } = await query

    if (error) throw error

    // Get models that have images
    const { data: modelImages } = await supabase
      .from('model_images')
      .select('model_id')

    const modelIdsWithImages = new Set(modelImages?.map(m => m.model_id) || [])

    // Add hasImage flag to each model
    const modelsWithImageFlag = models?.map(m => ({
      ...m,
      hasImage: modelIdsWithImages.has(m.id)
    })) || []

    // Get unique brands
    let brandsQuery = supabase
      .from('product_models')
      .select('brand')

    if (tenant?.id) {
      brandsQuery = brandsQuery.eq('tenant_id', tenant.id)
    }

    const { data: allModels } = await brandsQuery

    const brands = [...new Set(allModels?.map(m => m.brand) || [])].sort()

    return NextResponse.json({ models: modelsWithImageFlag, brands })
  } catch (error) {
    console.error('Admin models fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const auth = await checkAdminAuth(supabase, tenant?.id)
  
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { brand, model }: { brand: string; model: string } = await request.json()

    if (!brand?.trim() || !model?.trim()) {
      return NextResponse.json({ error: 'Brand and model are required' }, { status: 400 })
    }

    // Generate slug
    const slug = `${brand}-${model}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36)

    const { data: newModel, error } = await supabase
      .from('product_models')
      .insert({
        tenant_id: tenant?.id,
        brand: brand.trim(),
        model: model.trim(),
        slug
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ model: newModel })
  } catch (error) {
    console.error('Create model error:', error)
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
  }
}