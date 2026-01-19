import { NextResponse } from 'next/server'
import { createSupabaseServer } from '../lib/supabaseServer'
import { importImageToStorage } from '@/lib/imageSources/importImage'
import { getTenantFromRequest } from '../lib/tenant'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest(req)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { modelId, images, source }: {
      modelId: string
      images: string[]
      source?: string
    } = await req.json()

    if (!modelId || !images?.length) {
      return NextResponse.json({ error: 'Model ID and images required' }, { status: 400 })
    }

    // Verify model exists
    const { data: model } = await supabase
      .from('product_models')
      .select('id')
      .eq('id', modelId)
      .eq('tenant_id', tenant?.id)
      .single()

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    const importedImages: Array<{ url: string; success: boolean; error?: string }> = []

    // Import images sequentially to avoid rate limiting
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i]

      try {
        const storedUrl = await importImageToStorage({
          modelId,
          imageUrl
        })

        // Insert record into model_images
        const { error: insertError } = await supabase
          .from('model_images')
          .insert({
            tenant_id: tenant?.id,
            model_id: modelId,
            source: source || 'google',
            url: storedUrl,
            is_primary: i === 0 && importedImages.length === 0,
            position: i
          })

        if (insertError) {
          console.error('Database insert error:', insertError)
          importedImages.push({
            url: imageUrl,
            success: false,
            error: 'Database insert failed'
          })
        } else {
          importedImages.push({
            url: storedUrl,
            success: true
          })
        }
      } catch (error) {
        console.error(`Image import error for ${imageUrl}:`, error)
        importedImages.push({
          url: imageUrl,
          success: false,
          error: error instanceof Error ? error.message : 'Import failed'
        })
      }

      // Small delay to avoid overwhelming the service
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const successCount = importedImages.filter(img => img.success).length

    return NextResponse.json({
      success: true,
      imported: successCount,
      total: images.length,
      images: importedImages
    })

  } catch (error) {
    console.error('Import images error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Import failed'
    }, { status: 500 })
  }
}