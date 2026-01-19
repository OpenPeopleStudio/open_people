'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import EncryptionLockScreen from '../../../../components/EncryptionLockScreen'

interface OrderItem {
  id: string
  quantity: number
  price_cents: number
  variant: {
    sku: string
    size: string
    brand: string
    model: string
  }
}

interface Order {
  id: string
  status: string
  total_cents: number
  customer_email: string
  shipping_name: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  tracking_number: string | null
  carrier: string | null
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  items: OrderItem[]
}

type FilterStatus = 'all' | 'pending' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState<Order | null>(null)
  const [showReturnModal, setShowReturnModal] = useState<Order | null>(null)
  const [showShipModal, setShowShipModal] = useState<Order | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)

  const { isLocked, unlockKeys, error: encryptionError } = useE2EEncryption(adminId)

  useEffect(() => {
    const getAdminId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminId(user.id)
      }
    }
    getAdminId()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await fetch(`/api/admin/orders${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const selectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    }
  }

  const bulkAction = async (action: 'fulfill' | 'cancel') => {
    if (selectedOrders.size === 0) return
    setProcessing(true)
    
    try {
      const endpoint = action === 'fulfill' ? '/api/admin/orders/fulfill' : '/api/admin/orders/cancel'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders) })
      })
      
      if (response.ok) {
        setSelectedOrders(new Set())
        fetchOrders()
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      paid: 'bg-blue-500/20 text-blue-400',
      fulfilled: 'bg-purple-500/20 text-purple-400',
      shipped: 'bg-[var(--success)]/20 text-[var(--success)]',
      delivered: 'bg-[var(--success)]/20 text-[var(--success)]',
      cancelled: 'bg-[var(--error)]/20 text-[var(--error)]',
      refunded: 'bg-orange-500/20 text-orange-400',
    }
    return styles[status] || 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
  }

  const filterCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    fulfilled: orders.filter(o => o.status === 'fulfilled').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    refunded: orders.filter(o => o.status === 'refunded').length,
  }

  // Show lock screen if encryption is locked
  if (isLocked) {
    return <EncryptionLockScreen onUnlock={unlockKeys} error={encryptionError} />
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Orders</h1>
        <div className="flex gap-2">
          <Link 
            href="/admin/orders/returns" 
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-tertiary)] transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
            <span className="hidden sm:inline">Returns</span>
            <span className="sm:hidden">Returns</span>
          </Link>
          <Link 
            href="/admin/orders/consignments" 
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-tertiary)] transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Consign</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 opacity-60">({filterCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedOrders.size > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-[var(--text-primary)]">
            {selectedOrders.size} order(s) selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => bulkAction('fulfill')}
              disabled={processing}
              className="btn-primary text-sm"
            >
              Mark Fulfilled
            </button>
            <button
              onClick={() => bulkAction('cancel')}
              disabled={processing}
              className="btn-secondary text-sm text-[var(--error)]"
            >
              Cancel Orders
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === orders.length && orders.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm text-[var(--accent)] hover:underline">
                      #{order.id.slice(-8)}
                    </Link>
                    {order.tracking_number && (
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {order.carrier}: {order.tracking_number}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-[var(--text-primary)]">{order.shipping_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                    {order.items?.length || 0} item(s)
                  </td>
                  <td className="px-4 py-4 font-medium text-[var(--text-primary)]">
                    ${(order.total_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {order.status === 'paid' && (
                        <button
                          onClick={() => setShowShipModal(order)}
                          className="text-xs px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded hover:bg-[var(--accent)]/30"
                        >
                          Ship
                        </button>
                      )}
                      {['paid', 'fulfilled', 'shipped'].includes(order.status) && (
                        <button
                          onClick={() => setShowRefundModal(order)}
                          className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30"
                        >
                          Refund
                        </button>
                      )}
                      {['shipped', 'delivered'].includes(order.status) && (
                        <button
                          onClick={() => setShowReturnModal(order)}
                          className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Ship Modal */}
      {showShipModal && (
        <ShipModal
          order={showShipModal}
          onClose={() => setShowShipModal(null)}
          onSuccess={() => {
            setShowShipModal(null)
            fetchOrders()
          }}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <RefundModal
          order={showRefundModal}
          onClose={() => setShowRefundModal(null)}
          onSuccess={() => {
            setShowRefundModal(null)
            fetchOrders()
          }}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <ReturnModal
          order={showReturnModal}
          onClose={() => setShowReturnModal(null)}
          onSuccess={() => {
            setShowReturnModal(null)
            fetchOrders()
          }}
        />
      )}
    </div>
  )
}

// Ship Modal Component
function ShipModal({ order, onClose, onSuccess }: { order: Order; onClose: () => void; onSuccess: () => void }) {
  const [carrier, setCarrier] = useState('canada_post')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/orders/ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          carrier,
          trackingNumber,
          sendEmail: true
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to ship order')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ship order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Ship Order #{order.id.slice(-8)}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Carrier</label>
            <select value={carrier} onChange={e => setCarrier(e.target.value)}>
              <option value="canada_post">Canada Post</option>
              <option value="ups">UPS</option>
              <option value="fedex">FedEx</option>
              <option value="purolator">Purolator</option>
              <option value="dhl">DHL</option>
              <option value="usps">USPS</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label>Tracking Number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              required
            />
          </div>

          <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-medium">Ship to:</span><br />
              {order.shipping_name}<br />
              {order.shipping_address}<br />
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer mb-0">
            <input type="checkbox" id="sendEmail" defaultChecked />
            <span>Send shipping confirmation email</span>
          </label>

          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : 'Ship Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Refund Modal Component
function RefundModal({ order, onClose, onSuccess }: { order: Order; onClose: () => void; onSuccess: () => void }) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [amount, setAmount] = useState((order.total_cents / 100).toFixed(2))
  const [reason, setReason] = useState('')
  const [reasonCode, setReasonCode] = useState('customer_request')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amountCents: Math.round(parseFloat(amount) * 100),
          reasonCode,
          reason,
          sendEmail: true
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process refund')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process refund')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Refund Order #{order.id.slice(-8)}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Refund Type</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setRefundType('full')
                  setAmount((order.total_cents / 100).toFixed(2))
                }}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  refundType === 'full'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border-primary)]'
                }`}
              >
                <p className="font-medium text-[var(--text-primary)]">Full Refund</p>
                <p className="text-sm text-[var(--text-muted)]">${(order.total_cents / 100).toFixed(2)}</p>
              </button>
              <button
                type="button"
                onClick={() => setRefundType('partial')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  refundType === 'partial'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border-primary)]'
                }`}
              >
                <p className="font-medium text-[var(--text-primary)]">Partial Refund</p>
                <p className="text-sm text-[var(--text-muted)]">Custom amount</p>
              </button>
            </div>
          </div>

          {refundType === 'partial' && (
            <div>
              <label>Refund Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(order.total_cents / 100).toFixed(2)}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label>Reason Code</label>
            <select value={reasonCode} onChange={e => setReasonCode(e.target.value)}>
              <option value="customer_request">Customer Request</option>
              <option value="item_not_received">Item Not Received</option>
              <option value="item_damaged">Item Damaged</option>
              <option value="wrong_item">Wrong Item Sent</option>
              <option value="item_defective">Item Defective</option>
              <option value="duplicate_charge">Duplicate Charge</option>
              <option value="fraud">Fraud</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label>Additional Notes</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Optional notes about this refund..."
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer mb-0">
            <input type="checkbox" id="sendRefundEmail" defaultChecked />
            <span>Send refund confirmation email</span>
          </label>

          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Processing...' : `Refund $${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Return Modal Component
function ReturnModal({ order, onClose, onSuccess }: { order: Order; onClose: () => void; onSuccess: () => void }) {
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(order.items?.map(i => i.id) || []))
  const [action, setAction] = useState<'restock' | 'writeoff'>('restock')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/orders/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          returnType,
          itemIds: Array.from(selectedItems),
          inventoryAction: action,
          reason,
          sendEmail: true
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process return')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process return')
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Return / Exchange #{order.id.slice(-8)}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Type</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setReturnType('return')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  returnType === 'return'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border-primary)]'
                }`}
              >
                <p className="font-medium text-[var(--text-primary)]">Return</p>
                <p className="text-sm text-[var(--text-muted)]">Refund customer</p>
              </button>
              <button
                type="button"
                onClick={() => setReturnType('exchange')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  returnType === 'exchange'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-[var(--border-primary)]'
                }`}
              >
                <p className="font-medium text-[var(--text-primary)]">Exchange</p>
                <p className="text-sm text-[var(--text-muted)]">Replace item(s)</p>
              </button>
            </div>
          </div>

          <div>
            <label>Select Items</label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {order.items?.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedItems.has(item.id)
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.variant?.sku}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.variant?.brand} {item.variant?.model} • Size {item.variant?.size}
                    </p>
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">
                    ${(item.price_cents / 100).toFixed(2)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label>Inventory Action</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setAction('restock')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  action === 'restock'
                    ? 'border-[var(--success)] bg-[var(--success)]/10'
                    : 'border-[var(--border-primary)]'
                }`}
              >
                <p className="font-medium text-[var(--text-primary)]">Restock</p>
                <p className="text-sm text-[var(--text-muted)]">Add back to inventory</p>
              </button>
              <button
                type="button"
                onClick={() => setAction('writeoff')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  action === 'writeoff'
                    ? 'border-[var(--error)] bg-[var(--error)]/10'
                    : 'border-[var(--border-primary)]'
                }`}
              >
                <p className="font-medium text-[var(--text-primary)]">Write Off</p>
                <p className="text-sm text-[var(--text-muted)]">Mark as unsellable</p>
              </button>
            </div>
          </div>

          <div>
            <label>Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)} required>
              <option value="">Select reason...</option>
              <option value="wrong_size">Wrong Size</option>
              <option value="not_as_described">Not As Described</option>
              <option value="defective">Defective</option>
              <option value="changed_mind">Changed Mind</option>
              <option value="damaged_in_shipping">Damaged in Shipping</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading || selectedItems.size === 0} className="btn-primary flex-1">
              {loading ? 'Processing...' : `Process ${returnType === 'return' ? 'Return' : 'Exchange'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
