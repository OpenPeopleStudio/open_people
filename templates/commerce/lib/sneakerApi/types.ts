/**
 * Sneaker API Types
 * 
 * Provider-agnostic types for sneaker data.
 * These are YOUR canonical types - not the API's.
 */

// Normalized sneaker data from any API
export interface NormalizedSneaker {
  // Core identification
  brand: string
  model: string
  colorway: string
  sku: string | null
  
  // Release info
  releaseDate: string | null // ISO date string
  retailPriceCents: number | null
  
  // Image (external URL - not our responsibility)
  externalImageUrl: string | null
  
  // External reference (for future lookups)
  externalId: string | null
  source: string // e.g., 'kicksdb', 'manual'
}

// Search result from API
export interface SneakerSearchResult {
  results: NormalizedSneaker[]
  query: string
  cached: boolean
  cacheExpiresAt?: string
}

// Market data (read-only, informational)
export interface MarketReference {
  lowestAskCents: number | null
  highestBidCents: number | null
  lastSaleCents: number | null
  salesCount7d: number | null
  salesCount30d: number | null
  source: string
  fetchedAt: string
}

// Provider configuration
export interface SneakerApiProvider {
  name: string
  search: (query: string, limit?: number) => Promise<NormalizedSneaker[]>
  getById?: (externalId: string) => Promise<NormalizedSneaker | null>
  getMarketData?: (externalId: string) => Promise<MarketReference | null>
}

// Import preview (what admin sees before confirming)
export interface ImportPreview {
  sneaker: NormalizedSneaker
  matchesExisting: boolean
  existingProductId?: string
}
