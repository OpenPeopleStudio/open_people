'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../../../components/Header'
import Footer from '../../../../components/Footer'
import { useCart } from '@/context/CartContext'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const { clearCart } = useCart()
  const clearedRef = useRef(false)

  useEffect(() => {
    // Clear cart on successful checkout (only once)
    if (!clearedRef.current) {
      clearedRef.current = true
      clearCart()
    }
  }, [clearCart])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center pt-20 pb-16">
        <div className="container max-w-lg text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Order Confirmed!
          </h1>

          <p className="text-[var(--text-secondary)] mb-2">
            Thank you for your order. We&apos;ve received your payment and will start processing your order shortly.
          </p>

          {orderId && (
            <p className="text-sm text-[var(--text-muted)] mb-8">
              Order ID: <span className="font-mono">{orderId.slice(-8)}</span>
            </p>
          )}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-[var(--text-primary)] mb-3">What&apos;s Next?</h2>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2 text-left">
              <li className="flex gap-2">
                <span className="text-[var(--success)]">✓</span>
                You&apos;ll receive an email confirmation shortly
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--text-muted)]">○</span>
                We&apos;ll notify you when your order ships
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--text-muted)]">○</span>
                Track your order in your account
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/account/orders" className="btn-primary">
              View Order
            </Link>
            <Link href="/" className="btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20 pb-16">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
