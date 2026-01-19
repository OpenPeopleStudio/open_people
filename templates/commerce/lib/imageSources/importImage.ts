import { createSupabaseServer } from '@/lib/supabaseServer'

export async function importImageToStorage({
  modelId,
  imageUrl
}: {
  modelId: string
  imageUrl: string
}): Promise<string> {
  // Download the image
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': '709exclusive-Bot/1.0 (Image Import Service)'
    }
  })

  if (!res.ok) {
    throw new Error(`Image download failed: ${res.status} ${res.statusText}`)
  }

  const contentType = res.headers.get('content-type') || ''

  // Validate it's actually an image
  if (!contentType.startsWith('image/')) {
    throw new Error('Invalid image type: ' + contentType)
  }

  // Get the image buffer
  const buffer = await res.arrayBuffer()

  // Generate filename
  const fileName = `${crypto.randomUUID()}.jpg`
  const filePath = `${modelId}/${fileName}`

  // Upload to Supabase storage
  const supabase = await createSupabaseServer()

  const { error } = await supabase.storage
    .from('model-images')
    .upload(filePath, buffer, {
      contentType: 'image/jpeg', // Normalize to JPEG
      upsert: false
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error('Failed to store image: ' + error.message)
  }

  // Get public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('model-images')
    .getPublicUrl(filePath)

  if (!publicUrlData.publicUrl) {
    throw new Error('Failed to generate public URL')
  }

  return publicUrlData.publicUrl
}