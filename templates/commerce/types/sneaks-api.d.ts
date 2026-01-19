declare module 'sneaks-api' {
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

  class Sneaks {
    getProducts(
      query: string,
      limit: number,
      callback: (err: Error | null, products: SneaksProduct[]) => void
    ): void
    
    getProductPrices(
      styleId: string,
      callback: (err: Error | null, product: SneaksProduct) => void
    ): void
  }

  export = Sneaks
}
