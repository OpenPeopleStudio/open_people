import { supabase } from './supabaseClient'
import { ProductVariant } from '@/types/database'

import type { CartItem } from '@/types/cart'

export interface CartItemWithVariant extends CartItem {
  variant: ProductVariant
}

export type Cart = CartItem[]

const CART_STORAGE_KEY = '709exclusive_cart'

const getStorageKey = (tenantKey?: string) => {
  if (!tenantKey) return CART_STORAGE_KEY
  return `${CART_STORAGE_KEY}:${tenantKey}`
}

// Client-side cart operations
export function getCart(tenantKey?: string): Cart {
  if (typeof window === 'undefined') return []
  try {
    const cart = localStorage.getItem(getStorageKey(tenantKey))
    return cart ? JSON.parse(cart) : []
  } catch {
    return []
  }
}

export function saveCart(cart: Cart, tenantKey?: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(tenantKey), JSON.stringify(cart))
}

export function addToCart(cart: Cart, variantId: string, qty: number = 1, tenantKey?: string): Cart {
  const existingItem = cart.find(item => item.variant_id === variantId)
  if (existingItem) {
    existingItem.qty += qty
  } else {
    cart.push({ variant_id: variantId, qty })
  }
  saveCart(cart, tenantKey)
  return cart
}

export function removeFromCart(cart: Cart, variantId: string, tenantKey?: string): Cart {
  const newCart = cart.filter(item => item.variant_id !== variantId)
  saveCart(newCart, tenantKey)
  return newCart
}

export function updateQty(cart: Cart, variantId: string, qty: number, tenantKey?: string): Cart {
  if (qty <= 0) {
    return removeFromCart(cart, variantId, tenantKey)
  }
  const item = cart.find(item => item.variant_id === variantId)
  if (item) {
    item.qty = qty
    saveCart(cart, tenantKey)
  }
  return cart
}

export function clearCart(tenantKey?: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(getStorageKey(tenantKey))
}

// Client-side cart display helper
export async function getCartDisplayData(cart: Cart, tenantId?: string): Promise<{
  items: Array<{
    variant_id: string
    qty: number
    variant?: {
      sku: string
      price_cents: number
      stock: number
      reserved: number
    }
  }>
  subtotal: number
}> {
  if (cart.length === 0) {
    return { items: [], subtotal: 0 }
  }

  const variantIds = cart.map(item => item.variant_id)
  let variantsQuery = supabase
    .from('product_variants')
    .select('id, sku, price_cents, stock, reserved')
    .in('id', variantIds)

  if (tenantId) {
    variantsQuery = variantsQuery.eq('tenant_id', tenantId)
  }

  const { data: variants } = await variantsQuery

  const items = cart.map(cartItem => {
    const variant = variants?.find(v => v.id === cartItem.variant_id)
    return {
      ...cartItem,
      variant
    }
  })

  const subtotal = items.reduce((sum, item) => {
    return sum + ((item.variant?.price_cents || 0) * item.qty)
  }, 0)

  return { items, subtotal }
}