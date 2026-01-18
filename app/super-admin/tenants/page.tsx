import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Tenants List
   Manage all tenants from the platform admin
   ═══════════════════════════════════════════════════════════════════════════ */

// Mock data - in production this would come from Supabase
const mockTenants = [
  {
    id: "1",
    name: "709exclusive",
    slug: "709exclusive",
    status: "active",
    plan: "pro",
    domain: "709exclusive.com",
    created_at: "2024-01-15",
  },
  {
    id: "2",
    name: "StreetHeat",
    slug: "streetheat",
    status: "active",
    plan: "starter",
    domain: null,
    created_at: "2024-02-20",
  },
  {
    id: "3",
    name: "SoleVault",
    slug: "solevault",
    status: "active",
    plan: "pro",
    domain: "solevault.co",
    created_at: "2024-03-10",
  },
  {
    id: "4",
    name: "KicksLab",
    slug: "kickslab",
    status: "trialing",
    plan: "pro",
    domain: null,
    created_at: "2024-04-01",
  },
];

export default function SuperAdminTenantsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Tenants
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage all tenant sites from the platform admin
          </p>
        </div>
        <Link
          href="/super-admin/tenants/new"
          className="btn-primary text-sm"
        >
          Create tenant
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search tenants..."
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        <select className="px-4 py-2.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
          <option>All statuses</option>
          <option>Active</option>
          <option>Trialing</option>
          <option>Suspended</option>
        </select>
        <select className="px-4 py-2.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]">
          <option>All plans</option>
          <option>Starter</option>
          <option>Pro</option>
          <option>Enterprise</option>
        </select>
      </div>

      {/* Tenants table */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Domain
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {mockTenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-[var(--surface-2)] transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {tenant.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {tenant.slug}.openpeople.ai
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      tenant.status === "active"
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : tenant.status === "trialing"
                        ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                        : "bg-[var(--error)]/10 text-[var(--error)]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        tenant.status === "active"
                          ? "bg-[var(--success)]"
                          : tenant.status === "trialing"
                          ? "bg-[var(--warning)]"
                          : "bg-[var(--error)]"
                      }`}
                    />
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[var(--text-secondary)] capitalize">
                    {tenant.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {tenant.domain || "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-[var(--text-muted)]">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`https://${tenant.slug}.openpeople.ai`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                      title="Visit site"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </a>
                    <Link
                      href={`/super-admin/tenants/${tenant.id}`}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                      title="Edit tenant"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
