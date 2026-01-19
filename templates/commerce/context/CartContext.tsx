'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Cart, getCart, addToCart as addToCartUtil, removeFromCart as removeFromCartUtil, updateQty as updateQtyUtil, clearCart as clearCartUtil } from '../lib/cart'

interface CartContextType {
  cart: Cart
  addToCart: (variantId: string, qty?: number) => void
  removeFromCart: (variantId: string) => void
  updateQty: (variantId: string, qty: number) => void
  clearCart: () => void
  itemCount: number
  isHydrated: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({
  children,
  tenantId,
}: {
  children: React.ReactNode
  tenantId: string
}) {
  // Start with empty cart to match server render
  const [cart, setCart] = useState<Cart>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const tenantKey = tenantId || 'default'

  // Hydrate cart from localStorage after mount
  useEffect(() => {
    const savedCart = getCart(tenantKey)
    setCart(savedCart)
    setIsHydrated(true)
  }, [tenantKey])

  const addToCart = (variantId: string, qty: number = 1) => {
    setCart(currentCart => addToCartUtil([...currentCart], variantId, qty, tenantKey))
  }

  const removeFromCart = (variantId: string) => {
    setCart(currentCart => removeFromCartUtil([...currentCart], variantId, tenantKey))
  }

  const updateQty = (variantId: string, qty: number) => {
    setCart(currentCart => updateQtyUtil([...currentCart], variantId, qty, tenantKey))
  }

  const clearCart = () => {
    clearCartUtil(tenantKey)
    setCart([])
  }

  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      itemCount,
      isHydrated
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}