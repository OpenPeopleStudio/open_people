'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useEncryption } from '../components/EncryptionProvider'
import PWAInstallButton from '../components/account/PWAInstallButton'
import Surface from '../components/ui/Surface'
import Button from '../components/ui/Button'
import { useTenant } from '../@/context/TenantContext'

interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
  tracking_number: string | null
  carrier: string | null
}

interface UserProfile {
  email: string
  full_name: string | null
}

export default function AccountPage() {
  const { id: tenantId, featureFlags } = useTenant()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { hasKeys, isInitializing } = useEncryption()

  useEffect(() => {
    const loadAccount = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        window.location.href = '/account/login'
        return
      }

      setUser({
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || null
      })

      // Fetch recent orders
      let ordersQuery = supabase
        .from('orders')
        .select('*')
        .eq('customer_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (tenantId) {
        ordersQuery = ordersQuery.eq('tenant_id', tenantId)
      }

      const { data: ordersData } = await ordersQuery

      setOrders(ordersData || [])
      setLoading(false)
    }

    loadAccount()
  }, [tenantId])

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-blue-500/20 text-blue-400'
      case 'fulfilled': return 'bg-[var(--warning)]/20 text-[var(--warning)]'
      case 'shipped': return 'bg-[var(--success)]/20 text-[var(--success)]'
      case 'delivered': return 'bg-[var(--success)]/20 text-[var(--success)]'
      case 'cancelled': return 'bg-[var(--error)]/20 text-[var(--error)]'
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-4xl">
          {/* Welcome */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
              </h1>
              <p className="text-[var(--text-muted)] mt-1">{user?.email}</p>
            </div>
            <div className="hidden sm:block">
              <PWAInstallButton label="Install support app" />
            </div>
          </div>

          <div className="sm:hidden mb-6">
            <PWAInstallButton label="Install support app" />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link 
              href="/account/orders"
              className="block"
            >
              <Surface padding="md" className="hover:border-[var(--border-secondary)] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)]">Orders</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 hidden md:block">View & track orders</p>
              </Surface>
            </Link>

            {featureFlags.wishlist !== false && (
              <Link 
                href="/account/wishlist"
                className="block"
              >
                <Surface padding="md" className="hover:border-[var(--border-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-[var(--text-primary)]">Wishlist</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 hidden md:block">Saved items</p>
                </Surface>
              </Link>
            )}

            {featureFlags.messages !== false && (
              <Link 
                href="/account/messages"
                className="block"
              >
                <Surface padding="md" className="hover:border-[var(--border-secondary)] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3 relative">
                  <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {featureFlags.e2e_encryption !== false && hasKeys && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--success)] flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {featureFlags.e2e_encryption !== false && isInitializing && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center">
                      <div className="w-2 h-2 border border-[var(--text-muted)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-[var(--text-primary)]">Messages</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 hidden md:block">
                  {featureFlags.e2e_encryption !== false && hasKeys ? 'Secure chat' : 'Chat with seller'}
                </p>
                </Surface>
              </Link>
            )}

            <Link 
              href="/account/settings"
              className="block"
            >
              <Surface padding="md" className="hover:border-[var(--border-secondary)] transition-colors">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-[var(--text-primary)]">Settings</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 hidden md:block">Account & preferences</p>
              </Surface>
            </Link>
          </div>

          {/* Recent Orders */}
          <Surface padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-primary)] flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent orders</h2>
              <Button href="/account/orders" variant="ghost" size="sm">View all</Button>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[var(--text-muted)]">No orders yet</p>
                <Button href="/shop" variant="primary" size="sm" className="mt-4 inline-flex">
                  Start shopping
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-primary)]">
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <Link href={`/account/orders/${order.id}`} className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusStyles(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="font-medium text-[var(--text-primary)]">
                        ${(order.total_cents / 100).toFixed(2)}
                      </span>
                      {(order.status === 'shipped' || order.tracking_number) && (
                        <Link 
                          href={`/account/orders/${order.id}/tracking`}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          Track
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </div>
      </main>

      <Footer />
    </div>
  )
}
