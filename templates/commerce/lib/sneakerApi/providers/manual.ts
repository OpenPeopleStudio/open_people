/**
 * Manual Provider (Fallback)
 * 
 * Creates normalized sneaker objects from manual input.
 * This is the "site still works if API dies" fallback.
 */

import type { NormalizedSneaker, SneakerApiProvider } from '../types'

export function createManualSneaker(data: {
  brand: string
  model: string
  colorway?: string
  sku?: string
  releaseDate?: string
  externalImageUrl?: string
}): NormalizedSneaker {
  return {
    brand: data.brand.trim(),
    model: data.model.trim(),
    colorway: data.colorway?.trim() || '',
    sku: data.sku?.trim() || null,
    releaseDate: data.releaseDate || null,
    retailPriceCents: null,
    externalImageUrl: data.externalImageUrl || null,
    externalId: null,
    source: 'manual'
  }
}

// Manual provider doesn't actually search - it's for direct creation
export const manualProvider: SneakerApiProvider = {
  name: 'manual',
  search: async () => [],
  getById: async () => null
}
