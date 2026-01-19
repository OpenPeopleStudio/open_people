/**
 * Sneaker API Client
 * 
 * Unified client that:
 * - Routes to configured provider
 * - Handles in-memory caching (15 min default)
 * - Provides fallback behavior
 * 
 * Design principle: "lens, not load-bearing beam"
 */

import type { NormalizedSneaker, SneakerSearchResult, MarketReference, SneakerApiProvider } from './types'
import { kicksdbProvider } from './providers/kicksdb'
import { sneaksProvider } from './providers/sneaks'
import { manualProvider } from './providers/manual'

// In-memory cache (ephemeral - cleared on restart)
const searchCache = new Map<string, { results: NormalizedSneaker[], expiresAt: number }>()
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

// Provider registry
const providers: Record<string, SneakerApiProvider> = {
  kicksdb: kicksdbProvider,
  sneaks: sneaksProvider,
  manual: manualProvider
}

function getActiveProvider(): SneakerApiProvider {
  // Check which provider is configured (in priority order)
  if (process.env.KICKSDB_API_KEY) {
    return providers.kicksdb
  }
  
  // Try sneaks-api as fallback (no API key needed)
  // It will return empty if the package isn't available
  return providers.sneaks
}

function getCacheKey(query: string): string {
  return `search:${query.toLowerCase().trim()}`
}

/**
 * Search for sneakers
 * 
 * - Checks cache first
 * - Falls back gracefully if API unavailable
 * - Never throws
 */
export async function searchSneakers(
  query: string,
  limit = 10
): Promise<SneakerSearchResult> {
  const cacheKey = getCacheKey(query)
  
  // Check cache
  const cached = searchCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return {
      results: cached.results,
      query,
      cached: true,
      cacheExpiresAt: new Date(cached.expiresAt).toISOString()
    }
  }

  // Fetch from provider
  const provider = getActiveProvider()
  
  try {
    const results = await provider.search(query, limit)
    
    // Cache results
    const expiresAt = Date.now() + CACHE_TTL_MS
    searchCache.set(cacheKey, { results, expiresAt })
    
    return {
      results,
      query,
      cached: false,
      cacheExpiresAt: new Date(expiresAt).toISOString()
    }
  } catch (error) {
    console.error('Sneaker search failed:', error)
    
    // Return empty results on failure (site keeps working)
    return {
      results: [],
      query,
      cached: false
    }
  }
}

/**
 * Get sneaker by external ID
 */
export async function getSneakerById(
  externalId: string,
  providerName?: string
): Promise<NormalizedSneaker | null> {
  const provider = providerName ? providers[providerName] : getActiveProvider()
  
  if (!provider.getById) return null
  
  try {
    return await provider.getById(externalId)
  } catch (error) {
    console.error('Get sneaker by ID failed:', error)
    return null
  }
}

/**
 * Get market reference data
 * 
 * Returns null if unavailable - this is expected.
 * Market data is informational only.
 */
export async function getMarketData(
  externalId: string,
  providerName?: string
): Promise<MarketReference | null> {
  const provider = providerName ? providers[providerName] : getActiveProvider()
  
  if (!provider.getMarketData) return null
  
  try {
    return await provider.getMarketData(externalId)
  } catch (error) {
    console.error('Get market data failed:', error)
    return null
  }
}

/**
 * Clear search cache
 * Useful for testing or manual refresh
 */
export function clearCache(): void {
  searchCache.clear()
}

/**
 * Get provider status
 */
export function getProviderStatus(): {
  name: string
  configured: boolean
  cacheSize: number
} {
  const provider = getActiveProvider()
  return {
    name: provider.name,
    configured: provider.name !== 'manual',
    cacheSize: searchCache.size
  }
}
