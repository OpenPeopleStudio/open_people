'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useCart } from '../@/context/CartContext'
import { getCartDisplayData } from '@/lib/cart'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Surface from '../../../components/ui/Surface'
import Button from '../../../components/ui/Button'

interface CartDisplayItem {
  variant_id: string
  qty: number
  reserved_at?: string
  variant?: {
    sku: string
    price_cents: number
    stock: number
    reserved: number
    size?: string
    condition?: string
    products?: {
      name: string
      brand: string
      slug: string
    }
  }
}

const HOLD_DURATION_MINUTES = 15 // Reservation hold time
const FREE_SHIPPING_THRESHOLD = 25000 // $250 CAD

export default function CartPage() {
  const { cart, removeFromCart, updateQty, itemCount } = useCart()
  const [cartDisplayData, setCartDisplayData] = useState<{
    items: CartDisplayItem[]
    subtotal: number
  }>({ items: [], subtotal: 0 })
  const [loading, setLoading] = useState(true)
  const [holdTimeRemaining, setHoldTimeRemaining] = useState<number>(HOLD_DURATION_MINUTES * 60)
  const [postalCode, setPostalCode] = useState('')
  const [shippingEstimate, setShippingEstimate] = useState<{
    standard: number
    express: number
    isLocal: boolean
    isFreeShipping: boolean
  } | null>(null)

  useEffect(() => {
    const loadCartData = async () => {
      if (cart.length > 0) {
        const data = await getCartDisplayData(cart)
        setCartDisplayData(data)
        
        // Find earliest reservation time
        const earliestReservation = cart
          .filter(item => item.reserved_at)
          .sort((a, b) => new Date(a.reserved_at!).getTime() - new Date(b.reserved_at!).getTime())[0]
        
        if (earliestReservation?.reserved_at) {
          const reservedAt = new Date(earliestReservation.reserved_at)
          const expiresAt = new Date(reservedAt.getTime() + HOLD_DURATION_MINUTES * 60 * 1000)
          const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
          setHoldTimeRemaining(remaining)
        }
      } else {
        setCartDisplayData({ items: [], subtotal: 0 })
      }
      setLoading(false)
    }
    loadCartData()
  }, [cart])

  // Hold timer countdown
  useEffect(() => {
    if (holdTimeRemaining <= 0 || cart.length === 0) return

    const interval = setInterval(() => {
      setHoldTimeRemaining(prev => {
        if (prev <= 1) {
          // Timer expired - show warning but don't auto-clear
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [holdTimeRemaining, cart.length])

  const formatHoldTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const checkShipping = useCallback(() => {
    if (!postalCode) return

    const isCanadian = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postalCode.replace(/\s/g, ''))
    const isUS = /^\d{5}(-\d{4})?$/.test(postalCode)
    const isLocal = /^A1[A-N]/i.test(postalCode.replace(/\s/g, ''))
    const isFreeShipping = cartDisplayData.subtotal >= FREE_SHIPPING_THRESHOLD

    if (isCanadian) {
      setShippingEstimate({
        standard: isFreeShipping ? 0 : 1500,
        express: 2500,
        isLocal,
        isFreeShipping,
      })
    } else if (isUS) {
      setShippingEstimate({
        standard: 2500,
        express: 4500,
        isLocal: false,
        isFreeShipping: false,
      })
    } else {
      setShippingEstimate(null)
    }
  }, [postalCode, cartDisplayData.subtotal])

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartDisplayData.subtotal)

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Your cart is empty</h1>
            <p className="text-[var(--text-secondary)] mb-8">Looks like you haven&apos;t added anything yet.</p>
            <Button href="/shop" variant="primary">
              Continue shopping
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-4xl">
          {/* Hold Timer Warning */}
          {holdTimeRemaining > 0 && holdTimeRemaining < 300 && (
            <div className="mb-6 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
              <p className="font-medium text-[var(--warning)]">Items reserved</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Complete checkout in <span className="font-mono font-bold">{formatHoldTime(holdTimeRemaining)}</span> to secure your items.
              </p>
            </div>
          )}

          {holdTimeRemaining === 0 && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="font-medium text-[var(--error)]">Reservation expired</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Items may no longer be available. Complete checkout now to attempt purchase.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
              Shopping Cart
            </h1>
            {holdTimeRemaining > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-secondary)] rounded-full">
                <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse"></span>
                <span className="text-sm font-mono text-[var(--text-secondary)]">
                  {formatHoldTime(holdTimeRemaining)}
                </span>
              </div>
            )}
          </div>

          {/* Free Shipping Progress */}
          {freeShippingRemaining > 0 && (
            <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--text-secondary)]">
                  Add <span className="font-medium text-[var(--accent)]">${(freeShippingRemaining / 100).toFixed(0)}</span> more for FREE shipping!
                </span>
                <span className="text-xs text-[var(--text-muted)]">to Canada</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (cartDisplayData.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartDisplayData.items.map((item) => {
                const available = item.variant ? item.variant.stock - item.variant.reserved : 0
                const product = item.variant?.products as { name: string; brand: string; slug: string } | undefined
                
                return (
                  <div 
                    key={item.variant_id} 
                    className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 md:p-6"
                  >
                    <div className="flex items-start gap-4">
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        {product?.brand && (
                          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{product.brand}</p>
                        )}
                        <Link 
                          href={product?.slug ? `/product/${product.slug}` : '#'}
                          className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors line-clamp-2"
                        >
                          {product?.name || item.variant?.sku || `Variant ${item.variant_id.slice(0, 8)}`}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                          {item.variant?.size && (
                            <span>Size {item.variant.size}</span>
                          )}
                          {item.variant?.condition && (
                            <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs">
                              {item.variant.condition}
                            </span>
                          )}
                        </div>
                        {item.variant && (
                          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                            ${(item.variant.price_cents / 100).toFixed(2)} CAD
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => updateQty(item.variant_id, item.qty - 1)}
                          className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="min-w-[32px] w-8 text-center font-medium text-[var(--text-primary)]">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.variant_id, item.qty + 1)}
                          disabled={item.qty >= available}
                          className="min-w-[44px] min-h-[44px] w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.variant_id)}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Line Total */}
                    {item.variant && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex justify-between items-center text-sm">
                        <span className={`${available <= 2 ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>
                          {available <= 2 ? `Only ${available} left!` : `${available} available`}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          ${((item.variant.price_cents * item.qty) / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Surface padding="lg" className="sticky top-24">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Order summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Items ({itemCount})</span>
                    <span className="text-[var(--text-primary)]">${(cartDisplayData.subtotal / 100).toFixed(2)}</span>
                  </div>
                </div>

                {/* Shipping Estimator */}
                <div className="mb-6 pb-6 border-b border-[var(--border-primary)]">
                  <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                    Estimate shipping
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                      placeholder="Postal/ZIP code"
                      className="flex-1 text-sm"
                      maxLength={7}
                    />
                    <button onClick={checkShipping} className="btn-secondary text-sm px-3">
                      Check
                    </button>
                  </div>

                  {shippingEstimate && (
                    <div className="mt-3 space-y-2 text-sm">
                      {shippingEstimate.isLocal && (
                        <div className="flex justify-between text-[var(--success)]">
                          <span>Local delivery</span>
                          <span>{cartDisplayData.subtotal >= 15000 ? 'FREE' : '$10.00'}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Standard</span>
                        <span className={shippingEstimate.isFreeShipping ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}>
                          {shippingEstimate.isFreeShipping ? 'FREE' : `$${(shippingEstimate.standard / 100).toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Express</span>
                        <span className="text-[var(--text-primary)]">${(shippingEstimate.express / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tax Note */}
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  Tax calculated at checkout based on your location
                </p>

                <div className="pt-4 border-t border-[var(--border-primary)] mb-6">
                  <div className="flex justify-between">
                    <span className="font-medium text-[var(--text-primary)]">Subtotal</span>
                    <span className="text-xl font-bold text-[var(--text-primary)]">
                      ${(cartDisplayData.subtotal / 100).toFixed(2)} CAD
                    </span>
                  </div>
                </div>

                <Button href="/checkout" fullWidth>
                  Proceed to checkout
                </Button>

                {/* Payment Methods */}
                <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
                  Card and crypto payments supported.
                </div>

                <Button
                  href="/shop"
                  variant="ghost"
                  fullWidth
                  className="mt-4 text-sm"
                >
                  Continue shopping
                </Button>
              </Surface>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
