"use client";

import { useState, useEffect } from "react";
import { Card, Button, LoadingSpinner, LoadingSkeleton } from "@/lib/ui";

/* ═══════════════════════════════════════════════════════════════════════════
   Platform Analytics Dashboard

   Comprehensive analytics dashboard showing platform metrics,
   tenant usage, performance trends, and business insights.
   ═══════════════════════════════════════════════════════════════════════════ */

interface AnalyticsMetrics {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    mrr: number;
    arr: number;
    growthRate: number;
  };
  usage: {
    totalAiCalls: number;
    totalStorage: number;
    totalEmails: number;
    totalMessages: number;
  };
  trends: {
    signupsLast30Days: number;
    revenueGrowth: number;
    userGrowth: number;
    featureAdoption: Record<string, number>;
  };
  topPerformers: {
    tenantsByRevenue: Array<{
      id: string;
      name: string;
      revenue: number;
      plan: string;
    }>;
    tenantsByUsage: Array<{
      id: string;
      name: string;
      aiCalls: number;
      storage: number;
    }>;
    featuresByUsage: Array<{
      feature: string;
      enabledCount: number;
      adoptionRate: number;
    }>;
  };
}

interface PlatformAnalyticsProps {
  className?: string;
}

export function PlatformAnalytics({ className = '' }: PlatformAnalyticsProps) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/analytics?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Platform Analytics
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Loading analytics data...
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="p-6">
              <LoadingSkeleton className="h-4 mb-2" />
              <LoadingSkeleton className="h-8 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">Failed to load analytics data</p>
          <Button onClick={loadAnalytics} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Platform Analytics
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Comprehensive platform metrics and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing && <LoadingSpinner size="sm" className="mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tenants"
          value={formatNumber(metrics.overview.totalTenants)}
          subtitle={`${metrics.overview.activeTenants} active`}
          trend={metrics.trends.userGrowth}
          icon="🏢"
        />

        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.overview.mrr)}
          subtitle={`ARR: ${formatCurrency(metrics.overview.arr)}`}
          trend={metrics.trends.revenueGrowth}
          icon="💰"
        />

        <MetricCard
          title="Total Users"
          value={formatNumber(metrics.overview.totalUsers)}
          subtitle={`${formatNumber(metrics.trends.signupsLast30Days)} new this month`}
          trend={metrics.trends.userGrowth}
          icon="👥"
        />

        <MetricCard
          title="AI Usage"
          value={formatNumber(metrics.usage.totalAiCalls)}
          subtitle={`${formatBytes(metrics.usage.totalStorage)} storage`}
          icon="🤖"
        />
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Adoption */}
        <Card>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            Feature Adoption
          </h3>

          <div className="space-y-3">
            {metrics.topPerformers.featuresByUsage.map((feature, index) => (
              <div key={feature.feature} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-[var(--electric-lime)]/10 flex items-center justify-center text-xs font-medium text-[var(--electric-lime)]">
                    {index + 1}
                  </span>
                  <span className="text-sm text-[var(--text-primary)] capitalize">
                    {feature.feature.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-muted)]">
                    {formatNumber(feature.enabledCount)} tenants
                  </span>
                  <span className="text-sm font-medium text-[var(--electric-lime)]">
                    {formatPercentage(feature.adoptionRate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performing Tenants */}
        <Card>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            Top Performing Tenants
          </h3>

          <div className="space-y-3">
            {metrics.topPerformers.tenantsByRevenue.slice(0, 5).map((tenant, index) => (
              <div key={tenant.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-[var(--electric-lime)]/10 flex items-center justify-center text-xs font-medium text-[var(--electric-lime)]">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {tenant.name}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] capitalize">
                      {tenant.plan} plan
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {formatCurrency(tenant.revenue)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    MRR
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Growth Trends */}
      <Card>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Growth Trends ({selectedPeriod})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--electric-lime)] mb-1">
              {formatPercentage(metrics.trends.revenueGrowth)}
            </div>
            <div className="text-sm text-[var(--text-muted)]">Revenue Growth</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--electric-cyan)] mb-1">
              {formatPercentage(metrics.trends.userGrowth)}
            </div>
            <div className="text-sm text-[var(--text-muted)]">User Growth</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--electric-violet)] mb-1">
              +{formatNumber(metrics.trends.signupsLast30Days)}
            </div>
            <div className="text-sm text-[var(--text-muted)]">New Signups</div>
          </div>
        </div>
      </Card>

      {/* Usage by Tenant */}
      <Card>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Top Tenants by Usage
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Tenant
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  AI Calls
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Storage
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-secondary)]">
                  Emails
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.topPerformers.tenantsByUsage.slice(0, 10).map((tenant) => (
                <tr key={tenant.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-2)]">
                  <td className="py-3 px-4">
                    <div className="font-medium text-[var(--text-primary)]">
                      {tenant.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-[var(--text-primary)]">
                      {formatNumber(tenant.aiCalls)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-[var(--text-primary)]">
                      {formatBytes(tenant.storage)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-[var(--text-primary)]">
                      {formatNumber(metrics.usage.totalEmails / metrics.overview.totalTenants)} {/* Placeholder */}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Export Actions */}
      <Card>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Export & Reporting
        </h3>

        <div className="flex gap-3">
          <Button variant="outline">
            Export CSV
          </Button>
          <Button variant="outline">
            Generate Report
          </Button>
          <Button variant="outline">
            Schedule Digest
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Metric Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: string;
}

function MetricCard({ title, value, subtitle, trend, icon }: MetricCardProps) {
  const getTrendColor = (trend?: number) => {
    if (!trend) return 'text-[var(--text-muted)]';
    return trend > 0 ? 'text-[var(--success)]' : 'text-[var(--error)]';
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return '→';
    return trend > 0 ? '↑' : '↓';
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <p className={`text-xs font-medium ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)} {Math.abs(trend * 100).toFixed(1)}%
            </p>
          )}
        </div>

        <div className="text-2xl">{icon}</div>
      </div>
    </Card>
  );
}