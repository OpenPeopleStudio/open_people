'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import EncryptionLockScreen from '../../../components/EncryptionLockScreen'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import Surface from '../../../components/ui/Surface'
import Button from '../../../components/ui/Button'

interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
  paid_at: string | null
  fulfilled_at: string | null
  shipped_at: string | null
  cancelled_at: string | null
  tracking_number: string | null
  carrier: string | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const { isLocked, unlockKeys, error: encryptionError } = useE2EEncryption(userId)

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders')
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders)
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-500/20 text-blue-400'
      case 'fulfilled': return 'bg-[var(--warning)]/20 text-[var(--warning)]'
      case 'shipped': return 'bg-[var(--success)]/20 text-[var(--success)]'
      case 'cancelled': return 'bg-[var(--error)]/20 text-[var(--error)]'
      case 'refunded': return 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
      default: return 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
    }
  }

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

  // Show lock screen if encryption is locked
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
          <div className="container max-w-4xl">
            <EncryptionLockScreen onUnlock={unlockKeys} error={encryptionError} />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-8">
            Your orders
          </h1>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
                <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] mb-8">You haven&apos;t placed any orders yet.</p>
              <Button href="/shop" variant="primary">Start shopping</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Surface 
                  key={order.id} 
                  padding="md"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusStyles(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.tracking_number && (
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          Tracking: <span className="font-mono">{order.tracking_number}</span>
                          {order.carrier && <span className="text-[var(--text-muted)]"> ({order.carrier})</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xl font-bold text-[var(--text-primary)]">
                        ${(order.total_cents / 100).toFixed(2)}
                      </p>
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                      >
                        View details
                      </Link>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="flex flex-wrap gap-4 text-sm pt-4 border-t border-[var(--border-primary)]">
                    <div className={`flex items-center ${order.paid_at ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${order.paid_at ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'}`}></div>
                      Paid
                    </div>
                    <div className={`flex items-center ${order.fulfilled_at ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${order.fulfilled_at ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'}`}></div>
                      Fulfilled
                    </div>
                    <div className={`flex items-center ${order.shipped_at ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${order.shipped_at ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'}`}></div>
                      Shipped
                    </div>
                  </div>
                </Surface>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
