import { supabase } from './supabaseClient'

export interface ProductModel {
  id: string
  brand: string
  model: string
  slug: string
  created_at: string
}

export interface ModelImage {
  id: string
  model_id: string
  source: string
  url: string
  is_primary: boolean
  position: number
  created_at: string
}

// Get model images for a specific model
export async function getModelImages(modelId: string, tenantId?: string): Promise<ModelImage[]> {
  let query = supabase
    .from('model_images')
    .select('*')
    .eq('model_id', modelId)
    .order('position')

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching model images:', error)
    return []
  }

  return data || []
}

// Get primary image for a model
export async function getPrimaryModelImage(modelId: string, tenantId?: string): Promise<ModelImage | null> {
  let query = supabase
    .from('model_images')
    .select('*')
    .eq('model_id', modelId)
    .eq('is_primary', true)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data, error } = await query.single()

  if (error) {
    // If no primary, get first image by position
    let fallbackQuery = supabase
      .from('model_images')
      .select('*')
      .eq('model_id', modelId)
      .order('position')
      .limit(1)

    if (tenantId) {
      fallbackQuery = fallbackQuery.eq('tenant_id', tenantId)
    }

    const { data: fallback } = await fallbackQuery.single()

    return fallback || null
  }

  return data
}

// Get all model images for a brand (useful for admin listing)
export async function getModelsByBrand(brand: string, tenantId?: string): Promise<ProductModel[]> {
  let query = supabase
    .from('product_models')
    .select('*')
    .eq('brand', brand)
    .order('model')

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching models by brand:', error)
    return []
  }

  return data || []
}

// Get model by brand and model name
export async function getModelByBrandAndName(brand: string, model: string, tenantId?: string): Promise<ProductModel | null> {
  let query = supabase
    .from('product_models')
    .select('*')
    .eq('brand', brand)
    .eq('model', model)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const { data, error } = await query.single()

  if (error) {
    return null
  }

  return data
}