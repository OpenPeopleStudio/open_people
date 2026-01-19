import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabaseServer'
import { getTenantFromRequest } from '@/lib/tenant'
import { hasAdminAccess } from '@/lib/roles'
import PageHeader from '../../../components/admin/PageHeader'
import StatsCard from '../../../components/admin/StatsCard'
import ActionCard from '../../../components/admin/ActionCard'
import Button from '../../../components/ui/Button'
import Link from 'next/link'
import StaffLocationWidget from '../../../components/admin/StaffLocationWidget'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServer()
  const tenant = await getTenantFromRequest()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('709_profiles')
    .select('role')
    .eq('id', user.id)
    .eq('tenant_id', tenant?.id)
    .single()

  if (!hasAdminAccess(profile?.role)) {
    redirect('/')
  }

  // Fetch key metrics
  const today = new Date()
  const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Orders
  let ordersQuery = supabase
    .from('orders')
    .select('id, status, total_cents, created_at', { count: 'exact' })

  if (tenant?.id) {
    ordersQuery = ordersQuery.eq('tenant_id', tenant.id)
  }

  const { data: orders, count: totalOrders } = await ordersQuery

  const recentOrders = orders?.filter(
    o => new Date(o.created_at) > last30Days
  ).length || 0

  const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0
  const revenue30d = orders
    ?.filter(o => 
      ['paid', 'fulfilled', 'shipped', 'delivered'].includes(o.status) &&
      new Date(o.created_at) > last30Days
    )
    .reduce((sum, o) => sum + (o.total_cents || 0), 0) || 0

  // Messages  
  let messagesQuery = supabase
    .from('messages')
    .select('id, read, created_at', { count: 'exact' })

  if (tenant?.id) {
    messagesQuery = messagesQuery.eq('tenant_id', tenant.id)
  }

  const { data: messages, count: totalMessages } = await messagesQuery
  const unreadMessages = messages?.filter(m => !m.read).length || 0

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back${profile?.role === 'owner' ? ', Owner' : ''}`}
        stats={[
          {
            label: 'Total Orders',
            value: totalOrders || 0,
            trend: 'neutral',
            trendValue: `${recentOrders} this month`,
          },
          {
            label: 'Pending',
            value: pendingOrders,
            trend: pendingOrders > 5 ? 'up' : 'neutral',
          },
          {
            label: 'Revenue (30d)',
            value: `$${((revenue30d / 100).toFixed(0))}`,
            trend: revenue30d > 0 ? 'up' : 'neutral',
          },
          {
            label: 'Unread Messages',
            value: unreadMessages,
            trend: unreadMessages > 0 ? 'neutral' : 'neutral',
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Link href="/admin/messages">
          <ActionCard
            title="Messages"
            description="Customer support inbox with E2E encryption"
            icon={
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
            badge={unreadMessages > 0 ? `${unreadMessages}` : undefined}
            badgeColor="error"
          />
        </Link>

        <Link href="/admin/orders">
          <ActionCard
            title="Orders"
            description="Manage orders, fulfillment, and shipping"
            icon={
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            badge={pendingOrders > 0 ? `${pendingOrders} pending` : undefined}
            badgeColor="warning"
          />
        </Link>

        <Link href="/admin/products">
          <ActionCard
            title="Products"
            description="Manage product catalog and variants"
            icon={
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
        </Link>

        <Link href="/admin/inventory">
          <ActionCard
            title="Inventory"
            description="Stock levels, adjustments, and analytics"
            icon={
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            }
          />
        </Link>

        <Link href="/admin/customers">
          <ActionCard
            title="Customers"
            description="View customer data and order history"
            icon={
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </Link>

        <Link href="/admin/reports">
          <ActionCard
            title="Reports"
            description="Analytics, exports, and insights"
            icon={
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </Link>
      </div>

      {/* Staff Location Widget */}
      <div className="mt-6">
        <StaffLocationWidget />
      </div>

      <div className="bg-[var(--accent-blue)]/5 border border-[var(--accent-blue)]/20 rounded-xl md:rounded-2xl p-5 md:p-6">
        <div className="flex gap-3 md:gap-4">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--accent-blue)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] text-sm md:text-base mb-2">
              Install as App
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-3">
              Install the admin console on your device for faster access and a native app experience.
            </p>
            <Link href="/admin/app">
              <Button variant="ghost" size="sm">
                View install instructions →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
