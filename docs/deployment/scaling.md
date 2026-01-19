# Performance & Scaling Guide

This document covers performance optimization strategies, scaling approaches, and best practices for maintaining a high-performance OpenPeople.ai deployment.

## Table of Contents

- [Performance Principles](#performance-principles)
- [Application Performance](#application-performance)
- [Database Performance](#database-performance)
- [Caching Strategies](#caching-strategies)
- [Scaling Strategies](#scaling-strategies)
- [Load Testing](#load-testing)
- [Performance Monitoring](#performance-monitoring)
- [Optimization Checklist](#optimization-checklist)

---

## Performance Principles

### Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **TTFB** (Time to First Byte) | < 200ms | Server response time |
| **LCP** (Largest Contentful Paint) | < 2.5s | Page load perception |
| **FID** (First Input Delay) | < 100ms | Interactivity |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Visual stability |
| **API P95 Latency** | < 500ms | 95th percentile response |
| **Error Rate** | < 0.1% | Failed requests |

### Performance Budget

```typescript
// performance.config.ts
export const PERFORMANCE_BUDGETS = {
  // Page metrics
  ttfb: 200,           // ms
  lcp: 2500,           // ms
  fid: 100,            // ms
  cls: 0.1,            // score
  
  // Bundle sizes
  jsBundle: 200,       // KB (gzipped)
  cssBundle: 50,       // KB (gzipped)
  imageSize: 200,      // KB per image
  
  // API metrics
  apiP50: 100,         // ms
  apiP95: 500,         // ms
  apiP99: 1000,        // ms
  
  // Database
  queryP95: 50,        // ms
};
```

---

## Application Performance

### Server-Side Optimization

#### Use Streaming and Suspense

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function DashboardContent() {
  // This can stream while loading
  const data = await fetchDashboardData();
  return <Dashboard data={data} />;
}
```

#### Implement Parallel Data Fetching

```typescript
// BAD: Sequential fetching
async function Page() {
  const users = await getUsers();      // 100ms
  const stats = await getStats();      // 100ms
  const alerts = await getAlerts();    // 100ms
  // Total: 300ms
}

// GOOD: Parallel fetching
async function Page() {
  const [users, stats, alerts] = await Promise.all([
    getUsers(),      // 100ms
    getStats(),      // 100ms  } All run in parallel
    getAlerts(),     // 100ms
  ]);
  // Total: ~100ms
}
```

#### Use Static Generation Where Possible

```typescript
// app/marketing/page.tsx
// Static generation - built at deploy time
export default function MarketingPage() {
  return <Marketing />;
}

// app/docs/[slug]/page.tsx
// Static generation with dynamic paths
export async function generateStaticParams() {
  const docs = await getDocSlugs();
  return docs.map(slug => ({ slug }));
}
```

### Client-Side Optimization

#### Code Splitting and Lazy Loading

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(
  () => import('@/components/HeavyChart'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false  // Client-only component
  }
);

const AdminPanel = dynamic(
  () => import('@/components/AdminPanel'),
  { loading: () => <AdminSkeleton /> }
);
```

#### Optimize Images

```typescript
// Use Next.js Image component
import Image from 'next/image';

export function ProductImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      placeholder="blur"
      blurDataURL={generateBlurPlaceholder()}
      sizes="(max-width: 768px) 100vw, 400px"
      priority={false}  // Set true for above-fold images
    />
  );
}
```

#### Reduce Bundle Size

```typescript
// Import only what you need
// BAD
import { everything } from 'large-library';

// GOOD
import { specificFunction } from 'large-library/specificFunction';

// Use bundle analyzer
// next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer';

const config = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})({
  // ... config
});
```

---

## Database Performance

### Query Optimization

#### Use Proper Indexes

```sql
-- Identify missing indexes
SELECT 
  relname as table,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_tup_read DESC;

-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_profiles_tenant 
  ON profiles(tenant_id);

CREATE INDEX CONCURRENTLY idx_audit_logs_tenant_created 
  ON audit_logs(tenant_id, created_at DESC);

-- Partial index for active records
CREATE INDEX CONCURRENTLY idx_tenants_active 
  ON tenants(slug) 
  WHERE status = 'active';
```

#### Optimize Common Queries

```typescript
// BAD: Select all columns
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('tenant_id', tenantId);

// GOOD: Select only needed columns
const { data } = await supabase
  .from('profiles')
  .select('id, email, name, role')
  .eq('tenant_id', tenantId);

// BAD: N+1 queries
for (const user of users) {
  const profile = await getProfile(user.id);
}

// GOOD: Single query with join
const { data } = await supabase
  .from('users')
  .select(`
    id,
    email,
    profiles (
      name,
      role
    )
  `)
  .in('id', userIds);
```

#### Use Connection Pooling

```typescript
// Supabase automatically uses PgBouncer
// Ensure using transaction mode for serverless

// For high-throughput scenarios, consider:
// - Increasing pool size (Supabase dashboard)
// - Using prepared statements
// - Batching operations
```

### Query Analysis

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM profiles
WHERE tenant_id = 'uuid-here'
AND role = 'admin';

-- Check for sequential scans (bad for large tables)
-- Look for "Seq Scan" in output
-- Add indexes to convert to "Index Scan"
```

---

## Caching Strategies

### Next.js Caching

```typescript
// Route segment caching
export const revalidate = 3600; // Revalidate every hour

// Fetch-level caching
const data = await fetch(url, {
  next: { 
    revalidate: 3600,  // Cache for 1 hour
    tags: ['dashboard']  // Tag for on-demand revalidation
  }
});

// On-demand revalidation
import { revalidateTag } from 'next/cache';
revalidateTag('dashboard');
```

### React Cache

```typescript
import { cache } from 'react';

// Deduplicate requests within a single render
export const getTenant = cache(async (slug: string) => {
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
});

// Multiple components can call getTenant(slug)
// but only one database query is made
```

### Edge Caching

```typescript
// API route with edge caching
export async function GET(request: Request) {
  const data = await getData();
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

### Database Query Caching

```typescript
// Memoize expensive queries
const queryCache = new Map<string, { data: any; expires: number }>();

async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = queryCache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  const data = await queryFn();
  queryCache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000),
  });
  
  return data;
}

// Usage
const tenant = await cachedQuery(
  `tenant:${slug}`,
  () => fetchTenantBySlug(slug),
  300  // Cache for 5 minutes
);
```

---

## Scaling Strategies

### Horizontal Scaling

```
                    Load Balancer (Vercel Edge)
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │ Region  │       │ Region  │       │ Region  │
    │   US    │       │   EU    │       │  APAC   │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Database   │
                    │  (Primary)  │
                    └─────────────┘
```

Vercel automatically scales:
- Edge functions run in multiple regions
- Static assets served from global CDN
- Serverless functions scale to demand

### Vertical Scaling

**Database Scaling** (Supabase Dashboard):
1. Go to Project Settings → Database
2. Upgrade compute size
3. Increase connection limit

| Size | vCPU | RAM | Connections |
|------|------|-----|-------------|
| Micro | 2 | 1GB | 60 |
| Small | 2 | 2GB | 100 |
| Medium | 2 | 4GB | 200 |
| Large | 4 | 8GB | 500 |
| XL | 8 | 16GB | 1000 |

### Database Read Replicas

For read-heavy workloads (Enterprise):

```typescript
// Route reads to replica
const readClient = createClient(SUPABASE_URL, ANON_KEY, {
  db: { schema: 'public' },
  // Use read replica endpoint
});

// Keep writes on primary
const writeClient = createClient(SUPABASE_URL, ANON_KEY);
```

### Tenant Sharding (Future)

For very large scale:

```
Tenant A-M  →  Database Cluster 1
Tenant N-Z  →  Database Cluster 2
```

---

## Load Testing

### k6 Load Test Script

```javascript
// tests/load/stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

export const options = {
  scenarios: {
    // Constant load
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '30s', target: 500 },  // Spike
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://openpeople.ai';

export default function () {
  // Test API endpoint
  const start = Date.now();
  const res = http.get(`${BASE_URL}/api/health`);
  apiDuration.add(Date.now() - start);
  
  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  sleep(1);
}
```

### Running Load Tests

```bash
# Install k6
brew install k6

# Run load test
k6 run tests/load/stress.js

# Run with custom parameters
k6 run -e BASE_URL=https://staging.openpeople.ai tests/load/stress.js

# Output to cloud
k6 run --out cloud tests/load/stress.js
```

### Benchmark Results Template

```markdown
## Load Test Results - [Date]

### Configuration
- Target: https://openpeople.ai
- Duration: 10 minutes
- Virtual Users: 50-500

### Results

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Requests/sec | 1,234 | 1,000 | ✅ |
| P50 Latency | 45ms | 100ms | ✅ |
| P95 Latency | 180ms | 500ms | ✅ |
| P99 Latency | 450ms | 1000ms | ✅ |
| Error Rate | 0.02% | 0.1% | ✅ |

### Observations
- [Key findings]
- [Bottlenecks identified]
- [Recommendations]
```

---

## Performance Monitoring

### Key Dashboards

#### Application Performance

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION PERFORMANCE                       │
├─────────────────────────────────────────────────────────────────┤
│  Web Vitals (last 24h)                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ LCP: 1.8s   │  │ FID: 45ms   │  │ CLS: 0.05   │             │
│  │ ████████░░  │  │ █████████░  │  │ ██████████  │             │
│  │ Good        │  │ Good        │  │ Good        │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  API Latency (P95)                                              │
│  [═══════════════════════════════════════════] 180ms            │
├─────────────────────────────────────────────────────────────────┤
│  Error Rate                                                      │
│  [══░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0.02%            │
└─────────────────────────────────────────────────────────────────┘
```

#### Database Performance

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE PERFORMANCE                          │
├─────────────────────────────────────────────────────────────────┤
│  Connections: 45/200 (22%)  │  CPU: 15%  │  Memory: 2.1GB/4GB  │
├─────────────────────────────────────────────────────────────────┤
│  Query Performance                                               │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Avg Query Time: 12ms                                       ││
│  │ Slow Queries (>100ms): 3                                   ││
│  │ Queries/sec: 450                                           ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Alerting Rules

```yaml
alerts:
  - name: High API Latency
    condition: api_p95_latency > 500ms for 5m
    severity: warning
    action: Investigate slow queries
    
  - name: Error Rate Spike
    condition: error_rate > 1% for 2m
    severity: critical
    action: Check logs, consider rollback
    
  - name: Database CPU High
    condition: db_cpu > 80% for 10m
    severity: warning
    action: Optimize queries or scale up
    
  - name: Memory Pressure
    condition: memory_usage > 90% for 5m
    severity: critical
    action: Scale up or investigate leaks
```

---

## Optimization Checklist

### Pre-Launch

- [ ] Run Lighthouse audit (target: 90+ all categories)
- [ ] Test with 3G throttling
- [ ] Verify image optimization
- [ ] Check bundle sizes
- [ ] Review database indexes
- [ ] Test under load

### Weekly

- [ ] Review Web Vitals trends
- [ ] Check slow query logs
- [ ] Review error rates
- [ ] Analyze cache hit rates
- [ ] Check resource utilization

### Monthly

- [ ] Full load test
- [ ] Database query analysis
- [ ] Bundle size audit
- [ ] Dependency updates
- [ ] Performance regression review

### Per Release

- [ ] Performance impact assessment
- [ ] Load test new features
- [ ] Monitor metrics post-deploy
- [ ] Compare before/after metrics

---

## Related Documentation

- [Infrastructure](./infrastructure.md)
- [Monitoring](./monitoring.md)
- [Testing Strategy](../development/testing.md)
- [Troubleshooting](../support/troubleshooting.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
