import { createSupabaseServer } from "@/lib/supabase/server";
import { BillingManagement } from "@/components/super-admin/BillingManagement";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Billing Overview
   Revenue metrics and billing management
   ═══════════════════════════════════════════════════════════════════════════ */

type BillingMetrics = {
  mrr: number;
  arr: number;
  totalCustomers: number;
  activeSubscriptions: number;
  trialingCount: number;
  churnedCount: number;
  revenueByPlan: { plan: string; revenue: number; count: number }[];
  recentTransactions: {
    id: string;
    tenant: string;
    amount: number;
    status: string;
    date: string;
  }[];
};

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 99,
  pro: 199,
  enterprise: 499,
};

async function getBillingMetrics(): Promise<BillingMetrics> {
  const supabase = await createSupabaseServer();

  // Get all billing records with tenant info
  const { data: billingRecords } = await supabase
    .from("tenant_billing")
    .select(
      `
      plan,
      status,
      tenant:tenants(id, name, status)
    `
    );

  const records = (billingRecords || []).map((r) => ({
    ...r,
    tenant: Array.isArray(r.tenant) ? r.tenant[0] : r.tenant,
  }));

  // Calculate MRR
  let mrr = 0;
  const revenueByPlan: Record<string, { revenue: number; count: number }> = {};

  records.forEach((record) => {
    if (record.status === "active" || record.status === "trialing") {
      const price = PLAN_PRICES[record.plan] || 0;
      mrr += price;

      if (!revenueByPlan[record.plan]) {
        revenueByPlan[record.plan] = { revenue: 0, count: 0 };
      }
      revenueByPlan[record.plan].revenue += price;
      revenueByPlan[record.plan].count += 1;
    }
  });

  // Count by status
  const activeSubscriptions = records.filter(
    (r) => r.status === "active"
  ).length;
  const trialingCount = records.filter((r) => r.status === "trialing").length;
  const churnedCount = records.filter(
    (r) => r.status === "canceled" || r.status === "churned"
  ).length;

  // Mock recent transactions (in production, this would come from Stripe)
  const recentTransactions = records
    .filter((r) => r.tenant && r.status === "active")
    .slice(0, 5)
    .map((r, i) => ({
      id: `txn_${i}`,
      tenant: r.tenant?.name || "Unknown",
      amount: PLAN_PRICES[r.plan] || 0,
      status: "succeeded",
      date: new Date(Date.now() - i * 86400000).toISOString(),
    }));

  return {
    mrr,
    arr: mrr * 12,
    totalCustomers: records.length,
    activeSubscriptions,
    trialingCount,
    churnedCount,
    revenueByPlan: Object.entries(revenueByPlan).map(([plan, data]) => ({
      plan,
      ...data,
    })),
    recentTransactions,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BillingPage() {
  const metrics = await getBillingMetrics();

  const overviewCards = [
    {
      label: "Monthly Recurring Revenue",
      value: formatCurrency(metrics.mrr),
      subtext: "Current MRR",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--success)",
    },
    {
      label: "Annual Run Rate",
      value: formatCurrency(metrics.arr),
      subtext: "Projected ARR",
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      color: "var(--electric-lime)",
    },
    {
      label: "Active Subscriptions",
      value: metrics.activeSubscriptions.toString(),
      subtext: `${metrics.trialingCount} trialing`,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--electric-cyan)",
    },
    {
      label: "Total Customers",
      value: metrics.totalCustomers.toString(),
      subtext: `${metrics.churnedCount} churned`,
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      color: "var(--electric-violet)",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Billing
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Revenue metrics and subscription management
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm"
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
          Open Stripe Dashboard
        </a>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
                <p className="text-3xl font-semibold text-[var(--text-primary)] mt-2">
                  {card.value}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  {card.subtext}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  style={{ color: card.color }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={card.icon}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Revenue by Plan
          </h2>
          {metrics.revenueByPlan.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No revenue data yet
            </p>
          ) : (
            <div className="space-y-4">
              {metrics.revenueByPlan.map((item) => {
                const percentage =
                  metrics.mrr > 0 ? (item.revenue / metrics.mrr) * 100 : 0;
                return (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
                          {item.plan}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          ({item.count} customers)
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatCurrency(item.revenue)}/mo
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--electric-lime)] rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan pricing reference */}
          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Plan Pricing
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PLAN_PRICES).map(([plan, price]) => (
                <div
                  key={plan}
                  className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)]"
                >
                  <span className="text-xs text-[var(--text-secondary)] capitalize">
                    {plan}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {price === 0 ? "Free" : `$${price}/mo`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Transactions
          </h2>
          {metrics.recentTransactions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-[var(--success)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {txn.tenant}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatDate(txn.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[var(--success)]">
                      +{formatCurrency(txn.amount)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">
                      {txn.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <a
              href="https://dashboard.stripe.com/payments"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--electric-lime)] hover:underline"
            >
              View all transactions in Stripe →
            </a>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="mt-6">
        <BillingManagement onUpdate={() => window.location.reload()} />
      </div>

      {/* Additional Actions */}
      <div className="mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          External Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://dashboard.stripe.com/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--electric-cyan)]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--electric-cyan)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Stripe Subscriptions
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Manage in Stripe Dashboard
              </p>
            </div>
          </a>

          <a
            href="https://dashboard.stripe.com/invoices"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--electric-violet)]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--electric-violet)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                View Invoices
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Access all invoices
              </p>
            </div>
          </a>

          <a
            href="https://dashboard.stripe.com/customers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--electric-lime)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Stripe Customers
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Manage customer data
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
