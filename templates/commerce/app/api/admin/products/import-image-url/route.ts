import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { getTenantFromRequest } from '../lib/tenant'

/**
 * Import an external image URL into our `product-images` bucket.
 * Returns a public URL you can safely store in `product_images`.
 */
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
    const { imageUrl }: { imageUrl?: string } = await request.json().catch(() => ({}))
    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': '709exclusive-Bot/1.0 (Product Image Import)',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Image download failed (${res.status})` }, { status: 400 })
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: `URL is not an image (${contentType || 'unknown'})` }, { status: 400 })
    }

    const arrayBuffer = await res.arrayBuffer()
    const maxSize = 10 * 1024 * 1024
    if (arrayBuffer.byteLength > maxSize) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
    }

    const fileExt = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
        ? 'webp'
        : contentType.includes('gif')
          ? 'gif'
          : 'jpg'

    const path = `imports/${tenant?.id || 'default'}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, arrayBuffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
    if (!publicUrl) {
      return NextResponse.json({ error: 'Failed to generate public URL' }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Import failed' },
      { status: 500 }
    )
  }
}

