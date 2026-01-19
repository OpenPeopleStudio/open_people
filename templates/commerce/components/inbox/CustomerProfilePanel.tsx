'use client'

import { useState, useEffect } from 'react'
import Button from '../../../components/ui/Button'
import PresenceIndicator from './PresenceIndicator'

interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
  paid_at: string | null
  shipped_at: string | null
}

interface Activity {
  type: string
  timestamp: string
  description: string
}

interface CustomerProfile {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  role: string
  createdAt: string
  isOnline: boolean
  lastActiveAt: string | null
  hasEncryption: boolean
}

interface CustomerProfilePanelProps {
  customerId: string
  isOpen: boolean
  onClose: () => void
}

export default function CustomerProfilePanel({
  customerId,
  isOpen,
  onClose
}: CustomerProfilePanelProps) {
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [messageCount, setMessageCount] = useState(0)
  const [activity, setActivity] = useState<Activity[]>([])
  const [error, setError] = useState<string | null>(null)

  const [contactChannel, setContactChannel] = useState<'email' | 'sms' | null>(null)
  const [contactTo, setContactTo] = useState('')
  const [contactSubject, setContactSubject] = useState('')
  const [contactBody, setContactBody] = useState('')
  const [contactSending, setContactSending] = useState(false)
  const [contactResult, setContactResult] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && customerId) {
      loadCustomerProfile()
    }
  }, [isOpen, customerId])

  const loadCustomerProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/customers/${customerId}/profile`)
      
      if (!response.ok) {
        throw new Error('Failed to load customer profile')
      }

      const data = await response.json()
      setCustomer(data.customer)
      setOrders(data.orders || [])
      setMessageCount(data.messageCount || 0)
      setActivity(data.activity || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const openContact = (channel: 'email' | 'sms') => {
    setContactResult(null)
    setContactChannel(channel)
    setContactSubject(channel === 'email' ? 'Quick update from support' : '')
    setContactBody('')
    const to =
      channel === 'email'
        ? (customer?.email || '')
        : (customer?.phone || '')
    setContactTo(to)
  }

  const closeContact = () => {
    setContactChannel(null)
    setContactTo('')
    setContactSubject('')
    setContactBody('')
    setContactSending(false)
  }

  const sendContact = async () => {
    if (!contactChannel) return
    setContactSending(true)
    setContactResult(null)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: contactChannel,
          to: contactTo,
          subject: contactChannel === 'email' ? contactSubject : undefined,
          body: contactBody,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to send')
      }
      setContactResult('Sent.')
      closeContact()
    } catch (err) {
      setContactResult(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setContactSending(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20',
      paid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      fulfilled: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      shipped: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20',
      cancelled: 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20',
      refunded: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    }
    return colors[status] || 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-primary)]'
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Customer Profile</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-muted)]">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          ) : customer ? (
            <>
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {customer.fullName || 'Unknown Customer'}
                    </h3>
                    {customer.email && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">{customer.phone}</p>
                    )}
                  </div>
                  {customer.hasEncryption && (
                    <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <PresenceIndicator
                    isOnline={customer.isOnline}
                    lastActiveAt={customer.lastActiveAt}
                    showLabel
                  />
                </div>

                <div className="pt-2 text-xs text-[var(--text-muted)]">
                  Customer since {formatDate(customer.createdAt)}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{orders.length}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Orders</div>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{messageCount}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">Messages</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Quick Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    View Orders
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openContact('email')}
                    disabled={!customer.email}
                    title={!customer.email ? 'No email on file' : 'Send an email'}
                  >
                    Email
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openContact('sms')}
                    disabled={!customer.phone}
                    title={!customer.phone ? 'No phone found on recent orders' : 'Send a text'}
                  >
                    Text
                  </Button>
                  <Button variant="ghost" size="sm">
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Orders */}
              {orders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Recent Orders ({orders.length})
                  </h4>
                  <div className="space-y-2">
                    {orders.slice(0, 5).map(order => (
                      <div
                        key={order.id}
                        className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] hover:border-[var(--accent)]/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                          {formatCurrency(order.total_cents)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              {activity.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Recent Activity
                  </h4>
                  <div className="space-y-3">
                    {activity.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-[var(--accent)]"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)]">{item.description}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {formatDate(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Contact Modal */}
      {contactChannel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-2xl">
            <div className="flex items-start justify-between p-6 border-b border-[var(--border-primary)]">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Send {contactChannel === 'email' ? 'email' : 'text'}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  This sends an external notification via your configured provider.
                </p>
              </div>
              <button
                type="button"
                onClick={closeContact}
                className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                  To
                </label>
                <input
                  value={contactTo}
                  onChange={(e) => setContactTo(e.target.value)}
                  placeholder={contactChannel === 'email' ? 'name@example.com' : '+15551234567'}
                  className="w-full"
                />
              </div>

              {contactChannel === 'email' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                    Subject
                  </label>
                  <input
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                  Message
                </label>
                <textarea
                  value={contactBody}
                  onChange={(e) => setContactBody(e.target.value)}
                  rows={6}
                  className="w-full"
                  placeholder="Type your message..."
                />
              </div>

              {contactResult && (
                <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)]">{contactResult}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-[var(--border-primary)]">
              <Button
                variant="secondary"
                onClick={closeContact}
                className="flex-1"
                disabled={contactSending}
              >
                Cancel
              </Button>
              <Button
                onClick={sendContact}
                className="flex-1"
                disabled={contactSending || !contactTo.trim() || !contactBody.trim() || (contactChannel === 'email' && !contactSubject.trim())}
              >
                {contactSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

