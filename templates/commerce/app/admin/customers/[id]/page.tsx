'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Button from '../../../../../components/ui/Button'

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  shippingAddress: any
  trackingNumber?: string
  shippingCarrier?: string
  deliveredAt?: string
}

interface CustomerData {
  id: string
  fullName: string
  email: string
  phone: string | null
  createdAt: string
  orders: Order[]
  messageCount: number
  totalSpent: number
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  useEffect(() => {
    loadCustomer()
  }, [customerId])

  const loadCustomer = async () => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/profile`)
      if (!response.ok) throw new Error('Failed to load customer')
      
      const data = await response.json()
      setCustomer({
        id: data.customer.id,
        fullName: data.customer.fullName,
        email: data.customer.email,
        phone: data.customer.phone,
        createdAt: data.customer.createdAt,
        orders: data.orders,
        messageCount: data.messageCount,
        totalSpent: data.customer.totalSpent
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-[var(--text-muted)]">Loading customer...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-[var(--error)] mb-4">{error || 'Customer not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{customer.fullName}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Customer since {formatDate(customer.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </Button>
            <Button variant="secondary" size="sm" disabled={!customer.phone}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Text
            </Button>
            <Button variant="secondary" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
            <div className="text-3xl font-bold text-[var(--text-primary)]">{customer.orders.length}</div>
            <div className="text-sm text-[var(--text-muted)] mt-1">Total Orders</div>
          </div>
          <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
            <div className="text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(customer.totalSpent)}</div>
            <div className="text-sm text-[var(--text-muted)] mt-1">Lifetime Value</div>
          </div>
          <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
            <div className="text-3xl font-bold text-[var(--text-primary)]">{customer.messageCount}</div>
            <div className="text-sm text-[var(--text-muted)] mt-1">Messages</div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Email</div>
              <div className="text-sm text-[var(--text-primary)]">{customer.email}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Phone</div>
              <div className="text-sm text-[var(--text-primary)]">{customer.phone || 'Not provided'}</div>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[var(--border-primary)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Order History ({customer.orders.length})</h2>
          </div>
          
          {customer.orders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[var(--text-muted)]">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-primary)]">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6 hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          order.status === 'delivered' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                          order.status === 'shipped' ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]' :
                          order.status === 'processing' ? 'bg-[var(--accent)]/10 text-[var(--accent)]' :
                          'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[var(--text-primary)]">
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                  </div>

                  {selectedOrder === order.id && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-primary)] space-y-4">
                      {/* Shipping Info */}
                      {order.shippingAddress && (
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Shipping Address
                          </div>
                          <div className="text-sm text-[var(--text-primary)]">
                            {order.shippingAddress.line1}<br />
                            {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
                          </div>
                        </div>
                      )}

                      {/* Tracking Info */}
                      {(order.trackingNumber || order.shippingCarrier) && (
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Tracking Information
                          </div>
                          <div className="flex items-center gap-2">
                            {order.shippingCarrier && (
                              <span className="text-sm font-medium text-[var(--text-primary)]">
                                {order.shippingCarrier}
                              </span>
                            )}
                            {order.trackingNumber && (
                              <span className="font-mono text-sm text-[var(--accent)]">
                                {order.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          Update Tracking
                        </Button>
                        <Button variant="secondary" size="sm">
                          Mark as Shipped
                        </Button>
                        <Button variant="secondary" size="sm">
                          Mark as Delivered
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
