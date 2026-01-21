"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SecurityAlert } from "@/lib/observability/alerting";

/* ═══════════════════════════════════════════════════════════════════════════
   Security Dashboard Page

   Displays security alerts, metrics, and monitoring information.
   ═══════════════════════════════════════════════════════════════════════════ */

interface SecurityMetrics {
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  recent_alerts: SecurityAlert[];
  failed_logins_24h: number;
  active_sessions: number;
  suspicious_ips: string[];
}

export default function SecurityDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityMetrics();
  }, []);

  async function loadSecurityMetrics() {
    try {
      setLoading(true);

      const response = await fetch('/api/super-admin/security/metrics');
      if (!response.ok) throw new Error('Failed to load security metrics');

      const data = await response.json();
      setMetrics(data.metrics);

    } catch (error) {
      console.error('Failed to load security metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'text-[var(--error)] bg-[var(--error)]/10';
      case 'high': return 'text-[var(--warning)] bg-[var(--warning)]/10';
      case 'medium': return 'text-[var(--warning)] bg-[var(--warning)]/10';
      default: return 'text-[var(--text-primary)] bg-[var(--surface-2)]';
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      default: return 'ℹ️';
    }
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/super-admin"
            className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Security Dashboard
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Monitor security alerts and system health
            </p>
          </div>
          <button
            onClick={loadSecurityMetrics}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] animate-pulse">
              <div className="h-4 bg-[var(--surface-2)] rounded mb-2"></div>
              <div className="h-8 bg-[var(--surface-2)] rounded"></div>
            </div>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Alerts"
            value={metrics.total_alerts}
            icon="🚨"
            trend="neutral"
          />
          <MetricCard
            title="Critical Alerts"
            value={metrics.critical_alerts}
            icon="🔴"
            trend="up"
          />
          <MetricCard
            title="Failed Logins (24h)"
            value={metrics.failed_logins_24h}
            icon="🔐"
            trend={metrics.failed_logins_24h > 10 ? "up" : "neutral"}
          />
          <MetricCard
            title="Active Sessions"
            value={metrics.active_sessions}
            icon="👥"
            trend="neutral"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Alerts */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Recent Security Alerts
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-[var(--surface-2)] rounded mb-2"></div>
                    <div className="h-3 bg-[var(--surface-2)] rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : metrics?.recent_alerts.length ? (
              <div className="space-y-4">
                {metrics.recent_alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
                    <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[var(--text-primary)] text-sm">
                          {alert.title}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">
                        {alert.description}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  No recent alerts
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  All security checks are passing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Security Actions
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <Link
              href="/super-admin/audit"
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="font-medium text-[var(--text-primary)] text-sm">
                  View Audit Logs
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Detailed security event history
                </div>
              </div>
            </Link>

            <button
              onClick={() => router.push('/super-admin/settings?tab=security')}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors w-full text-left"
            >
              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <div className="font-medium text-[var(--text-primary)] text-sm">
                  Security Settings
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Configure alerts and policies
                </div>
              </div>
            </button>

            <button
              onClick={() => window.open('/api/health', '_blank')}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors w-full text-left"
            >
              <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-[var(--text-primary)] text-sm">
                  System Health
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Check system status and metrics
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Suspicious IPs */}
      {metrics?.suspicious_ips.length ? (
        <div className="mt-8 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="p-6 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Suspicious IP Addresses
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              IPs with unusual activity patterns
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.suspicious_ips.map((ip, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--warning)]/5 border border-[var(--warning)]/20">
                  <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono text-sm text-[var(--text-primary)]">{ip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Metric Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          trend === 'up' ? 'bg-[var(--error)]/10 text-[var(--error)]' :
          trend === 'down' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
          'bg-[var(--surface-2)] text-[var(--text-muted)]'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      </div>

      <div>
        <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
        <p className="text-2xl font-semibold text-[var(--text-primary)]">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}