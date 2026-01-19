/**
 * Sneaker API Module
 * 
 * Third-party sneaker APIs are lenses, not load-bearing beams.
 * 
 * Usage:
 *   import { searchSneakers, importToProduct } from '@/lib/sneakerApi'
 *   
 *   // Search for sneakers
 *   const { results } = await searchSneakers('jordan 1 bred')
 *   
 *   // Import a sneaker to your products table
 *   const product = await importToProduct(results[0], tenantId)
 */

export * from './types'
export * from './client'
export { createManualSneaker } from './providers/manual'

import type { NormalizedSneaker } from './types'
import { createSupabaseServer } from '@/lib/supabaseServer'

/**
 * Import a normalized sneaker to the products table
 * 
 * This is the "explicit import" step - only called when
 * an admin clicks "Add to Inventory"
 */
export async function importToProduct(
  sneaker: NormalizedSneaker,
  tenantId?: string
): Promise<{ productId: string } | { error: string }> {
  const supabase = await createSupabaseServer()
  
  // Generate slug
  const slugBase = [sneaker.brand, sneaker.model, sneaker.colorway]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  
  const slug = slugBase + '-' + Date.now().toString(36)
  
  // Generate name
  const name = [sneaker.brand, sneaker.model, sneaker.colorway]
    .filter(Boolean)
    .join(' ')
  
  const insertData: Record<string, unknown> = {
    name,
    slug,
    brand: sneaker.brand,
    colorway: sneaker.colorway || null,
    sku: sneaker.sku,
    release_date: sneaker.releaseDate,
    external_image_url: sneaker.externalImageUrl,
    external_id: sneaker.externalId,
    data_source: sneaker.source
  }
  
  if (tenantId) {
    insertData.tenant_id = tenantId
  }
  
  const { data, error } = await supabase
    .from('products')
    .insert(insertData)
    .select('id')
    .single()
  
  if (error) {
    console.error('Failed to import sneaker:', error)
    return { error: error.message }
  }
  
  return { productId: data.id }
}

/**
 * Check if a sneaker already exists (by SKU)
 */
export async function findExistingProduct(
  sku: string | null,
  tenantId?: string
): Promise<{ id: string; name: string } | null> {
  if (!sku) return null
  
  const supabase = await createSupabaseServer()
  
  let query = supabase
    .from('products')
    .select('id, name')
    .eq('sku', sku)
    .limit(1)
  
  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }
  
  const { data } = await query
  
  return data?.[0] || null
}
