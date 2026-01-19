'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  full_name?: string
  role: 'owner' | 'admin' | 'staff' | 'customer'
  created_at: string
  last_sign_in: string | null
}

interface ActivityLog {
  id: string
  user_id: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown>
  created_at: string
}

interface PricingRule {
  id: string
  rule_type: 'brand' | 'model' | 'condition'
  match_value: string
  multiplier: number
  active: boolean
}

interface ShippingMethod {
  id: string
  code: string
  label: string
  description: string | null
  amount_cents: number
  currency: string
  countries: string[]
  provinces: string[]
  requires_local_zone: boolean
  active: boolean
  sort_order: number
}

interface LocalDeliveryZone {
  id: string
  name: string
  country: string
  province: string
  city_names: string[]
  postal_fsa_prefixes: string[]
  active: boolean
  sort_order: number
}

interface MaintenanceMode {
  enabled: boolean
  message: string | null
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'pricing' | 'shipping' | 'alerts' | 'site'>('users')
  const [isOwner, setIsOwner] = useState(false)
  const [roleLoaded, setRoleLoaded] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [deliveryZones, setDeliveryZones] = useState<LocalDeliveryZone[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceMode>({ enabled: false, message: null })
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showAddRule, setShowAddRule] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false)
  const [purgeConfirmText, setPurgeConfirmText] = useState('')
  const [purging, setPurging] = useState(false)

  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await fetch('/api/admin/settings?tab=me')
        if (res.ok) {
          const me = await res.json()
          setIsOwner(me.role === 'owner')
        }
      } finally {
        setRoleLoaded(true)
      }
    }
    loadRole()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  useEffect(() => {
    if (roleLoaded && !isOwner && activeTab === 'site') {
      setActiveTab('users')
    }
  }, [roleLoaded, isOwner, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'site') {
        if (!isOwner) return
        const res = await fetch('/api/admin/settings/maintenance')
        if (res.ok) setMaintenance(await res.json())
      } else {
        const response = await fetch(`/api/admin/settings?tab=${activeTab}`)
        if (response.ok) {
          const data = await response.json()
          if (activeTab === 'users') setUsers(data.users || [])
          if (activeTab === 'activity') setActivityLogs(data.logs || [])
          if (activeTab === 'pricing') setPricingRules(data.rules || [])
          if (activeTab === 'shipping') {
            setShippingMethods(data.shippingMethods || [])
            setDeliveryZones(data.deliveryZones || [])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveMaintenance = async (next: MaintenanceMode) => {
    setSavingMaintenance(true)
    try {
      const res = await fetch('/api/admin/settings/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to update maintenance mode')
      } else {
        setMaintenance(next)
      }
    } catch (e) {
      console.error('Maintenance save error:', e)
      alert('Failed to update maintenance mode')
    } finally {
      setSavingMaintenance(false)
    }
  }

  const purgeCustomers = async () => {
    setPurging(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge_customers', confirm: purgeConfirmText }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Purge failed')
        return
      }

      alert(`Done. Messages cleared: ${data.messages_deleted ?? 'unknown'}. Customers deleted: ${data.customers_targeted ?? 'unknown'}.`)
      setShowPurgeConfirm(false)
      setPurgeConfirmText('')
    } catch (e) {
      console.error('Purge error:', e)
      alert('Purge failed')
    } finally {
      setPurging(false)
    }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch('/api/admin/settings/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update role')
      }

      fetchData()
    } catch (error) {
      console.error('Error updating role:', error)
      alert(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const deleteUser = async (user: User) => {
    setDeleting(true)
    try {
      const response = await fetch('/api/admin/settings/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      if (response.ok) {
        setDeleteConfirm(null)
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const togglePricingRule = async (ruleId: string, active: boolean) => {
    try {
      await fetch('/api/admin/settings/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, active })
      })
      fetchData()
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Delete this pricing rule?')) return
    try {
      await fetch(`/api/admin/settings/pricing?id=${ruleId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const updateShippingMethod = async (code: string, updates: Partial<ShippingMethod>) => {
    try {
      await fetch('/api/admin/settings/shipping/methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, updates }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating shipping method:', error)
    }
  }

  const updateDeliveryZone = async (id: string, updates: Partial<LocalDeliveryZone>) => {
    try {
      await fetch('/api/admin/settings/shipping/zones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating delivery zone:', error)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Admin Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-x-visible scrollbar-hide">
        {(
          (isOwner
            ? (['users', 'activity', 'pricing', 'shipping', 'alerts', 'site'] as Array<typeof activeTab>)
            : (['users', 'activity', 'pricing', 'shipping', 'alerts'] as Array<typeof activeTab>))
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {tab === 'users' && 'Users & Roles'}
            {tab === 'activity' && 'Activity'}
            {tab === 'pricing' && 'Pricing'}
            {tab === 'shipping' && 'Shipping'}
            {tab === 'alerts' && 'Alerts'}
            {tab === 'site' && 'Site & Safety'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              isOwner={isOwner}
              onUpdateRole={updateUserRole}
              onAddUser={() => setShowAddUser(true)}
              onDeleteUser={setDeleteConfirm}
            />
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <ActivityLogTab logs={activityLogs} />
          )}

          {/* Pricing Rules Tab */}
          {activeTab === 'pricing' && (
            <PricingRulesTab
              rules={pricingRules}
              onToggle={togglePricingRule}
              onDelete={deleteRule}
              onAddRule={() => setShowAddRule(true)}
            />
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <ShippingTab
              methods={shippingMethods}
              zones={deliveryZones}
              onUpdateMethod={updateShippingMethod}
              onUpdateZone={updateDeliveryZone}
            />
          )}

          {/* Site & Safety Tab */}
          {activeTab === 'site' && (
            <div className="space-y-6">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">Maintenance Mode</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      When enabled, customers are redirected to `/maintenance`. Admin and APIs remain accessible.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={savingMaintenance}
                    onClick={() => saveMaintenance({ ...maintenance, enabled: !maintenance.enabled })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      maintenance.enabled
                        ? 'bg-[var(--error)] text-white hover:bg-[var(--error)]/90'
                        : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
                    } ${savingMaintenance ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {maintenance.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Optional message
                  </label>
                  <textarea
                    value={maintenance.message || ''}
                    onChange={(e) => setMaintenance((prev) => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    placeholder="Example: Restocking + site updates. Back at 6pm NDT."
                    className="w-full resize-none"
                    disabled={savingMaintenance}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-[var(--text-muted)]">Shows on the maintenance page.</p>
                    <button
                      type="button"
                      disabled={savingMaintenance}
                      onClick={() =>
                        saveMaintenance({
                          ...maintenance,
                          message: (maintenance.message || '').trim() || null,
                        })
                      }
                      className={`btn-secondary text-sm ${savingMaintenance ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      Save message
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Kill switch</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Permanently deletes all customer accounts and clears all messages. Orders are retained but unlinked from customers.
                </p>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="text-sm text-[var(--text-secondary)]">
                    Confirmation phrase: <span className="font-mono text-[var(--text-primary)]">DELETE ALL CUSTOMERS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPurgeConfirm(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--error)] text-white hover:bg-[var(--error)]/90 transition-colors"
                  >
                    Purge customers + messages
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <AlertsTab onRefresh={fetchData} />
          )}
        </>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSuccess={() => {
            setShowAddUser(false)
            fetchData()
          }}
        />
      )}

      {/* Add Pricing Rule Modal */}
      {showAddRule && (
        <AddPricingRuleModal
          onClose={() => setShowAddRule(false)}
          onSuccess={() => {
            setShowAddRule(false)
            fetchData()
          }}
        />
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">
                Delete User Permanently?
              </h2>
              
              <p className="text-[var(--text-secondary)] text-center mb-4">
                This will permanently delete <strong>{deleteConfirm.full_name || deleteConfirm.email}</strong> and all their data:
              </p>
              
              <ul className="text-sm text-[var(--text-muted)] space-y-1 mb-6 bg-[var(--bg-tertiary)] p-4 rounded-lg">
                <li>• User profile and account</li>
                <li>• All orders and order history</li>
                <li>• All messages and conversations</li>
                <li>• Wishlist items and alerts</li>
                <li>• Recently viewed history</li>
                <li>• All associated data</li>
              </ul>
              
              <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg mb-6">
                <p className="text-sm text-[var(--error)] font-medium">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-[var(--error)] text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purge Confirmation Modal */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-2">
                Delete all customer accounts?
              </h2>

              <p className="text-[var(--text-secondary)] text-center mb-5">
                This permanently deletes all customer accounts and clears all messages. This cannot be undone.
              </p>

              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-4 mb-6">
                <p className="text-xs text-[var(--text-muted)] mb-2">Type to confirm:</p>
                <p className="text-xs font-mono text-[var(--text-primary)]">DELETE ALL CUSTOMERS</p>
                <input
                  value={purgeConfirmText}
                  onChange={(e) => setPurgeConfirmText(e.target.value)}
                  className="mt-3 w-full"
                  placeholder="Type the phrase exactly"
                  disabled={purging}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPurgeConfirm(false)
                    setPurgeConfirmText('')
                  }}
                  className="flex-1 btn-secondary"
                  disabled={purging}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={purgeCustomers}
                  disabled={purging || purgeConfirmText !== 'DELETE ALL CUSTOMERS'}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    purging || purgeConfirmText !== 'DELETE ALL CUSTOMERS'
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
                      : 'bg-[var(--error)] text-white hover:bg-[var(--error)]/90'
                  }`}
                >
                  {purging ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Users Tab Component
function UsersTab({ users, isOwner, onUpdateRole, onAddUser, onDeleteUser }: {
  users: User[]
  isOwner: boolean
  onUpdateRole: (userId: string, role: string) => void
  onAddUser: () => void
  onDeleteUser: (user: User) => void
}) {
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all')
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())

  const toggleRole = (role: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev)
      if (next.has(role)) {
        next.delete(role)
      } else {
        next.add(role)
      }
      return next
    })
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: 'bg-purple-500/20 text-purple-400',
      admin: 'bg-blue-500/20 text-blue-400',
      staff: 'bg-green-500/20 text-green-400',
      customer: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
    }
    return styles[role] || styles.customer
  }

  const rolePermissions: Record<string, string[]> = {
    owner: ['All permissions', 'Manage admins', 'Delete products', 'View financials', 'Export data'],
    admin: ['Manage products', 'Manage orders', 'Process refunds', 'View reports'],
    staff: ['View orders', 'Update inventory', 'Process shipments'],
    customer: ['View own orders', 'Make purchases', 'Manage own account'],
  }

  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter((user) => user.role === roleFilter)

  return (
    <div className="space-y-6">
      {/* Permissions Overview */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Role Permissions</h2>
        <div className="space-y-2">
          {Object.entries(rolePermissions).map(([role, perms]) => (
            <div key={role} className="bg-[var(--bg-tertiary)] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleRole(role)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-primary)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadge(role)}`}>
                    {role}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {perms.length} permissions
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${expandedRoles.has(role) ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedRoles.has(role) && (
                <ul className="px-4 pb-3 space-y-1 border-t border-[var(--border-primary)]">
                  {perms.map((perm, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] flex items-center gap-2 pt-2 first:pt-3">
                      <span className="text-[var(--success)]">✓</span> {perm}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Profiles ({filteredUsers.length})
              </h2>
              <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                Filter to preview roles during demos.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <label className="text-xs text-[var(--text-muted)] sr-only sm:not-sr-only">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | User['role'])}
                  className="text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-2 py-1.5 flex-1 sm:flex-initial"
                >
                  <option value="all">All roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              {isOwner ? (
                <button onClick={onAddUser} className="btn-primary text-sm whitespace-nowrap">
                  Invite
                </button>
              ) : (
                <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Owner required</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">User</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Role</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase hidden sm:table-cell">Last Active</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--bg-tertiary)]">
                  <td className="px-3 sm:px-4 py-3 sm:py-4">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[150px] sm:max-w-none">
                      {user.full_name || user.email}
                    </p>
                    {user.full_name && (
                      <p className="text-xs text-[var(--text-secondary)] truncate max-w-[150px] sm:max-w-none">{user.email}</p>
                    )}
                    <p className="text-xs text-[var(--text-muted)]">Added {new Date(user.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-[var(--text-muted)] hidden sm:table-cell">
                    {user.last_sign_in ? new Date(user.last_sign_in).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4">
                    {isOwner && user.role !== 'owner' ? (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => onUpdateRole(user.id, e.target.value)}
                          className="text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-1.5 sm:px-2 py-1"
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded transition-colors flex-shrink-0"
                          title="Delete user and all data"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    No profiles match this role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Activity Log Tab Component
function ActivityLogTab({ logs }: { logs: ActivityLog[] }) {
  const [filter, setFilter] = useState('')

  const filteredLogs = logs.filter(log => 
    !filter || 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(filter.toLowerCase()) ||
    log.user_email.toLowerCase().includes(filter.toLowerCase())
  )

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'text-[var(--success)]'
    if (action.includes('delete') || action.includes('remove')) return 'text-[var(--error)]'
    if (action.includes('update') || action.includes('edit')) return 'text-blue-400'
    return 'text-[var(--text-secondary)]'
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center gap-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Activity Log</h2>
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      
      <div className="max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">No activity logs found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)] sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                    {log.user_email?.split('@')[0]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {log.entity_type}
                    {log.entity_id && (
                      <span className="text-[var(--text-muted)]"> #{log.entity_id.slice(-6)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)] max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// Pricing Rules Tab Component
function PricingRulesTab({ rules, onToggle, onDelete, onAddRule }: {
  rules: PricingRule[]
  onToggle: (ruleId: string, active: boolean) => void
  onDelete: (ruleId: string) => void
  onAddRule: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Pricing rules apply multipliers to base prices based on brand, model, or condition. 
          Rules are applied in order: Brand → Model → Condition.
        </p>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
          <h2 className="font-semibold text-[var(--text-primary)]">Pricing Rules</h2>
          <button onClick={onAddRule} className="btn-primary text-sm">
            Add Rule
          </button>
        </div>
        
        {rules.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No pricing rules configured. Add rules to automatically adjust prices.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Match</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Multiplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      rule.rule_type === 'brand' ? 'bg-purple-500/20 text-purple-400' :
                      rule.rule_type === 'model' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {rule.rule_type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[var(--text-primary)]">{rule.match_value}</td>
                  <td className="px-4 py-4">
                    <span className={`font-mono ${rule.multiplier > 1 ? 'text-[var(--success)]' : rule.multiplier < 1 ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}`}>
                      {rule.multiplier}x
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onToggle(rule.id, !rule.active)}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        rule.active ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                      }`}
                    >
                      {rule.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onDelete(rule.id)}
                      className="text-xs px-2 py-1 text-[var(--error)] hover:bg-[var(--error)]/10 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// Shipping Tab Component
function ShippingTab({ methods, zones, onUpdateMethod, onUpdateZone }: {
  methods: ShippingMethod[]
  zones: LocalDeliveryZone[]
  onUpdateMethod: (code: string, updates: Partial<ShippingMethod>) => Promise<void>
  onUpdateZone: (id: string, updates: Partial<LocalDeliveryZone>) => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Shipping methods control what customers see at checkout. Local delivery methods only appear when the shipping address matches an active local delivery zone.
        </p>
      </div>

      {/* Shipping methods */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Shipping Methods</h2>
        </div>

        {methods.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No shipping methods found. Run `sql/020_shipping_tax.sql` to create defaults.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Label</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Sort</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {methods.map((method) => (
                <ShippingMethodRow
                  key={method.code}
                  method={method}
                  onUpdate={onUpdateMethod}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Local delivery zones */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Local Delivery Zones</h2>
        </div>

        {zones.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No local delivery zones configured.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-primary)]">
            {zones.map((zone) => (
              <LocalDeliveryZoneRow
                key={zone.id}
                zone={zone}
                onUpdate={onUpdateZone}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ShippingMethodRow({ method, onUpdate }: {
  method: ShippingMethod
  onUpdate: (code: string, updates: Partial<ShippingMethod>) => Promise<void>
}) {
  const [label, setLabel] = useState(method.label)
  const [amount, setAmount] = useState((method.amount_cents / 100).toFixed(2))
  const [sortOrder, setSortOrder] = useState(String(method.sort_order ?? 0))
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const parsedAmount = Number(amount)
    const parsedSort = Number(sortOrder)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return
    if (!Number.isFinite(parsedSort)) return

    setSaving(true)
    try {
      await onUpdate(method.code, {
        label: label.trim() || method.label,
        amount_cents: Math.round(parsedAmount * 100),
        sort_order: Math.round(parsedSort),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="hover:bg-[var(--bg-tertiary)]">
      <td className="px-4 py-3">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-[var(--text-muted)]">{method.code}</span>
        {method.requires_local_zone && (
          <div className="text-xs text-[var(--text-muted)] mt-1">Requires zone</div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm w-full min-w-[80px] max-w-[120px] min-h-[40px] py-2"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onUpdate(method.code, { active: !method.active })}
          className={`px-2 py-1 text-xs font-medium rounded ${
            method.active ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
          }`}
        >
          {method.active ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          inputMode="numeric"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="text-sm w-full min-w-[60px] max-w-[80px] min-h-[40px] py-2"
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={save}
          disabled={saving}
          className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white disabled:opacity-50"
        >
          Save
        </button>
      </td>
    </tr>
  )
}

function LocalDeliveryZoneRow({ zone, onUpdate }: {
  zone: LocalDeliveryZone
  onUpdate: (id: string, updates: Partial<LocalDeliveryZone>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [cities, setCities] = useState((zone.city_names || []).join('\n'))
  const [fsas, setFsas] = useState((zone.postal_fsa_prefixes || []).join('\n'))
  const [sortOrder, setSortOrder] = useState(String(zone.sort_order ?? 0))

  const save = async () => {
    const cityNames = cities
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const postalFsas = fsas
      .split('\n')
      .map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))
      .filter(Boolean)

    await onUpdate(zone.id, {
      city_names: cityNames,
      postal_fsa_prefixes: postalFsas,
      sort_order: Number(sortOrder) || 0,
    })
    setEditing(false)
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-[var(--text-primary)]">{zone.name}</h3>
            <span className="text-xs text-[var(--text-muted)]">{zone.country}-{zone.province}</span>
            <button
              onClick={() => onUpdate(zone.id, { active: !zone.active })}
              className={`px-2 py-1 text-xs font-medium rounded ${
                zone.active ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
              }`}
            >
              {zone.active ? 'Active' : 'Inactive'}
            </button>
          </div>

          {!editing ? (
            <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              <div>
                <span className="text-[var(--text-muted)]">FSAs:</span>{' '}
                {(zone.postal_fsa_prefixes || []).length ? (zone.postal_fsa_prefixes || []).join(', ') : '—'}
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Cities:</span>{' '}
                {(zone.city_names || []).length ? (zone.city_names || []).join(', ') : '—'}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--text-muted)]">Postal FSAs (one per line)</label>
                <textarea
                  value={fsas}
                  onChange={(e) => setFsas(e.target.value)}
                  rows={6}
                  className="mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)]">City names (one per line)</label>
                <textarea
                  value={cities}
                  onChange={(e) => setCities(e.target.value)}
                  rows={6}
                  className="mt-1 w-full"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-muted)]">Sort order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="text-sm px-3 py-2 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    className="text-sm px-3 py-2 rounded bg-[var(--accent)] text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm px-3 py-2 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

// Alerts Tab Component
function AlertsTab({ onRefresh }: { onRefresh: () => void }) {
  const [lowStockItems, setLowStockItems] = useState<Array<{
    id: string
    sku: string
    brand: string
    model: string
    stock: number
  }>>([])
  const [stuckReservations, setStuckReservations] = useState<Array<{
    id: string
    variant_id: string
    sku: string
    quantity: number
    created_at: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings/alerts')
      if (response.ok) {
        const data = await response.json()
        setLowStockItems(data.lowStock || [])
        setStuckReservations(data.stuckReservations || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const cleanupReservations = async () => {
    if (!confirm('Release all stuck reservations? This will make reserved inventory available again.')) return
    setCleaning(true)
    try {
      await fetch('/api/admin/settings/alerts/cleanup', { method: 'POST' })
      fetchAlerts()
      onRefresh()
    } catch (error) {
      console.error('Error cleaning up:', error)
    } finally {
      setCleaning(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-8 text-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Low Stock Alerts</h2>
            <p className="text-sm text-[var(--text-muted)]">Items with 3 or fewer in stock</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            lowStockItems.length > 0 ? 'bg-[var(--warning)]/20 text-[var(--warning)]' : 'bg-[var(--success)]/20 text-[var(--success)]'
          }`}>
            {lowStockItems.length} items
          </span>
        </div>
        
        {lowStockItems.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No low stock items. All inventory levels are healthy!
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)] sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-tertiary)]">
                    <td className="px-4 py-3 font-mono text-sm text-[var(--text-primary)]">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {item.brand} {item.model}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.stock === 0 ? 'bg-[var(--error)]/20 text-[var(--error)]' : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stuck Reservations */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Stuck Reservations</h2>
            <p className="text-sm text-[var(--text-muted)]">Reservations older than 30 minutes without payment</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              stuckReservations.length > 0 ? 'bg-[var(--error)]/20 text-[var(--error)]' : 'bg-[var(--success)]/20 text-[var(--success)]'
            }`}>
              {stuckReservations.length} stuck
            </span>
            {stuckReservations.length > 0 && (
              <button
                onClick={cleanupReservations}
                disabled={cleaning}
                className="btn-secondary text-sm"
              >
                {cleaning ? 'Cleaning...' : 'Release All'}
              </button>
            )}
          </div>
        </div>
        
        {stuckReservations.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No stuck reservations. Inventory is clean!
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Reserved Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {stuckReservations.map((res) => (
                <tr key={res.id} className="hover:bg-[var(--bg-tertiary)]">
                  <td className="px-4 py-3 font-mono text-sm text-[var(--text-primary)]">{res.sku}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{res.quantity}</td>
                  <td className="px-4 py-3 text-sm text-[var(--error)]">
                    {new Date(res.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// Add User Modal
function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to invite user')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Invite Team Member</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="team@example.com"
              required
            />
          </div>
          <div>
            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Pricing Rule Modal
function AddPricingRuleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [ruleType, setRuleType] = useState<'brand' | 'model' | 'condition'>('brand')
  const [matchValue, setMatchValue] = useState('')
  const [multiplier, setMultiplier] = useState('1.0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/settings/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType,
          matchValue,
          multiplier: parseFloat(multiplier)
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add rule')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add Pricing Rule</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Rule Type</label>
            <select value={ruleType} onChange={e => setRuleType(e.target.value as 'brand' | 'model' | 'condition')}>
              <option value="brand">Brand</option>
              <option value="model">Model</option>
              <option value="condition">Condition</option>
            </select>
          </div>
          <div>
            <label>
              {ruleType === 'brand' && 'Brand Name'}
              {ruleType === 'model' && 'Model Name'}
              {ruleType === 'condition' && 'Condition Code'}
            </label>
            <input
              type="text"
              value={matchValue}
              onChange={e => setMatchValue(e.target.value)}
              placeholder={ruleType === 'condition' ? 'e.g., DS, VNDS, USED' : 'e.g., Nike, Jordan 1'}
              required
            />
          </div>
          <div>
            <label>Price Multiplier</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={multiplier}
              onChange={e => setMultiplier(e.target.value)}
              required
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              1.0 = no change, 1.2 = +20%, 0.8 = -20%
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
              {loading ? 'Adding...' : 'Add Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
