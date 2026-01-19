'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { supabase } from '../../@/lib/supabaseClient'
import Header from '../../../../../components/Header'
import Footer from '../../../../../components/Footer'
import { useTenant } from '../../@/context/TenantContext'

interface OrderStatus {
  status: string
  timestamp: string
  description: string
}

interface Order {
  id: string
  status: string
  total_cents: number
  shipping_address: {
    name: string
    email: string
    address: string
    city: string
    postal_code: string
    province: string
    country: string
  }
  tracking_number?: string
  carrier?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  payment_method?: string
}

const STATUS_STEPS = [
  { key: 'paid', label: 'Order Confirmed', icon: '✓' },
  { key: 'fulfilled', label: 'Packed & Ready', icon: '📦' },
  { key: 'shipped', label: 'Shipped', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '🏠' },
]

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { id: tenantId } = useTenant()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusHistory, setStatusHistory] = useState<OrderStatus[]>([])

  useEffect(() => {
    const fetchOrder = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/account/login'
        return
      }

      let orderQuery = supabase
        .from('orders')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('customer_id', user.id)

      if (tenantId) {
        orderQuery = orderQuery.eq('tenant_id', tenantId)
      }

      const { data } = await orderQuery.single()

      if (data) {
        setOrder(data)
        
        // Build status history
        const history: OrderStatus[] = []
        history.push({
          status: 'paid',
          timestamp: data.created_at,
          description: 'Your order has been confirmed and payment received.'
        })
        if (data.status === 'fulfilled' || data.status === 'shipped' || data.status === 'delivered') {
          history.push({
            status: 'fulfilled',
            timestamp: data.shipped_at || data.created_at,
            description: 'Your order has been packed and is ready for shipping.'
          })
        }
        if (data.shipped_at) {
          history.push({
            status: 'shipped',
            timestamp: data.shipped_at,
            description: `Your order is on its way via ${data.carrier || 'carrier'}.`
          })
        }
        if (data.delivered_at) {
          history.push({
            status: 'delivered',
            timestamp: data.delivered_at,
            description: 'Your order has been delivered!'
          })
        }
        setStatusHistory(history)
      }

      setLoading(false)
    }

    fetchOrder()
  }, [resolvedParams.id])

  const getStepStatus = (stepKey: string) => {
    const stepIndex = STATUS_STEPS.findIndex(s => s.key === stepKey)
    const currentIndex = STATUS_STEPS.findIndex(s => s.key === order?.status)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  const getEstimatedDelivery = () => {
    if (!order?.shipped_at) return null
    const shippedDate = new Date(order.shipped_at)
    const estimatedMin = new Date(shippedDate)
    estimatedMin.setDate(estimatedMin.getDate() + 3)
    const estimatedMax = new Date(shippedDate)
    estimatedMax.setDate(estimatedMax.getDate() + 7)
    
    return {
      min: estimatedMin.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      max: estimatedMax.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
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

  if (!order) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Order Not Found</h1>
            <p className="mt-2 text-[var(--text-secondary)]">This order doesn&apos;t exist or you don&apos;t have access.</p>
            <Link href="/account/orders" className="btn-primary mt-6 inline-block">
              View All Orders
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const estimatedDelivery = getEstimatedDelivery()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <nav className="mb-8">
            <Link href="/account/orders" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
              ← Back to Orders
            </Link>
          </nav>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Order Tracking</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <Link
                href={`/account/orders/${order.id}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                View Details
              </Link>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between items-center relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--border-primary)]">
                  <div 
                    className="h-full bg-[var(--accent)] transition-all duration-500"
                    style={{ 
                      width: `${(STATUS_STEPS.findIndex(s => s.key === order.status) / (STATUS_STEPS.length - 1)) * 100}%` 
                    }}
                  />
                </div>

                {STATUS_STEPS.map((step) => {
                  const status = getStepStatus(step.key)
                  return (
                    <div key={step.key} className="relative flex flex-col items-center z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        status === 'completed' 
                          ? 'bg-[var(--accent)] text-white'
                          : status === 'current'
                            ? 'bg-[var(--accent)] text-white ring-4 ring-[var(--accent)]/30'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                      }`}>
                        {status === 'completed' ? '✓' : step.icon}
                      </div>
                      <span className={`mt-2 text-xs text-center ${
                        status === 'pending' ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Current Status */}
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg mb-6">
              {order.status === 'delivered' ? (
                <div className="text-center">
                  <span className="text-3xl mb-2 block">🎉</span>
                  <p className="font-medium text-[var(--success)]">Delivered!</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {order.delivered_at && new Date(order.delivered_at).toLocaleDateString('en-CA', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ) : order.status === 'shipped' ? (
                <div>
                  <p className="font-medium text-[var(--text-primary)] mb-1">📍 Your order is on its way!</p>
                  {estimatedDelivery && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Estimated delivery: <span className="font-medium">{estimatedDelivery.min} - {estimatedDelivery.max}</span>
                    </p>
                  )}
                </div>
              ) : order.status === 'fulfilled' ? (
                <p className="text-[var(--text-secondary)]">
                  Your order is packed and waiting for pickup by the carrier.
                </p>
              ) : (
                <p className="text-[var(--text-secondary)]">
                  Your order is being prepared. We&apos;ll notify you when it ships!
                </p>
              )}
            </div>

            {/* Tracking Number */}
            {order.tracking_number && (
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Tracking Number</p>
                    <p className="font-mono text-[var(--text-primary)]">{order.tracking_number}</p>
                    {order.carrier && (
                      <p className="text-sm text-[var(--text-secondary)]">via {order.carrier}</p>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/search?q=${order.carrier}+tracking+${order.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm"
                  >
                    Track Package →
                  </a>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <h3 className="font-medium text-[var(--text-primary)] mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {statusHistory.map((status, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[var(--accent)]" />
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{STATUS_STEPS.find(s => s.key === status.status)?.label}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{status.description}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {new Date(status.timestamp).toLocaleString('en-CA', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 mb-6">
            <h3 className="font-medium text-[var(--text-primary)] mb-4">Shipping To</h3>
            <div className="text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">{order.shipping_address?.name}</p>
              <p>{order.shipping_address?.address}</p>
              <p>
                {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}
              </p>
              <p>{order.shipping_address?.country}</p>
            </div>
          </div>

          {/* Need Help */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
            <h3 className="font-medium text-[var(--text-primary)] mb-4">Need Help?</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/account/messages" className="btn-secondary text-sm">
                💬 Contact Support
              </Link>
              <Link href="/policies/returns" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Return Policy
              </Link>
              <Link href="/policies/shipping" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                Shipping FAQ
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
