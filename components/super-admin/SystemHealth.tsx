"use client";

import { useState, useEffect } from "react";
import { Card, Button, StatusBadge, LoadingSpinner, LoadingSkeleton } from "@/lib/ui";

/* ═══════════════════════════════════════════════════════════════════════════
   System Health Monitoring Dashboard

   Comprehensive health monitoring showing system status, performance
   metrics, database health, API endpoints, and infrastructure monitoring.
   ═══════════════════════════════════════════════════════════════════════════ */

interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down' | 'degraded';
      response_time: number;
      connection_count: number;
      active_queries: number;
    };
    redis?: {
      status: 'up' | 'down' | 'degraded';
      response_time: number;
      memory_usage: number;
    };
    storage: {
      status: 'up' | 'down' | 'degraded';
      response_time: number;
      total_files: number;
      total_size: number;
    };
    email: {
      status: 'up' | 'down' | 'degraded';
      response_time: number;
      queue_size: number;
    };
  };
  performance: {
    memory_usage: number;
    cpu_usage: number;
    response_time_avg: number;
    error_rate: number;
    active_connections: number;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  recent_activity: Array<{
    timestamp: string;
    event: string;
    details: string;
    status: 'success' | 'error' | 'warning';
  }>;
}

interface SystemHealthProps {
  className?: string;
}

export function SystemHealth({ className = '' }: SystemHealthProps) {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthMetrics();
  }, []);

  const loadHealthMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadHealthMetrics();
    setRefreshing(false);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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

  const formatTime = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  const getStatusColor = (status: string): "info" | "error" | "success" | "pending" | "warning" => {
    switch (status) {
      case 'up':
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
      case 'unhealthy':
        return 'error';
      default:
        return 'info';
    }
  };

  const getAlertColor = (type: string): "info" | "error" | "success" | "pending" | "warning" => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              System Health
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Loading system status...
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
          <p className="text-[var(--text-muted)]">Failed to load system health data</p>
          <Button onClick={loadHealthMetrics} className="mt-4">
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
            System Health
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Real-time monitoring and system diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              metrics.status === 'healthy' ? 'bg-green-500' :
              metrics.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium capitalize">
              {metrics.status}
            </span>
          </div>

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

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="System Status"
          value={metrics.status === 'healthy' ? 'All Systems Operational' : metrics.status}
          status={getStatusColor(metrics.status)}
          icon="⚡"
        />

        <MetricCard
          title="Uptime"
          value={formatUptime(metrics.uptime)}
          subtitle="System uptime"
          icon="⏱️"
        />

        <MetricCard
          title="Response Time"
          value={formatTime(metrics.performance.response_time_avg)}
          subtitle="Average response time"
          icon="⚡"
        />

        <MetricCard
          title="Active Connections"
          value={metrics.performance.active_connections.toString()}
          subtitle="Current connections"
          icon="🔗"
        />
      </div>

      {/* Service Status */}
      <Card>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Service Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ServiceCard
            name="Database"
            status={metrics.services.database.status}
            metrics={[
              `Response: ${formatTime(metrics.services.database.response_time)}`,
              `Connections: ${metrics.services.database.connection_count}`,
              `Active Queries: ${metrics.services.database.active_queries}`,
            ]}
          />

          <ServiceCard
            name="Storage"
            status={metrics.services.storage.status}
            metrics={[
              `Response: ${formatTime(metrics.services.storage.response_time)}`,
              `Files: ${metrics.services.storage.total_files.toLocaleString()}`,
              `Size: ${formatBytes(metrics.services.storage.total_size)}`,
            ]}
          />

          <ServiceCard
            name="Email"
            status={metrics.services.email.status}
            metrics={[
              `Response: ${formatTime(metrics.services.email.response_time)}`,
              `Queue: ${metrics.services.email.queue_size}`,
            ]}
          />

          {metrics.services.redis && (
            <ServiceCard
              name="Redis"
              status={metrics.services.redis.status}
              metrics={[
                `Response: ${formatTime(metrics.services.redis.response_time)}`,
                `Memory: ${formatBytes(metrics.services.redis.memory_usage)}`,
              ]}
            />
          )}
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            Performance Metrics
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Memory Usage</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--electric-lime)] rounded-full"
                    style={{ width: `${Math.min(metrics.performance.memory_usage, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] w-12 text-right">
                  {metrics.performance.memory_usage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">CPU Usage</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--electric-cyan)] rounded-full"
                    style={{ width: `${Math.min(metrics.performance.cpu_usage, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] w-12 text-right">
                  {metrics.performance.cpu_usage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Error Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--error)] rounded-full"
                    style={{ width: `${Math.min(metrics.performance.error_rate * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] w-12 text-right">
                  {(metrics.performance.error_rate * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            Recent Alerts
          </h3>

          <div className="space-y-3">
            {metrics.alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  alert.type === 'error' ? 'bg-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{alert.message}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={getAlertColor(alert.type)}>
                  {alert.type}
                </StatusBadge>
              </div>
            ))}

            {metrics.alerts.length === 0 && (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">
                No recent alerts
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Recent Activity
        </h3>

        <div className="space-y-2">
          {metrics.recent_activity.slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)]">{activity.event}</p>
                <p className="text-xs text-[var(--text-muted)]">{activity.details}</p>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </div>
          ))}

          {metrics.recent_activity.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Quick Actions
        </h3>

        <div className="flex gap-3">
          <Button variant="outline">
            View Logs
          </Button>
          <Button variant="outline">
            Run Diagnostics
          </Button>
          <Button variant="outline">
            Export Report
          </Button>
          <Button variant="outline">
            Configure Alerts
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
  status?: "info" | "error" | "success" | "pending" | "warning";
  icon: string;
}

function MetricCard({ title, value, subtitle, status, icon }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
          <p className="text-xl font-bold text-[var(--text-primary)] mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)]">
              {subtitle}
            </p>
          )}
          {status && (
            <StatusBadge status={status} className="mt-2">
              {status}
            </StatusBadge>
          )}
        </div>

        <div className="text-2xl">{icon}</div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Service Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface ServiceCardProps {
  name: string;
  status: 'up' | 'down' | 'degraded';
  metrics: string[];
}

function ServiceCard({ name, status, metrics }: ServiceCardProps) {
  const getStatusColor = (status: string): "info" | "error" | "success" | "pending" | "warning" => {
    switch (status) {
      case 'up': return 'success';
      case 'degraded': return 'warning';
      case 'down': return 'error';
      default: return 'info';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-[var(--text-primary)]">{name}</h4>
        <StatusBadge status={getStatusColor(status)}>
          {status}
        </StatusBadge>
      </div>

      <div className="space-y-1">
        {metrics.map((metric, index) => (
          <p key={index} className="text-xs text-[var(--text-secondary)]">
            {metric}
          </p>
        ))}
      </div>
    </Card>
  );
}
