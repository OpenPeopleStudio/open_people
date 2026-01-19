# Production Monitoring

This document covers monitoring strategies, tools, and procedures for maintaining the health and performance of the OpenPeople.ai platform in production.

## Table of Contents

- [Monitoring Overview](#monitoring-overview)
- [Application Monitoring](#application-monitoring)
- [Database Monitoring](#database-monitoring)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Alerting](#alerting)
- [Logging](#logging)
- [Performance Monitoring](#performance-monitoring)
- [Dashboards](#dashboards)

---

## Monitoring Overview

### Monitoring Philosophy

1. **Proactive Detection**: Identify issues before users report them
2. **Full Observability**: Metrics, logs, and traces for all components
3. **Actionable Alerts**: Every alert should have a clear response
4. **Minimal Overhead**: Monitoring shouldn't impact performance

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MONITORING STACK                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        DATA SOURCES                                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │   Vercel    │  │  Supabase   │  │ Cloudflare  │  │   Custom   │  │    │
│  │  │  Analytics  │  │   Metrics   │  │  Analytics  │  │   Events   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       AGGREGATION LAYER                              │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │              Log Aggregation (Optional)                      │    │    │
│  │  │         Datadog / Grafana Cloud / Custom                    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          ALERTING                                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │   Slack     │  │   Email     │  │  PagerDuty  │                  │    │
│  │  │   Alerts    │  │   Alerts    │  │  (Critical) │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Application Monitoring

### Vercel Analytics

Built-in analytics available in Vercel Dashboard:

**Web Vitals**:
| Metric | Target | Description |
|--------|--------|-------------|
| LCP | < 2.5s | Largest Contentful Paint |
| FID | < 100ms | First Input Delay |
| CLS | < 0.1 | Cumulative Layout Shift |
| TTFB | < 200ms | Time to First Byte |

**Enable Analytics**:
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Tracking

**Option 1: Vercel Error Tracking**
```typescript
// Built-in with Vercel deployment
// Errors visible in Vercel Dashboard → Deployments → Functions
```

**Option 2: Sentry Integration** (Recommended for production)
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});
```

### API Monitoring

Track API endpoint performance:

```typescript
// lib/monitoring.ts
export async function trackApiCall(
  endpoint: string,
  duration: number,
  status: number,
  tenantId?: string
) {
  // Log to Supabase for internal analytics
  await supabase.from('api_metrics').insert({
    endpoint,
    duration_ms: duration,
    status_code: status,
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
  });
}

// Usage in API route
export async function GET(request: Request) {
  const start = Date.now();
  try {
    const result = await handleRequest();
    trackApiCall('/api/endpoint', Date.now() - start, 200);
    return Response.json(result);
  } catch (error) {
    trackApiCall('/api/endpoint', Date.now() - start, 500);
    throw error;
  }
}
```

---

## Database Monitoring

### Supabase Metrics

Available in Supabase Dashboard → Reports:

**Key Metrics**:
| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| CPU Usage | > 70% | > 90% | Scale up |
| Memory Usage | > 75% | > 90% | Optimize queries |
| Disk Usage | > 80% | > 95% | Increase storage |
| Active Connections | > 80% | > 95% | Review connection pooling |

### Query Performance

**Enable Query Logging**:
```sql
-- In Supabase SQL Editor
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1s
SELECT pg_reload_conf();
```

**Identify Slow Queries**:
```sql
SELECT 
  query,
  calls,
  mean_time,
  total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

### Connection Monitoring

```sql
-- Current connections
SELECT 
  usename,
  application_name,
  client_addr,
  state,
  query_start
FROM pg_stat_activity
WHERE datname = current_database();

-- Connection summary
SELECT 
  state,
  COUNT(*) 
FROM pg_stat_activity 
GROUP BY state;
```

### Table Statistics

```sql
-- Table sizes
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Index usage
SELECT
  indexrelname AS index_name,
  idx_scan AS scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## Infrastructure Monitoring

### Vercel Function Monitoring

**Metrics to Track**:
- Invocation count
- Error rate
- Duration (P50, P95, P99)
- Cold start frequency

**Access via**: Vercel Dashboard → Analytics → Functions

### Cloudflare R2 Monitoring

**Metrics Available**:
- Storage usage
- Request count
- Bandwidth consumption
- Error rate

**Access via**: Cloudflare Dashboard → R2 → Analytics

### External Service Health

Monitor third-party service status:

| Service | Status Page |
|---------|-------------|
| Vercel | status.vercel.com |
| Supabase | status.supabase.com |
| Cloudflare | cloudflarestatus.com |
| Resend | resend.com/status |
| Twilio | status.twilio.com |

### Synthetic Monitoring

Set up synthetic checks for critical paths:

```javascript
// Example: Checkly or similar
const checks = [
  {
    name: 'Marketing Homepage',
    url: 'https://openpeople.ai',
    frequency: '5m',
    assertions: [
      { type: 'statusCode', value: 200 },
      { type: 'responseTime', value: 2000 },
    ],
  },
  {
    name: 'API Health',
    url: 'https://openpeople.ai/api/health',
    frequency: '1m',
    assertions: [
      { type: 'statusCode', value: 200 },
      { type: 'jsonBody', path: '$.status', value: 'ok' },
    ],
  },
  {
    name: 'Super Admin Login',
    url: 'https://app.openpeople.ai/login',
    frequency: '5m',
    assertions: [
      { type: 'statusCode', value: 200 },
    ],
  },
];
```

---

## Alerting

### Alert Severity Levels

| Level | Response Time | Channel | Examples |
|-------|--------------|---------|----------|
| **Critical** | Immediate | PagerDuty + Phone | Site down, data breach |
| **High** | 15 minutes | Slack + Email | Error rate spike, DB issues |
| **Medium** | 1 hour | Slack | Performance degradation |
| **Low** | Next business day | Email | Usage warnings |

### Alert Definitions

#### Critical Alerts

```yaml
- name: Site Down
  condition: uptime_check_failed for 2 minutes
  severity: critical
  action: Page on-call, check Vercel status

- name: Database Unreachable
  condition: db_connection_failed for 1 minute
  severity: critical
  action: Page on-call, check Supabase status

- name: Error Rate Spike
  condition: error_rate > 10% for 5 minutes
  severity: critical
  action: Investigate recent deployments
```

#### High Alerts

```yaml
- name: High Latency
  condition: p95_latency > 2s for 5 minutes
  severity: high
  action: Check database performance

- name: DB Connections High
  condition: connection_count > 80%
  severity: high
  action: Review connection pooling

- name: Storage Near Limit
  condition: storage_usage > 90%
  severity: high
  action: Clean up or upgrade storage
```

#### Medium Alerts

```yaml
- name: Elevated Error Rate
  condition: error_rate > 1% for 15 minutes
  severity: medium
  action: Investigate error logs

- name: Memory Usage High
  condition: memory_usage > 80%
  severity: medium
  action: Monitor, consider scaling
```

### Alert Configuration (Example: Slack)

```typescript
// lib/alerts.ts
async function sendSlackAlert(alert: Alert) {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 ${alert.severity.toUpperCase()}: ${alert.name}`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Environment:*\n${alert.environment}` },
            { type: 'mrkdwn', text: `*Time:*\n${alert.timestamp}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Details:*\n${alert.message}`,
          },
        },
      ],
    }),
  });
}
```

---

## Logging

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `error` | Exceptions, failures | Database errors, API failures |
| `warn` | Potential issues | Deprecated usage, rate limiting |
| `info` | Important events | User actions, deployments |
| `debug` | Development details | Query parameters, internal state |

### Structured Logging

```typescript
// lib/logger.ts
interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export function log(entry: Omit<LogEntry, 'timestamp'>) {
  const logEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  // Output as JSON for log aggregation
  console.log(JSON.stringify(logEntry));
}

// Usage
log({
  level: 'info',
  message: 'User signed in',
  tenantId: 'uuid',
  userId: 'uuid',
  metadata: { method: 'email' },
});
```

### Log Retention

| Log Type | Retention | Storage |
|----------|-----------|---------|
| Application logs | 30 days | Vercel |
| Database logs | 7 days | Supabase |
| Audit logs | 1 year | Custom table |
| Security logs | 2 years | Custom table |

### Audit Logging

```typescript
// lib/audit.ts
export async function auditLog(event: {
  action: string;
  actor: string;
  resource: string;
  resourceId: string;
  tenantId: string;
  details?: Record<string, unknown>;
}) {
  await supabase.from('audit_logs').insert({
    ...event,
    timestamp: new Date().toISOString(),
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
  });
}

// Usage
await auditLog({
  action: 'user.deleted',
  actor: adminUserId,
  resource: 'profiles',
  resourceId: deletedUserId,
  tenantId: tenantId,
  details: { reason: 'User requested deletion' },
});
```

---

## Performance Monitoring

### Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| Uptime | 99.9% | Synthetic monitoring |
| Response Time (P50) | < 200ms | Vercel Analytics |
| Response Time (P95) | < 500ms | Vercel Analytics |
| Error Rate | < 0.1% | Error tracking |
| Apdex Score | > 0.9 | Calculated |

### Performance Budgets

```typescript
// Performance thresholds
const PERFORMANCE_BUDGETS = {
  // Page load metrics
  LCP: 2500,        // ms
  FID: 100,         // ms
  CLS: 0.1,         // score
  
  // API metrics
  API_P50: 100,     // ms
  API_P95: 500,     // ms
  API_P99: 1000,    // ms
  
  // Database
  QUERY_P95: 100,   // ms
};
```

### Performance Tracking Implementation

```typescript
// Track Web Vitals
export function reportWebVitals(metric: NextWebVitalsMetric) {
  const body = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    page: window.location.pathname,
  };
  
  // Send to analytics endpoint
  navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(body));
}
```

---

## Dashboards

### Recommended Dashboard Layouts

#### Operations Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│                      SYSTEM HEALTH                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Uptime     │  │  Error Rate  │  │   Latency    │         │
│  │   99.99%     │  │    0.02%     │  │   P95: 180ms │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├────────────────────────────────────────────────────────────────┤
│                    REQUEST VOLUME                               │
│  [═══════════════════════════════════════════]  24h trend      │
├────────────────────────────────────────────────────────────────┤
│  SERVICES             STATUS        LATENCY       ERRORS       │
│  ─────────────────────────────────────────────────────────────│
│  API Server           ●  OK         142ms         0.01%        │
│  Database             ●  OK         23ms          0.00%        │
│  Storage (R2)         ●  OK         89ms          0.00%        │
│  Email (Resend)       ●  OK         -             0.00%        │
└────────────────────────────────────────────────────────────────┘
```

#### Business Metrics Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│                     TENANT METRICS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Active Tenants│  │  API Calls   │  │  Storage     │         │
│  │     247      │  │   1.2M/day   │  │   842 GB     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
├────────────────────────────────────────────────────────────────┤
│                    ADD-ON USAGE                                 │
│  Email:        [████████░░]  78%                               │
│  Storage:      [██████░░░░]  62%                               │
│  Experiments:  [████░░░░░░]  41%                               │
│  Notifications:[███░░░░░░░]  34%                               │
└────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [Deployment Overview](./overview.md)
- [Infrastructure](./infrastructure.md)
- [Backup & Recovery](./backup.md)
- [Security Overview](../security/overview.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
