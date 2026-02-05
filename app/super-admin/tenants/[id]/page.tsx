import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TenantActions } from "./TenantActions";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Detail Page
   View and manage a specific tenant
   ═══════════════════════════════════════════════════════════════════════════ */

type TenantDetail = {
  id: string;
  name: string;
  slug: string;
  status: string;
  primary_domain: string | null;
  created_at: string;
  updated_at: string;
  settings: {
    branding?: {
      logo_url?: string;
      primary_color?: string;
      secondary_color?: string;
    };
    features?: {
      ai_inventory?: boolean;
      ai_chat?: boolean;
      ai_analytics?: boolean;
    };
  } | null;
  billing: {
    plan: string;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_end: string | null;
    plan_limits: {
      ai_calls_per_month?: number;
      storage_gb?: number;
      team_members?: number;
    } | null;
  } | null;
  domains: {
    id: string;
    domain: string;
    verified_at: string | null;
    created_at: string;
  }[];
  usage: {
    period_start: string;
    ai_api_calls: number;
    storage_bytes: number;
    messages_sent: number;
  }[];
};

type TenantUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
};

async function getTenant(id: string): Promise<TenantDetail | null> {
  const supabase = await createSupabaseServer();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select(
      `
      id,
      name,
      slug,
      status,
      primary_domain,
      created_at,
      updated_at,
      settings,
      billing:tenant_billing(
        plan,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_end,
        plan_limits
      ),
      domains:tenant_domains(
        id,
        domain,
        verified_at,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !tenant) return null;

  // Get usage data
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from("tenant_usage")
    .select("period_start, ai_api_calls, storage_bytes, messages_sent")
    .eq("tenant_id", id)
    .gte("period_start", startOfMonth.toISOString().split("T")[0])
    .order("period_start", { ascending: false });

  return {
    ...tenant,
    billing: Array.isArray(tenant.billing)
      ? tenant.billing[0] || null
      : tenant.billing,
    domains: tenant.domains || [],
    usage: usage || [],
  };
}

async function getTenantUsers(tenantId: string): Promise<TenantUser[]> {
  const supabase = await createSupabaseServer();

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at, last_sign_in_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  return data || [];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenant, users] = await Promise.all([
    getTenant(id),
    getTenantUsers(id),
  ]);

  if (!tenant) {
    notFound();
  }

  const currentUsage = tenant.usage[0] || {
    ai_api_calls: 0,
    storage_bytes: 0,
    messages_sent: 0,
  };

  const limits = tenant.billing?.plan_limits || {
    ai_calls_per_month: 1000,
    storage_gb: 5,
    team_members: 3,
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link
          href="/super-admin/tenants"
          className="hover:text-[var(--text-primary)]"
        >
          Tenants
        </Link>
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
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <span className="text-[var(--text-primary)]">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
            <span className="text-2xl font-bold text-[var(--text-secondary)]">
              {tenant.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {tenant.name}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {tenant.slug}.openpeople.ai
              {tenant.primary_domain && ` · ${tenant.primary_domain}`}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={tenant.status} />
              <span className="text-sm text-[var(--text-secondary)] capitalize">
                {tenant.billing?.plan || "free"} plan
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={
              tenant.primary_domain
                ? `https://${tenant.primary_domain}`
                : `https://${tenant.slug}.openpeople.ai`
            }
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
            Visit site
          </a>
          <Link
            href={`/super-admin/tenants/${tenant.id}/edit`}
            className="btn-primary text-sm"
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
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
              />
            </svg>
            Edit tenant
          </Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Usage Stats */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Current Usage
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <UsageCard
                label="AI API Calls"
                current={currentUsage.ai_api_calls}
                limit={limits.ai_calls_per_month || 1000}
                unit="calls"
              />
              <UsageCard
                label="Storage"
                current={currentUsage.storage_bytes}
                limit={(limits.storage_gb || 5) * 1024 * 1024 * 1024}
                unit="bytes"
                formatValue={formatBytes}
              />
              <UsageCard
                label="Team Members"
                current={users.length}
                limit={limits.team_members || 3}
                unit="users"
              />
            </div>
          </div>

          {/* Users */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Team Members ({users.length})
              </h2>
            </div>
            {users.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                No users in this tenant
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                          {(user.full_name || user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {user.full_name || "Unnamed User"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[var(--text-secondary)] capitalize px-2 py-1 rounded bg-[var(--surface-3)]">
                        {user.role}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        Last seen: {formatDateTime(user.last_sign_in_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Domains */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Custom Domains ({tenant.domains.length})
              </h2>
            </div>
            {tenant.domains.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                No custom domains configured
              </p>
            ) : (
              <div className="space-y-3">
                {tenant.domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-[var(--text-muted)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                        />
                      </svg>
                      <span className="text-sm text-[var(--text-primary)]">
                        {domain.domain}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {domain.verified_at ? (
                        <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[var(--warning)]">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Pending
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">
                        Added {formatDate(domain.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Sidebar info */}
        <div className="space-y-6">
          {/* Billing Info */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Billing
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Plan</p>
                <p className="text-sm text-[var(--text-primary)] capitalize font-medium">
                  {tenant.billing?.plan || "Free"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">
                  Billing Status
                </p>
                <p className="text-sm text-[var(--text-primary)] capitalize">
                  {tenant.billing?.status || "N/A"}
                </p>
              </div>
              {tenant.billing?.current_period_end && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    Next Billing Date
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {formatDate(tenant.billing.current_period_end)}
                  </p>
                </div>
              )}
              {tenant.billing?.stripe_customer_id && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    Stripe Customer
                  </p>
                  <a
                    href={`https://dashboard.stripe.com/customers/${tenant.billing.stripe_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--electric-lime)] hover:underline"
                  >
                    {tenant.billing.stripe_customer_id}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Feature Flags */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              AI Features
            </h2>
            <div className="space-y-3">
              {[
                {
                  key: "ai_inventory",
                  label: "AI Inventory",
                  enabled: tenant.settings?.features?.ai_inventory ?? false,
                },
                {
                  key: "ai_chat",
                  label: "AI Chat",
                  enabled: tenant.settings?.features?.ai_chat ?? false,
                },
                {
                  key: "ai_analytics",
                  label: "AI Analytics",
                  enabled: tenant.settings?.features?.ai_analytics ?? false,
                },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-[var(--text-secondary)]">
                    {feature.label}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      feature.enabled
                        ? "bg-[var(--success)]/10 text-[var(--success)]"
                        : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                    }`}
                  >
                    {feature.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Metadata
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">
                  Tenant ID
                </p>
                <p className="text-xs text-[var(--text-secondary)] font-mono bg-[var(--surface-2)] px-2 py-1 rounded">
                  {tenant.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Created</p>
                <p className="text-sm text-[var(--text-primary)]">
                  {formatDateTime(tenant.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">
                  Last Updated
                </p>
                <p className="text-sm text-[var(--text-primary)]">
                  {formatDateTime(tenant.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <TenantActions tenantId={tenant.id} tenantName={tenant.name} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    active: "bg-[var(--success)]/10 text-[var(--success)]",
    trialing: "bg-[var(--warning)]/10 text-[var(--warning)]",
    suspended: "bg-[var(--error)]/10 text-[var(--error)]",
    inactive: "bg-[var(--text-muted)]/10 text-[var(--text-muted)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[status as keyof typeof styles] || styles.inactive
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "active"
            ? "bg-[var(--success)]"
            : status === "trialing"
            ? "bg-[var(--warning)]"
            : status === "suspended"
            ? "bg-[var(--error)]"
            : "bg-[var(--text-muted)]"
        }`}
      />
      {status}
    </span>
  );
}

function UsageCard({
  label,
  current,
  limit,
  unit,
  formatValue,
}: {
  label: string;
  current: number;
  limit: number;
  unit: string;
  formatValue?: (value: number) => string;
}) {
  const percentage = Math.min((current / limit) * 100, 100);
  const format = formatValue || ((v: number) => v.toLocaleString());

  return (
    <div className="p-4 rounded-lg bg-[var(--surface-2)]">
      <p className="text-xs text-[var(--text-muted)] mb-2">{label}</p>
      <p className="text-lg font-semibold text-[var(--text-primary)]">
        {format(current)}
      </p>
      <p className="text-xs text-[var(--text-muted)] mt-1">
        of {format(limit)} {unit !== "bytes" ? unit : ""}
      </p>
      <div className="mt-3 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage > 90
              ? "bg-[var(--error)]"
              : percentage > 70
              ? "bg-[var(--warning)]"
              : "bg-[var(--electric-lime)]"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
