'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import EncryptionLockScreen from '../../../components/EncryptionLockScreen'

interface Customer {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  created: number
  orderCount: number
  eligibleOrderCount: number
  hasPurchase: boolean
  totalSpent: number
  lastOrder: string | null
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'buyers' | 'window'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'spent' | 'orders' | 'name'>('recent')
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
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/admin/customers')
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to fetch customers')
        }
      } catch (err) {
        console.error('Error fetching customers:', err)
        setError('Failed to fetch customers')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers
    .filter(customer => {
      const search = searchTerm.toLowerCase()
      const matchesSearch = (
        customer.email?.toLowerCase().includes(search) ||
        customer.name?.toLowerCase().includes(search) ||
        customer.phone?.includes(search)
      )
      if (!matchesSearch) return false
      if (purchaseFilter === 'buyers') return customer.hasPurchase
      if (purchaseFilter === 'window') return !customer.hasPurchase
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'spent':
          return b.totalSpent - a.totalSpent
        case 'orders':
          return b.orderCount - a.orderCount
        case 'name':
          return (a.name || a.email || '').localeCompare(b.name || b.email || '')
        case 'recent':
        default:
          return b.created - a.created
      }
    })

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0)
  const buyerCount = customers.filter((c) => c.hasPurchase).length
  const windowShopperCount = customers.length - buyerCount

  const getInitials = (customer: Customer) => {
    if (customer.name) {
      const parts = customer.name.split(' ')
      return parts.length > 1 
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : customer.name.slice(0, 2).toUpperCase()
    }
    return (customer.email || '?').slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-400',
      'bg-purple-500/20 text-purple-400',
      'bg-green-500/20 text-green-400',
      'bg-orange-500/20 text-orange-400',
      'bg-pink-500/20 text-pink-400',
      'bg-cyan-500/20 text-cyan-400',
    ]
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  // Show lock screen if encryption is locked
  if (isLocked) {
    return <EncryptionLockScreen onUnlock={unlockKeys} error={encryptionError} />
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Customers</h1>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="skeleton h-6 w-12 mb-1"></div>
              <div className="skeleton h-3 w-20"></div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2"></div>
                  <div className="skeleton h-3 w-48"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Customers</h1>
        <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl p-6">
          <p className="text-[var(--error)]">{error}</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Make sure your Stripe API key is configured correctly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Customers</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{customers.length} contacts</p>
        </div>
      </div>

      {/* Quick Stats - Compact Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{customers.length}</p>
          <p className="text-xs text-[var(--text-muted)]">Total</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <p className="text-2xl font-bold text-[var(--success)]">{buyerCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Buyers</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <p className="text-2xl font-bold text-[var(--accent)]">${(totalRevenue / 100).toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)]">Revenue</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalOrders}</p>
          <p className="text-xs text-[var(--text-muted)]">Orders</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-16 z-10 bg-[var(--bg-primary)] pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-3 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter & Sort Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
              <button
                onClick={() => setPurchaseFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  purchaseFilter === 'all'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPurchaseFilter('buyers')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  purchaseFilter === 'buyers'
                    ? 'bg-[var(--success)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Buyers ({buyerCount})
              </button>
              <button
                onClick={() => setPurchaseFilter('window')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  purchaseFilter === 'window'
                    ? 'bg-[var(--warning)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Browsing ({windowShopperCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs bg-[var(--bg-tertiary)] border-0 rounded-lg px-2 py-1.5 text-[var(--text-secondary)] focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="recent">Recent</option>
              <option value="spent">Top spenders</option>
              <option value="orders">Most orders</option>
              <option value="name">A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List - Contact Book Style */}
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[var(--text-muted)]">
              {searchTerm ? 'No customers match your search' : 'No customers yet'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Link
              key={customer.id}
              href={`/admin/customers/${customer.id}`}
              className="block bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-tertiary)] transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getAvatarColor(customer.id)}`}>
                  <span className="text-sm font-semibold">{getInitials(customer)}</span>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                          {customer.name || 'No name'}
                        </h3>
                        {customer.hasPurchase ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--success)]/20 text-[var(--success)]">
                            Buyer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--warning)]/15 text-[var(--warning)]">
                            Browsing
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-muted)] truncate">
                        {customer.email || 'No email'}
                      </p>
                    </div>

                    {/* Right Side - Stats */}
                    <div className="text-right flex-shrink-0">
                      {customer.totalSpent > 0 ? (
                        <p className="text-sm font-semibold text-[var(--success)]">
                          ${(customer.totalSpent / 100).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--text-muted)]">$0</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)]">
                        {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info & Meta */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {customer.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Joined {formatDate(customer.created)}
                    </span>
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className="self-center text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Results Count */}
      {filteredCustomers.length > 0 && (
        <p className="text-center text-xs text-[var(--text-muted)] mt-6 pb-4">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      )}
    </div>
  )
}
