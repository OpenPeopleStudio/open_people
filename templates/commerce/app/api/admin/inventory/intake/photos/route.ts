import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    let modelId = ''
    let entries: Array<{
      kind: 'file' | 'existing'
      position: number
      isPrimary: boolean
      url?: string | null
    }> = []
    let files: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      modelId = String(formData.get('modelId') || '')
      const rawEntries = formData.get('entries')
      entries = rawEntries ? JSON.parse(String(rawEntries)) : []
      files = formData.getAll('files').filter((file): file is File => file instanceof File)
    } else {
      const body = await request.json().catch(() => null)
      modelId = body?.modelId || ''
      if (Array.isArray(body?.images)) {
        entries = body.images.map((img: { url?: string; isPrimary?: boolean }, index: number) => ({
          kind: 'existing',
          position: index,
          isPrimary: Boolean(img.isPrimary),
          url: img.url || null,
        }))
      }
    }

    if (!modelId || entries.length === 0) {
      return NextResponse.json({ error: 'Model ID and images required' }, { status: 400 })
    }

    // Get model info
    const { data: modelInfo } = await supabase
      .from('product_models')
      .select('brand, model')
      .eq('id', modelId)
      .eq('tenant_id', tenant?.id)
      .single()

    if (!modelInfo) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // Find product for this model
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('brand', modelInfo.brand)
      .eq('name', modelInfo.model)
      .eq('tenant_id', tenant?.id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const uploadFileToStorage = async (file: File) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image uploads are supported')
      }

      const fileExt = file.name.split('.').pop() || 'jpg'
      const filePath = `${product.id}/${crypto.randomUUID()}.${fileExt}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to generate public URL')
      }

      return publicUrlData.publicUrl
    }

    let attached = 0
    const insertedUrls: string[] = []
    let primaryUrl: string | null = null
    let fileCursor = 0

    for (const entry of entries) {
      let imageUrl = entry.url || null

      if (entry.kind === 'file') {
        const file = files[fileCursor]
        fileCursor += 1
        if (!file) {
          continue
        }
        imageUrl = await uploadFileToStorage(file)
      }

      if (!imageUrl) {
        continue
      }

      const { error } = await supabase
        .from('product_images')
        .insert({
          tenant_id: tenant?.id,
          product_id: product.id,
          url: imageUrl,
          is_primary: entry.isPrimary,
          sort_order: entry.position,
        })

      if (!error) {
        attached += 1
        insertedUrls.push(imageUrl)
        if (entry.isPrimary) primaryUrl = imageUrl
      }
    }

    if (!primaryUrl && insertedUrls.length > 0) {
      primaryUrl = insertedUrls[0]
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', product.id)
        .eq('tenant_id', tenant?.id)

      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('product_id', product.id)
        .eq('url', primaryUrl)
        .eq('tenant_id', tenant?.id)
    } else if (primaryUrl) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', product.id)
        .neq('url', primaryUrl)
        .eq('tenant_id', tenant?.id)
    }

    // Log the action
    await supabase.from('activity_logs').insert({
      tenant_id: tenant?.id,
      user_id: user.id,
      user_email: user.email,
      action: 'attach_product_images',
      entity_type: 'product',
      entity_id: product.id,
      details: { modelId, attached, total: entries.length }
    })

    return NextResponse.json({ 
      success: true, 
      attached
    })

  } catch (error) {
    console.error('Photo attach error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to attach photos'
    }, { status: 500 })
  }
}
