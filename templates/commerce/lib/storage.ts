import { supabase } from './supabaseClient'

export async function uploadProductImage(file: File, productId: string, position: number = 0) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${productId}/${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)

  if (error) {
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)

  // Insert record into product_images table
  const { error: insertError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      url: publicUrl,
      position
    })

  if (insertError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage
      .from('product-images')
      .remove([fileName])
    throw insertError
  }

  return { url: publicUrl, fileName }
}

export async function deleteProductImage(imageId: string) {
  // Get the image record first
  const { data: image, error: fetchError } = await supabase
    .from('product_images')
    .select('url')
    .eq('id', imageId)
    .single()

  if (fetchError) {
    throw fetchError
  }

  // Extract filename from URL
  const urlParts = image.url.split('/')
  const fileName = urlParts[urlParts.length - 2] + '/' + urlParts[urlParts.length - 1]

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('product-images')
    .remove([fileName])

  if (storageError) {
    throw storageError
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (dbError) {
    throw dbError
  }
}

export async function reorderProductImages(productId: string, imagePositions: { id: string; position: number }[]) {
  const updates = imagePositions.map(({ id, position }) => ({
    id,
    position
  }))

  const { error } = await supabase
    .from('product_images')
    .upsert(updates, { onConflict: 'id' })

  if (error) {
    throw error
  }
}