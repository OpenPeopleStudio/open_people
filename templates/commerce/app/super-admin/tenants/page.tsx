'use client'

import { useEffect, useMemo, useState } from 'react'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || ''

type TenantBilling = {
  plan: string
  status: string
  billing_email: string | null
  trial_ends_at: string | null
  stripe_customer_id?: string | null
}

type TenantDomain = {
  domain: string
  is_primary: boolean
  verified_at: string | null
}

type TenantRecord = {
  id: string
  name: string
  slug: string
  status: string
  primary_domain: string | null
  created_at: string
  tenant_domains?: TenantDomain[]
  tenant_billing?: TenantBilling[]
}

type TenantDraft = {
  status: string
  plan: string
  billingStatus: string
  billingEmail: string
}

const TENANT_STATUS_OPTIONS = ['active', 'inactive', 'suspended'] as const
const BILLING_STATUS_OPTIONS = ['trialing', 'active', 'past_due', 'canceled'] as const

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [drafts, setDrafts] = useState<Record<string, TenantDraft>>({})
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({})
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    primaryDomain: '',
    billingEmail: '',
    plan: 'starter',
    status: 'active',
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/tenants')
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data.error || 'Failed to load tenants')
          return
        }
        setTenants(data.tenants || [])
      } catch (e) {
        console.error('Tenants load error:', e)
        setError('Failed to load tenants')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getDefaultDraft = (tenant: TenantRecord): TenantDraft => {
    const billing = tenant.tenant_billing?.[0]
    return {
      status: tenant.status || 'active',
      plan: billing?.plan || 'starter',
      billingStatus: billing?.status || 'trialing',
      billingEmail: billing?.billing_email || '',
    }
  }

  const updateDraft = (tenant: TenantRecord, updates: Partial<TenantDraft>) => {
    setDrafts((prev) => {
      const base = prev[tenant.id] ?? getDefaultDraft(tenant)
      return { ...prev, [tenant.id]: { ...base, ...updates } }
    })
  }

  const filteredTenants = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return tenants
    return tenants.filter((tenant) => {
      const domain = tenant.primary_domain || tenant.tenant_domains?.find((d) => d.is_primary)?.domain || ''
      return [
        tenant.name,
        tenant.slug,
        tenant.id,
        domain,
        tenant.tenant_billing?.[0]?.billing_email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    })
  }, [query, tenants])

  const getTenantUrl = (tenant: TenantRecord) => {
    const protocol = window.location.protocol
    if (tenant.primary_domain) {
      return `${protocol}//${tenant.primary_domain}`
    }
    if (ROOT_DOMAIN) {
      return `${protocol}//${tenant.slug}.${ROOT_DOMAIN}`
    }
    if (window.location.hostname.endsWith('localhost')) {
      const port = window.location.port ? `:${window.location.port}` : ''
      return `${protocol}//${tenant.slug}.localhost${port}`
    }
    return ''
  }

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      setCreateError('Tenant name is required')
      return
    }
    if (!createForm.slug.trim()) {
      setCreateError('Tenant slug is required')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          slug: createForm.slug,
          primaryDomain: createForm.primaryDomain,
          billingEmail: createForm.billingEmail,
          plan: createForm.plan,
          status: createForm.status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create tenant')
        return
      }
      if (data.tenant) {
        setTenants((prev) => [data.tenant, ...prev])
      }
      if (data.inviteUrl && createForm.billingEmail) {
        setCreateError(`Tenant created! Invite sent to ${createForm.billingEmail}`)
      }
      setCreateForm({
        name: '',
        slug: '',
        primaryDomain: '',
        billingEmail: '',
        plan: 'starter',
        status: 'active',
      })
      setSlugTouched(false)
    } catch (e) {
      console.error('Tenant creation error:', e)
      setCreateError('Failed to create tenant')
    } finally {
      setCreating(false)
    }
  }

  const saveTenant = async (tenant: TenantRecord) => {
    const draft = drafts[tenant.id] ?? getDefaultDraft(tenant)
    setSavingIds((prev) => ({ ...prev, [tenant.id]: true }))
    setRowErrors((prev) => ({ ...prev, [tenant.id]: '' }))

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: draft.status,
          plan: draft.plan,
          billingStatus: draft.billingStatus,
          billingEmail: draft.billingEmail,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRowErrors((prev) => ({ ...prev, [tenant.id]: data.error || 'Save failed' }))
        return
      }
      if (data.tenant) {
        setTenants((prev) => prev.map((t) => (t.id === tenant.id ? data.tenant : t)))
        setDrafts((prev) => {
          const next = { ...prev }
          delete next[tenant.id]
          return next
        })
      }
    } catch (e) {
      console.error('Tenant save error:', e)
      setRowErrors((prev) => ({ ...prev, [tenant.id]: 'Save failed' }))
    } finally {
      setSavingIds((prev) => ({ ...prev, [tenant.id]: false }))
    }
  }

  const openBillingPortal = async (tenantId: string) => {
    setRowErrors((prev) => ({ ...prev, [tenantId]: '' }))
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/billing-portal`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRowErrors((prev) => ({ ...prev, [tenantId]: data.error || 'Failed to open portal' }))
        return
      }
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      console.error('Billing portal error:', e)
      setRowErrors((prev) => ({ ...prev, [tenantId]: 'Failed to open portal' }))
    }
  }

  const sendInvite = async () => {
    if (!selectedTenantId || !inviteEmail.trim()) return
    setInvitingId(selectedTenantId)
    setRowErrors((prev) => ({ ...prev, [selectedTenantId]: '' }))
    
    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenantId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRowErrors((prev) => ({ ...prev, [selectedTenantId]: data.error || 'Failed to send invite' }))
        setInvitingId(null)
        return
      }
      setShowInviteModal(false)
      setInviteEmail('')
      setSelectedTenantId(null)
    } catch (e) {
      console.error('Invite error:', e)
      setRowErrors((prev) => ({ ...prev, [selectedTenantId]: 'Failed to send invite' }))
    } finally {
      setInvitingId(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-[var(--text-muted)]">Loading tenants...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 text-sm text-[var(--error)]">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Tenant Management</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage all tenant sites from the super admin workspace.</p>
        </div>
        <input
          className="w-full max-w-sm rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
          placeholder="Search tenants"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create new tenant</h2>
          <button
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create tenant'}
          </button>
        </div>
        {createError && (
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--error)]">
            {createError}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm text-[var(--text-secondary)]">
            Name
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={createForm.name}
              onChange={(e) => {
                const nextName = e.target.value
                setCreateForm((prev) => ({
                  ...prev,
                  name: nextName,
                  slug: slugTouched ? prev.slug : slugify(nextName),
                }))
              }}
              placeholder="Tenant name"
            />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Slug
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={createForm.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setCreateForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
              }}
              placeholder="tenant-slug"
            />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Primary domain
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={createForm.primaryDomain}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, primaryDomain: e.target.value }))}
              placeholder="store.example.com"
            />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Billing email
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={createForm.billingEmail}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, billingEmail: e.target.value }))}
              placeholder="billing@example.com"
              type="email"
            />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Plan
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={createForm.plan}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, plan: e.target.value }))}
            />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            Status
            <select
              className="mt-2 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
              value={createForm.status}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              {TENANT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border-primary)] text-left text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Primary domain</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Billing status</th>
              <th className="px-4 py-3">Billing email</th>
              <th className="px-4 py-3">Trial ends</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[var(--text-primary)]">
            {filteredTenants.map((tenant) => {
              const billing = tenant.tenant_billing?.[0]
              const domain = tenant.primary_domain || tenant.tenant_domains?.find((d) => d.is_primary)?.domain || ''
              const draft = drafts[tenant.id] ?? getDefaultDraft(tenant)
              const isSaving = Boolean(savingIds[tenant.id])
              const base = getDefaultDraft(tenant)
              const hasChanges =
                draft.status !== base.status ||
                draft.plan !== base.plan ||
                draft.billingStatus !== base.billingStatus ||
                draft.billingEmail !== base.billingEmail

              return (
                <tr key={tenant.id} className="border-b border-[var(--border-primary)] last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{tenant.id}</div>
                  </td>
                  <td className="px-4 py-3">{tenant.slug}</td>
                  <td className="px-4 py-3">{domain || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={draft.status}
                      onChange={(e) => updateDraft(tenant, { status: e.target.value })}
                    >
                      {TENANT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={draft.plan}
                      onChange={(e) => updateDraft(tenant, { plan: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={draft.billingStatus}
                      onChange={(e) => updateDraft(tenant, { billingStatus: e.target.value })}
                    >
                      {BILLING_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                      value={draft.billingEmail}
                      onChange={(e) => updateDraft(tenant, { billingEmail: e.target.value })}
                      placeholder={billing?.billing_email || 'email@example.com'}
                      type="email"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {billing?.trial_ends_at ? new Date(billing.trial_ends_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <button
                        className="rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        onClick={() => {
                          const url = getTenantUrl(tenant)
                          if (!url) {
                            setRowErrors((prev) => ({ ...prev, [tenant.id]: 'No tenant URL available' }))
                            return
                          }
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        Visit site
                      </button>
                      {billing?.stripe_customer_id && (
                        <button
                          className="rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                          onClick={() => openBillingPortal(tenant.id)}
                        >
                          Billing portal
                        </button>
                      )}
                      <button
                        className="rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                        onClick={() => {
                          setSelectedTenantId(tenant.id)
                          setInviteEmail(billing?.billing_email || '')
                          setShowInviteModal(true)
                        }}
                      >
                        Send invite
                      </button>
                      <button
                        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-[var(--accent-hover)]"
                        onClick={() => saveTenant(tenant)}
                        disabled={isSaving || !hasChanges}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    {rowErrors[tenant.id] && (
                      <p className="mt-2 text-xs text-[var(--error)]">{rowErrors[tenant.id]}</p>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Send invite</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Invite a user to become the owner of this tenant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setSelectedTenantId(null)
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Email address
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-2 text-sm text-[var(--text-primary)]"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="owner@example.com"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-[var(--border-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setSelectedTenantId(null)
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--accent-hover)]"
                onClick={sendInvite}
                disabled={!inviteEmail.trim() || !!invitingId}
              >
                {invitingId ? 'Sending...' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
