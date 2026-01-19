/**
 * Sneaks-API Provider
 * 
 * Uses the sneaks-api npm package for sneaker data
 * This is a free alternative that scrapes StockX/GOAT/etc
 */

import type { NormalizedSneaker, SneakerApiProvider } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SneaksAPI: any = null

// Dynamically import sneaks-api (it's a CommonJS module)
async function getSneaksAPI() {
  if (!SneaksAPI) {
    try {
      // Dynamic import with type assertion
      const module = await (Function('return import("sneaks-api")')() as Promise<{ default?: unknown }>)
      SneaksAPI = module.default || module
    } catch (error) {
      console.error('Failed to load sneaks-api:', error)
      return null
    }
  }
  return SneaksAPI
}

interface SneaksProduct {
  shoeName?: string
  brand?: string
  colorway?: string
  styleID?: string
  retailPrice?: number
  releaseDate?: string
  thumbnail?: string
  urlKey?: string
  lowestResellPrice?: {
    stockX?: number
    goat?: number
    flightClub?: number
  }
}

function normalize(product: SneaksProduct): NormalizedSneaker {
  return {
    brand: product.brand || 'Unknown',
    model: product.shoeName || 'Unknown',
    colorway: product.colorway || '',
    sku: product.styleID || null,
    releaseDate: product.releaseDate || null,
    retailPriceCents: product.retailPrice ? Math.round(product.retailPrice * 100) : null,
    externalImageUrl: product.thumbnail || null,
    externalId: product.styleID || product.urlKey || null,
    source: 'sneaks'
  }
}

export async function search(query: string, limit = 10): Promise<NormalizedSneaker[]> {
  const Sneaks = await getSneaksAPI()
  
  if (!Sneaks) {
    console.warn('sneaks-api not available')
    return []
  }

  return new Promise((resolve) => {
    try {
      const sneaks = new Sneaks()
      sneaks.getProducts(query, limit, (err: Error | null, products: SneaksProduct[]) => {
        if (err || !products) {
          console.error('Sneaks search error:', err)
          resolve([])
          return
        }
        resolve(products.map(normalize))
      })
    } catch (error) {
      console.error('Sneaks search error:', error)
      resolve([])
    }
  })
}

export async function getById(styleId: string): Promise<NormalizedSneaker | null> {
  const Sneaks = await getSneaksAPI()
  
  if (!Sneaks) return null

  return new Promise((resolve) => {
    try {
      const sneaks = new Sneaks()
      sneaks.getProductPrices(styleId, (err: Error | null, product: SneaksProduct) => {
        if (err || !product) {
          resolve(null)
          return
        }
        resolve(normalize(product))
      })
    } catch (error) {
      console.error('Sneaks getById error:', error)
      resolve(null)
    }
  })
}

// Export as provider
export const sneaksProvider: SneakerApiProvider = {
  name: 'sneaks',
  search,
  getById
}
