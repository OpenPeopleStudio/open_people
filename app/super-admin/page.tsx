/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Dashboard
   Platform overview and quick stats
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SuperAdminDashboard() {
  // In production, these would come from the database
  const stats = [
    { label: "Total Tenants", value: "12", change: "+2 this month" },
    { label: "Active Users", value: "1,284", change: "+18% vs last month" },
    { label: "Monthly Revenue", value: "$24,892", change: "+12.5% vs last month" },
    { label: "AI API Calls", value: "142K", change: "This billing period" },
  ];

  const recentActivity = [
    { action: "New tenant created", tenant: "StreetHeat", time: "2 hours ago" },
    { action: "Plan upgraded to Pro", tenant: "SoleVault", time: "5 hours ago" },
    { action: "Custom domain verified", tenant: "KicksLab", time: "1 day ago" },
    { action: "New tenant created", tenant: "HypeStore", time: "2 days ago" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Platform overview and quick stats
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
            <p className="text-3xl font-semibold text-[var(--text-primary)] mt-2">
              {stat.value}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 pb-4 border-b border-[var(--border-subtle)] last:border-0 last:pb-0"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)] mt-2" />
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)]">
                    {activity.action}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {activity.tenant} · {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Create Tenant", href: "/super-admin/tenants/new" },
              { label: "View Analytics", href: "/super-admin/analytics" },
              { label: "Billing Overview", href: "/super-admin/billing" },
              { label: "System Settings", href: "/super-admin/settings" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--electric-lime)] transition-colors text-center"
              >
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { service: "Database", status: "Operational", color: "var(--success)" },
            { service: "AI Services", status: "Operational", color: "var(--success)" },
            { service: "Payments", status: "Operational", color: "var(--success)" },
          ].map((service) => (
            <div
              key={service.service}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
            >
              <span className="text-sm text-[var(--text-secondary)]">
                {service.service}
              </span>
              <span
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: service.color }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: service.color }}
                />
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
