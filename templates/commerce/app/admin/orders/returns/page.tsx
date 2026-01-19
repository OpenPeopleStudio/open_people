'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Return {
  id: string
  order_id: string
  return_type: 'return' | 'exchange'
  status: 'pending' | 'approved' | 'received' | 'completed' | 'rejected'
  reason: string
  inventory_action: 'restock' | 'writeoff'
  refund_amount_cents: number | null
  created_at: string
  completed_at: string | null
  order: {
    id: string
    customer_email: string
    shipping_name: string
  }
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    fetchReturns()
  }, [])

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/orders/returns')
      if (response.ok) {
        const data = await response.json()
        setReturns(data.returns || [])
      }
    } catch (error) {
      console.error('Error fetching returns:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateReturnStatus = async (returnId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/orders/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnId, status })
      })

      if (response.ok) {
        fetchReturns()
      }
    } catch (error) {
      console.error('Error updating return:', error)
    }
  }

  const filteredReturns = returns.filter(r => {
    if (filter === 'pending') return ['pending', 'approved', 'received'].includes(r.status)
    if (filter === 'completed') return ['completed', 'rejected'].includes(r.status)
    return true
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-blue-500/20 text-blue-400',
      received: 'bg-purple-500/20 text-purple-400',
      completed: 'bg-[var(--success)]/20 text-[var(--success)]',
      rejected: 'bg-[var(--error)]/20 text-[var(--error)]',
    }
    return styles[status] || 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin/orders" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-2 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Returns & Exchanges</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">
            {returns.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">
            {returns.filter(r => ['approved', 'received'].includes(r.status)).length}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">Completed</p>
          <p className="text-2xl font-bold text-[var(--success)]">
            {returns.filter(r => r.status === 'completed').length}
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-muted)]">Refunded Total</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            ${(returns.reduce((sum, r) => sum + (r.refund_amount_cents || 0), 0) / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Returns Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No returns found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Return ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-4 font-mono text-sm text-[var(--text-primary)]">
                    #{ret.id.slice(-8)}
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/orders/${ret.order_id}`} className="font-mono text-sm text-[var(--accent)] hover:underline">
                      #{ret.order_id.slice(-8)}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-[var(--text-primary)]">{ret.order?.shipping_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{ret.order?.customer_email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      ret.return_type === 'return' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {ret.return_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                    {ret.reason}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(ret.status)}`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--text-muted)]">
                    {new Date(ret.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {ret.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReturnStatus(ret.id, 'approved')}
                            className="text-xs px-2 py-1 bg-[var(--success)]/20 text-[var(--success)] rounded hover:bg-[var(--success)]/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateReturnStatus(ret.id, 'rejected')}
                            className="text-xs px-2 py-1 bg-[var(--error)]/20 text-[var(--error)] rounded hover:bg-[var(--error)]/30"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {ret.status === 'approved' && (
                        <button
                          onClick={() => updateReturnStatus(ret.id, 'received')}
                          className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30"
                        >
                          Mark Received
                        </button>
                      )}
                      {ret.status === 'received' && (
                        <button
                          onClick={() => updateReturnStatus(ret.id, 'completed')}
                          className="text-xs px-2 py-1 bg-[var(--success)]/20 text-[var(--success)] rounded hover:bg-[var(--success)]/30"
                        >
                          Complete
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
    </div>
  )
}
