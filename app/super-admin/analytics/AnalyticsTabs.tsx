"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EMAIL_PLANS, formatEmailCount } from "@/types/email";
import { EXPERIMENT_PLANS, formatEventCount } from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Analytics Tabs
   Client component to switch between Platform, Email, Storage, Notifications, and Experiments analytics
   ═══════════════════════════════════════════════════════════════════════════ */

type PlatformData = {
  overviewCards: {
    label: string;
    value: string;
    subtext: string;
    icon: string;
    color: string;
  }[];
  recentSignups: { date: string; count: number }[];
  maxSignups: number;
  tenantsByPlan: { plan: string; count: number }[];
  tenantsByStatus: { status: string; count: number }[];
  topTenantsByUsage: {
    id: string;
    name: string;
    ai_calls: number;
    storage: number;
    ai_calls_formatted: string;
    storage_formatted: string;
  }[];
};

type EmailData = {
  overviewCards: {
    label: string;
    value: string;
    subtext: string;
    icon: string;
    color: string;
  }[];
  subscriptionsByTier: { tier: string; count: number }[];
  topTenantsByEmails: {
    id: string;
    name: string;
    emails_sent: number;
    tier: string;
  }[];
  recentSubscriptions: {
    id: string;
    tenant_name: string;
    tier: string;
    status: string;
    created_at: string;
  }[];
  deliveryRate: number;
  totalTemplates: number;
  totalDomains: number;
};

type StorageData = {
  overviewCards: {
    label: string;
    value: string;
    subtext: string;
    icon: string;
    color: string;
  }[];
  subscriptionsByTier: { tier: string; count: number }[];
  topTenantsByStorage: {
    id: string;
    name: string;
    storage: number;
    files: number;
    tier: string;
    storage_formatted: string;
  }[];
  recentSubscriptions: {
    id: string;
    tenant_name: string;
    tier: string;
    status: string;
    created_at: string;
  }[];
  plans: {
    tier: string;
    name: string;
    price: number;
    storageLimitFormatted: string;
    bandwidthLimitFormatted: string;
    maxFileSizeFormatted: string;
    subscriberCount: number;
  }[];
};

type NotificationData = {
  overviewCards: {
    label: string;
    value: string;
    subtext: string;
    icon: string;
    color: string;
  }[];
  subscriptionsByTier: { tier: string; count: number }[];
  topTenantsByNotifications: {
    id: string;
    name: string;
    notifications: number;
    tier: string;
    notifications_formatted: string;
  }[];
  recentSubscriptions: {
    id: string;
    tenant_name: string;
    tier: string;
    status: string;
    created_at: string;
  }[];
  smsDeliveryRate: number;
  inAppReadRate: number;
  totalTemplates: number;
  totalPushSent: number;
  plans: {
    tier: string;
    name: string;
    price: number;
    smsFormatted: string;
    inAppFormatted: string;
    pushFormatted: string;
    templates: number;
    subscriberCount: number;
  }[];
};

type ExperimentsData = {
  overviewCards: {
    label: string;
    value: string;
    subtext: string;
    icon: string;
    color: string;
  }[];
  subscriptionsByTier: { tier: string; count: number }[];
  topTenantsByEvents: {
    id: string;
    name: string;
    events: number;
    tier: string;
    events_formatted: string;
  }[];
  recentSubscriptions: {
    id: string;
    tenant_name: string;
    tier: string;
    status: string;
    created_at: string;
  }[];
  totalExperimentsCount: number;
  totalFlagsCount: number;
  plans: {
    tier: string;
    name: string;
    price: number;
    activeExperiments: number;
    featureFlags: number;
    eventsPerDay: number;
    subscriberCount: number;
  }[];
};

type Props = {
  platformData: PlatformData;
  emailData: EmailData;
  storageData: StorageData;
  notificationData: NotificationData;
  experimentsData: ExperimentsData;
};

export function AnalyticsTabs({ platformData, emailData, storageData, notificationData, experimentsData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs = useMemo(() => ["platform", "email", "storage", "notifications", "experiments"] as const, []);
  type Tab = (typeof tabs)[number];

  const normalizeTab = (raw: string | null): Tab | null => {
    if (!raw) return null;
    const v = raw.toLowerCase();
    if ((tabs as readonly string[]).includes(v)) return v as Tab;
    return null;
  };

  const [activeTab, setActiveTab] = useState<Tab>("platform");

  // Allow deep links like /super-admin/analytics?tab=notifications
  useEffect(() => {
    const urlTab = normalizeTab(searchParams.get("tab"));
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setTab = (tab: Tab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams.toString());
    if (tab === "platform") next.delete("tab");
    else next.set("tab", tab);
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "/super-admin/analytics", { scroll: false });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)]">
            Analytics
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Platform-wide metrics and insights
          </p>
        </div>
        
        {/* Tabs - horizontal scroll on mobile */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)] overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setTab("platform")}
            className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "platform"
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Platform
          </button>
          <button
            onClick={() => setTab("email")}
            className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "email"
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setTab("storage")}
            className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "storage"
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Storage
          </button>
          <button
            onClick={() => setTab("notifications")}
            className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "notifications"
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setTab("experiments")}
            className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === "experiments"
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Experiments
          </button>
        </div>
      </div>

      {activeTab === "platform" ? (
        <PlatformView data={platformData} formatDate={formatDate} />
      ) : activeTab === "email" ? (
        <EmailView data={emailData} />
      ) : activeTab === "storage" ? (
        <StorageView data={storageData} />
      ) : activeTab === "notifications" ? (
        <NotificationsView data={notificationData} />
      ) : (
        <ExperimentsView data={experimentsData} />
      )}
    </div>
  );
}

function PlatformView({ data, formatDate }: { data: PlatformData; formatDate: (s: string) => string }) {
  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {data.overviewCards.map((card) => (
          <div
            key={card.label}
            className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-[var(--text-muted)] truncate">{card.label}</p>
                <p className="text-xl md:text-3xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
                  {card.value}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2 truncate">
                  {card.subtext}
                </p>
              </div>
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Signups Chart */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            New Signups (Last 7 Days)
          </h2>
          <div className="flex items-end gap-1 md:gap-2 h-32 md:h-40">
            {data.recentSignups.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 md:gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-[10px] md:text-xs text-[var(--text-muted)] mb-1">
                    {day.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-[var(--electric-lime)] transition-all"
                    style={{
                      height: `${Math.max((day.count / data.maxSignups) * 100, 4)}px`,
                      minHeight: "4px",
                    }}
                  />
                </div>
                <span className="text-[10px] md:text-xs text-[var(--text-muted)]">
                  {formatDate(day.date).split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            Tenant Distribution
          </h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-3">By Plan</p>
              <div className="space-y-2">
                {data.tenantsByPlan.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No data</p>
                ) : (
                  data.tenantsByPlan.map((item) => (
                    <div key={item.plan} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)] capitalize">
                        {item.plan}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-3">By Status</p>
              <div className="space-y-2">
                {data.tenantsByStatus.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No data</p>
                ) : (
                  data.tenantsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)] capitalize">
                        {item.status}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tenants */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
          Top Tenants by AI Usage
        </h2>
        {data.topTenantsByUsage.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">
            No usage data yet
          </p>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {data.topTenantsByUsage.map((tenant, index) => (
              <div
                key={tenant.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 md:p-4 rounded-lg bg-[var(--surface-2)]"
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)] shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {tenant.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 md:gap-8 pl-9 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {tenant.ai_calls_formatted}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">AI calls</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {tenant.storage_formatted}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Storage</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmailView({ data }: { data: EmailData }) {
  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {data.overviewCards.map((card) => (
          <div
            key={card.label}
            className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-[var(--text-muted)] truncate">{card.label}</p>
                <p className="text-lg md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
                  {card.value}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2 truncate">
                  {card.subtext}
                </p>
              </div>
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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

      {/* Email Plans - horizontal scroll on mobile */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
          Email Plans
        </h2>
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {Object.values(EMAIL_PLANS).map((plan) => {
            const subscriberCount =
              data.subscriptionsByTier.find((s) => s.tier === plan.tier)?.count || 0;
            return (
              <div
                key={plan.tier}
                className="p-3 md:p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] w-48 md:w-auto shrink-0 md:shrink"
              >
                <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {plan.name}
                  </span>
                  <span className="text-xs md:text-sm text-[var(--electric-lime)] whitespace-nowrap">
                    {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[var(--text-muted)]">
                  <p>Emails: {formatEmailCount(plan.emailsPerMonth)}/mo</p>
                  <p>Domains: {plan.customDomains}</p>
                  <p>Templates: {plan.templates === -1 ? "Unlimited" : plan.templates}</p>
                </div>
                <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">Total Templates</p>
          <p className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
            {data.totalTemplates}
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Across all tenants</p>
        </div>
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">Custom Domains</p>
          <p className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
            {data.totalDomains}
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Configured</p>
        </div>
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">Delivery Rate</p>
          <p
            className="text-xl md:text-2xl font-semibold mt-1 md:mt-2"
            style={{
              color: data.deliveryRate >= 95 ? "var(--success)" : "var(--warning)",
            }}
          >
            {data.deliveryRate}%
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Platform average</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Tenants by Emails */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Top Tenants by Emails
          </h2>
          {data.topTenantsByEmails.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No email activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.topTenantsByEmails.map((tenant, index) => (
                <Link
                  key={tenant.id}
                  href={`/super-admin/tenants/${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {tenant.tier} plan
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formatEmailCount(tenant.emails_sent)} sent
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Email Subscriptions
          </h2>
          {data.recentSubscriptions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No subscriptions yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {sub.tenant_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-3)] text-[var(--text-secondary)] capitalize">
                      {sub.tier}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sub.status === "active"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : sub.status === "trialing"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StorageView({ data }: { data: StorageData }) {
  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {data.overviewCards.map((card) => (
          <div
            key={card.label}
            className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-[var(--text-muted)] truncate">{card.label}</p>
                <p className="text-lg md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
                  {card.value}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2 truncate">
                  {card.subtext}
                </p>
              </div>
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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

      {/* Storage Plans - horizontal scroll on mobile */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
          Storage Plans
        </h2>
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {data.plans.map((plan) => (
            <div
              key={plan.tier}
              className="p-3 md:p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] w-48 md:w-auto shrink-0 md:shrink"
            >
              <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {plan.name}
                </span>
                <span className="text-xs md:text-sm text-[var(--electric-lime)] whitespace-nowrap">
                  {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[var(--text-muted)]">
                <p>Storage: {plan.storageLimitFormatted}</p>
                <p>Bandwidth: {plan.bandwidthLimitFormatted}/mo</p>
                <p>Max file: {plan.maxFileSizeFormatted}</p>
              </div>
              <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-secondary)]">
                  {plan.subscriberCount} subscriber{plan.subscriberCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Tenants by Storage */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            Top Tenants by Storage
          </h2>
          {data.topTenantsByStorage.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No storage usage yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.topTenantsByStorage.map((tenant, index) => (
                <Link
                  key={tenant.id}
                  href={`/super-admin/tenants/${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {tenant.files} files
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-3)] text-[var(--text-muted)] capitalize">
                      {tenant.tier}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {tenant.storage_formatted}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Storage Subscriptions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            Recent Storage Subscriptions
          </h2>
          {data.recentSubscriptions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No subscriptions yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {sub.tenant_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-3)] text-[var(--text-secondary)] capitalize">
                      {sub.tier}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sub.status === "active"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : sub.status === "trialing"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* R2 Configuration Info */}
      <div className="mt-4 md:mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-3 md:mb-4">
          Cloudflare R2 Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Bucket</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              openpeople-storage
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Region</p>
            <p className="text-sm text-[var(--text-primary)]">Auto (Global)</p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Pricing</p>
            <p className="text-sm text-[var(--text-primary)]">
              $0.015/GB storage · $0 egress
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function NotificationsView({ data }: { data: NotificationData }) {
  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {data.overviewCards.map((card) => (
          <div
            key={card.label}
            className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-[var(--text-muted)] truncate">{card.label}</p>
                <p className="text-lg md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
                  {card.value}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2 truncate">
                  {card.subtext}
                </p>
              </div>
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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

      {/* Notification Plans - horizontal scroll on mobile */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
          Notification Plans
        </h2>
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {data.plans.map((plan) => (
            <div
              key={plan.tier}
              className="p-3 md:p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] w-48 md:w-auto shrink-0 md:shrink"
            >
              <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {plan.name}
                </span>
                <span className="text-xs md:text-sm text-[var(--electric-lime)] whitespace-nowrap">
                  {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[var(--text-muted)]">
                <p>SMS: {plan.smsFormatted}/mo</p>
                <p>In-App: {plan.inAppFormatted}/mo</p>
                <p>Push: {plan.pushFormatted}/mo</p>
                <p>Templates: {plan.templates === -1 ? "Unlimited" : plan.templates}</p>
              </div>
              <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-secondary)]">
                  {plan.subscriberCount} subscriber{plan.subscriberCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">Total Templates</p>
          <p className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
            {data.totalTemplates}
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Across all tenants</p>
        </div>
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">SMS Delivery Rate</p>
          <p
            className="text-xl md:text-2xl font-semibold mt-1 md:mt-2"
            style={{
              color: data.smsDeliveryRate >= 95 ? "var(--success)" : "var(--warning)",
            }}
          >
            {data.smsDeliveryRate}%
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Platform average</p>
        </div>
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">In-App Read Rate</p>
          <p className="text-xl md:text-2xl font-semibold text-[var(--electric-cyan)] mt-1 md:mt-2">
            {data.inAppReadRate}%
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Platform average</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Tenants by Notifications */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            Top Tenants by Notifications
          </h2>
          {data.topTenantsByNotifications.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No notification activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.topTenantsByNotifications.map((tenant, index) => (
                <Link
                  key={tenant.id}
                  href={`/super-admin/tenants/${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {tenant.tier} plan
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {tenant.notifications_formatted} sent
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            Recent Notification Subscriptions
          </h2>
          {data.recentSubscriptions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No subscriptions yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {sub.tenant_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-3)] text-[var(--text-secondary)] capitalize">
                      {sub.tier}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sub.status === "active"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : sub.status === "trialing"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Twilio Configuration Info */}
      <div className="mt-4 md:mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-3 md:mb-4">
          Twilio Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Webhook Endpoint</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              /api/notifications/webhooks?provider=twilio
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Channels</p>
            <p className="text-sm text-[var(--text-primary)]">
              SMS, In-App, Push (coming soon)
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">API Status</p>
            <p className="text-sm text-[var(--success)]">Connected</p>
          </div>
        </div>
      </div>
    </>
  );
}

function ExperimentsView({ data }: { data: ExperimentsData }) {
  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {data.overviewCards.map((card) => (
          <div
            key={card.label}
            className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-[var(--text-muted)] truncate">{card.label}</p>
                <p className="text-lg md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
                  {card.value}
                </p>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2 truncate">
                  {card.subtext}
                </p>
              </div>
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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

      {/* Experiment Plans - horizontal scroll on mobile */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
          Experimentation Plans
        </h2>
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {data.plans.map((plan) => (
            <div
              key={plan.tier}
              className="p-3 md:p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] w-48 md:w-auto shrink-0 md:shrink"
            >
              <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {plan.name}
                </span>
                <span className="text-xs md:text-sm text-[var(--electric-lime)] whitespace-nowrap">
                  {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[var(--text-muted)]">
                <p>
                  Experiments: {plan.activeExperiments === -1 ? "∞" : plan.activeExperiments}
                </p>
                <p>
                  Flags: {plan.featureFlags === -1 ? "∞" : plan.featureFlags}
                </p>
                <p>
                  Events: {plan.eventsPerDay === -1 ? "∞" : formatEventCount(plan.eventsPerDay)}/day
                </p>
              </div>
              <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-secondary)]">
                  {plan.subscriberCount} subscriber{plan.subscriberCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">Total Experiments</p>
          <p className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
            {data.totalExperimentsCount}
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Across all tenants</p>
        </div>
        <div className="p-3 md:p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs md:text-sm text-[var(--text-muted)]">Total Feature Flags</p>
          <p className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mt-1 md:mt-2">
            {data.totalFlagsCount}
          </p>
          <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2">Across all tenants</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Tenants by Events */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            Top Tenants by Events
          </h2>
          {data.topTenantsByEvents.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No event activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.topTenantsByEvents.map((tenant, index) => (
                <Link
                  key={tenant.id}
                  href={`/super-admin/tenants/${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {tenant.tier} plan
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {tenant.events_formatted} events
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-4 md:mb-6">
            Recent Experiment Subscriptions
          </h2>
          {data.recentSubscriptions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No subscriptions yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {sub.tenant_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-3)] text-[var(--text-secondary)] capitalize">
                      {sub.tier}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sub.status === "active"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : sub.status === "trialing"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SDK Configuration Info */}
      <div className="mt-4 md:mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-3 md:mb-4">
          SDK Configuration
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Config Endpoint</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              /api/experiments/config
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Events Endpoint</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              /api/experiments/events
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">API Status</p>
            <p className="text-sm text-[var(--success)]">Active</p>
          </div>
        </div>
      </div>
    </>
  );
}
