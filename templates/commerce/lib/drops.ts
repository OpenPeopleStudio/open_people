import { Product } from '@/types/database'

export interface DropStatus {
  isVisible: boolean
  isPurchasable: boolean
  timeUntilStart?: number
  timeUntilEnd?: number
  status: 'upcoming' | 'live' | 'ended' | 'not_drop'
}

export function getDropStatus(product: Product): DropStatus {
  const now = new Date()

  // If not a drop product, it's always visible and purchasable
  if (!product.is_drop) {
    return {
      isVisible: true,
      isPurchasable: true,
      status: 'not_drop'
    }
  }

  const startTime = product.drop_starts_at ? new Date(product.drop_starts_at) : null
  const endTime = product.drop_ends_at ? new Date(product.drop_ends_at) : null

  // Drop hasn't started yet
  if (startTime && now < startTime) {
    return {
      isVisible: false, // Hide until drop starts
      isPurchasable: false,
      timeUntilStart: startTime.getTime() - now.getTime(),
      status: 'upcoming'
    }
  }

  // Drop has ended
  if (endTime && now > endTime) {
    return {
      isVisible: true,
      isPurchasable: false,
      status: 'ended'
    }
  }

  // Drop is live
  return {
    isVisible: true,
    isPurchasable: true,
    timeUntilEnd: endTime ? endTime.getTime() - now.getTime() : undefined,
    status: 'live'
  }
}

export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Check if user can purchase based on per-user limits (future feature)
export async function checkUserPurchaseLimit(
  _userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _productId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  _requestedQty: number // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{
  canPurchase: boolean
  maxAllowed?: number
  alreadyPurchased?: number
}> {
  // TODO: Implement per-user purchase limits for drops
  // This would check how much the user has already purchased
  // from this product during the drop window

  return {
    canPurchase: true,
    maxAllowed: undefined,
    alreadyPurchased: 0
  }
}