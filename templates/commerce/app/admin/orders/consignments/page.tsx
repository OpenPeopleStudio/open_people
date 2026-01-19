'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Consignor {
  id: string
  name: string
  email: string
  phone: string | null
  commission_rate: number
  balance_cents: number
  total_sales_cents: number
  total_paid_cents: number
  created_at: string
}

interface ConsignmentItem {
  id: string
  consignor_id: string
  variant_id: string
  status: 'active' | 'sold' | 'returned' | 'paid'
  list_price_cents: number
  sold_price_cents: number | null
  commission_cents: number | null
  payout_cents: number | null
  created_at: string
  sold_at: string | null
  variant: {
    sku: string
    brand: string
    model: string
    size: string
  }
  consignor: {
    name: string
  }
}

interface Payout {
  id: string
  consignor_id: string
  amount_cents: number
  method: string
  status: 'pending' | 'completed'
  created_at: string
  completed_at: string | null
  consignor: {
    name: string
  }
}

export default function ConsignmentsPage() {
  const [activeTab, setActiveTab] = useState<'consignors' | 'items' | 'payouts'>('consignors')
  const [consignors, setConsignors] = useState<Consignor[]>([])
  const [items, setItems] = useState<ConsignmentItem[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddConsignor, setShowAddConsignor] = useState(false)
  const [, setShowAddItem] = useState(false) // TODO: Implement add item flow
  const [showPayout, setShowPayout] = useState<Consignor | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/consignments')
      if (response.ok) {
        const data = await response.json()
        setConsignors(data.consignors || [])
        setItems(data.items || [])
        setPayouts(data.payouts || [])
      }
    } catch (error) {
      console.error('Error fetching consignment data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin/orders" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Consignment Management</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">Active Consignors</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{consignors.length}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">Active Items</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {items.filter(i => i.status === 'active').length}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">Pending Payouts</p>
          <p className="text-2xl font-bold text-[var(--accent)]">
            ${(consignors.reduce((sum, c) => sum + c.balance_cents, 0) / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">Total Sales</p>
          <p className="text-2xl font-bold text-[var(--success)]">
            ${(consignors.reduce((sum, c) => sum + c.total_sales_cents, 0) / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['consignors', 'items', 'payouts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Consignors Tab */}
          {activeTab === 'consignors' && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                <h2 className="font-semibold text-[var(--text-primary)]">Consignors</h2>
                <button onClick={() => setShowAddConsignor(true)} className="btn-primary text-sm">
                  Add Consignor
                </button>
              </div>
              
              {consignors.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  No consignors yet. Add your first consignor to start tracking payouts.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--bg-tertiary)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Commission</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Total Sales</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Balance Due</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    {consignors.map((consignor) => (
                      <tr key={consignor.id} className="hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-4 font-medium text-[var(--text-primary)]">{consignor.name}</td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-[var(--text-primary)]">{consignor.email}</p>
                          {consignor.phone && (
                            <p className="text-xs text-[var(--text-muted)]">{consignor.phone}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {consignor.commission_rate}%
                        </td>
                        <td className="px-4 py-4 text-[var(--text-primary)]">
                          ${(consignor.total_sales_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`font-medium ${consignor.balance_cents > 0 ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                            ${(consignor.balance_cents / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {consignor.balance_cents > 0 && (
                            <button
                              onClick={() => setShowPayout(consignor)}
                              className="text-xs px-2 py-1 bg-[var(--success)]/20 text-[var(--success)] rounded hover:bg-[var(--success)]/30"
                            >
                              Record Payout
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                <h2 className="font-semibold text-[var(--text-primary)]">Consignment Items</h2>
                <button onClick={() => setShowAddItem(true)} className="btn-primary text-sm">
                  Add Item
                </button>
              </div>
              
              {items.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  No consignment items yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--bg-tertiary)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Consignor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">List Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-4">
                          <p className="font-mono text-sm text-[var(--text-primary)]">{item.variant?.sku}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {item.variant?.brand} {item.variant?.model} • Size {item.variant?.size}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {item.consignor?.name}
                        </td>
                        <td className="px-4 py-4 text-[var(--text-primary)]">
                          ${(item.list_price_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            item.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                            item.status === 'sold' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                            item.status === 'paid' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {item.payout_cents ? `$${(item.payout_cents / 100).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[var(--border-primary)]">
                <h2 className="font-semibold text-[var(--text-primary)]">Payout History</h2>
              </div>
              
              {payouts.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  No payouts recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--bg-tertiary)]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Consignor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)]">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-[var(--text-primary)]">
                          {payout.consignor?.name}
                        </td>
                        <td className="px-4 py-4 font-medium text-[var(--text-primary)]">
                          ${(payout.amount_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {payout.method}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            payout.status === 'completed' 
                              ? 'bg-[var(--success)]/20 text-[var(--success)]' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Consignor Modal */}
      {showAddConsignor && (
        <AddConsignorModal
          onClose={() => setShowAddConsignor(false)}
          onSuccess={() => {
            setShowAddConsignor(false)
            fetchData()
          }}
        />
      )}

      {/* Record Payout Modal */}
      {showPayout && (
        <PayoutModal
          consignor={showPayout}
          onClose={() => setShowPayout(null)}
          onSuccess={() => {
            setShowPayout(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function AddConsignorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [commissionRate, setCommissionRate] = useState('20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/consignments/consignors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          commissionRate: parseFloat(commissionRate)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add consignor')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add consignor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add Consignor</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label>Commission Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionRate}
              onChange={e => setCommissionRate(e.target.value)}
              required
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Store keeps {commissionRate}%, consignor receives {100 - parseFloat(commissionRate || '0')}%
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Consignor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PayoutModal({ consignor, onClose, onSuccess }: { consignor: Consignor; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState((consignor.balance_cents / 100).toFixed(2))
  const [method, setMethod] = useState('etransfer')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/consignments/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consignorId: consignor.id,
          amountCents: Math.round(parseFloat(amount) * 100),
          method,
          notes
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record payout')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Record Payout</h2>
        
        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg mb-4">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium">Consignor:</span> {consignor.name}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium">Balance Due:</span> ${(consignor.balance_cents / 100).toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Payout Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max={(consignor.balance_cents / 100).toFixed(2)}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-8 min-h-[44px]"
                required
              />
            </div>
          </div>

          <div>
            <label>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value="etransfer">e-Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Recording...' : `Record $${amount} Payout`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
