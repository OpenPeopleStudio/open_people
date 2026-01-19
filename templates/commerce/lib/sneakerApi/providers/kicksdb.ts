/**
 * KicksDB Provider
 * 
 * Integration with KicksDB (formerly SneakersAPI)
 * Free tier: 1,000 requests/month
 * 
 * Docs: https://kicks.dev
 */

import type { NormalizedSneaker, MarketReference, SneakerApiProvider } from '../types'

const KICKSDB_API_URL = 'https://api.kicks.dev/v1'

interface KicksDBProduct {
  id: string
  brand: string
  name: string
  colorway?: string
  sku?: string
  release_date?: string
  retail_price?: number
  image?: {
    original?: string
    '360'?: string[]
    small?: string
    thumbnail?: string
  }
  market_data?: {
    lowest_ask?: number
    highest_bid?: number
    last_sale?: number
  }
}

interface KicksDBSearchResponse {
  products: KicksDBProduct[]
  total: number
  page: number
  per_page: number
}

function normalize(product: KicksDBProduct): NormalizedSneaker {
  return {
    brand: product.brand || 'Unknown',
    model: product.name || 'Unknown',
    colorway: product.colorway || '',
    sku: product.sku || null,
    releaseDate: product.release_date || null,
    retailPriceCents: product.retail_price ? Math.round(product.retail_price * 100) : null,
    externalImageUrl: product.image?.original || product.image?.small || null,
    externalId: product.id,
    source: 'kicksdb'
  }
}

function normalizeMarketData(product: KicksDBProduct): MarketReference | null {
  if (!product.market_data) return null
  
  return {
    lowestAskCents: product.market_data.lowest_ask 
      ? Math.round(product.market_data.lowest_ask * 100) 
      : null,
    highestBidCents: product.market_data.highest_bid 
      ? Math.round(product.market_data.highest_bid * 100) 
      : null,
    lastSaleCents: product.market_data.last_sale 
      ? Math.round(product.market_data.last_sale * 100) 
      : null,
    salesCount7d: null, // Not available in basic tier
    salesCount30d: null,
    source: 'kicksdb',
    fetchedAt: new Date().toISOString()
  }
}

export async function search(query: string, limit = 10): Promise<NormalizedSneaker[]> {
  const apiKey = process.env.KICKSDB_API_KEY
  
  if (!apiKey) {
    console.warn('KICKSDB_API_KEY not configured')
    return []
  }

  try {
    const params = new URLSearchParams({
      q: query,
      per_page: String(limit)
    })

    const response = await fetch(`${KICKSDB_API_URL}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('KicksDB search failed:', response.status, await response.text())
      return []
    }

    const data: KicksDBSearchResponse = await response.json()
    return data.products.map(normalize)
  } catch (error) {
    console.error('KicksDB search error:', error)
    return []
  }
}

export async function getById(externalId: string): Promise<NormalizedSneaker | null> {
  const apiKey = process.env.KICKSDB_API_KEY
  
  if (!apiKey) return null

  try {
    const response = await fetch(`${KICKSDB_API_URL}/products/${externalId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) return null

    const product: KicksDBProduct = await response.json()
    return normalize(product)
  } catch (error) {
    console.error('KicksDB getById error:', error)
    return null
  }
}

export async function getMarketData(externalId: string): Promise<MarketReference | null> {
  const apiKey = process.env.KICKSDB_API_KEY
  
  if (!apiKey) return null

  try {
    const response = await fetch(`${KICKSDB_API_URL}/products/${externalId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) return null

    const product: KicksDBProduct = await response.json()
    return normalizeMarketData(product)
  } catch (error) {
    console.error('KicksDB getMarketData error:', error)
    return null
  }
}

// Export as provider
export const kicksdbProvider: SneakerApiProvider = {
  name: 'kicksdb',
  search,
  getById,
  getMarketData
}
