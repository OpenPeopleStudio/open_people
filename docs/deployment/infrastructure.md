# Infrastructure Documentation

This document details the infrastructure components, configuration, and management of the OpenPeople.ai platform.

## Table of Contents

- [Infrastructure Overview](#infrastructure-overview)
- [Compute Layer](#compute-layer)
- [Database Layer](#database-layer)
- [Storage Layer](#storage-layer)
- [Network Configuration](#network-configuration)
- [Scaling Strategy](#scaling-strategy)
- [Cost Optimization](#cost-optimization)

---

## Infrastructure Overview

### Architecture Principles

1. **Serverless-First**: Minimize operational overhead with managed services
2. **Edge-Optimized**: Deploy compute and content close to users
3. **Multi-Region Ready**: Architecture supports global distribution
4. **Cost-Efficient**: Pay-per-use model with predictable scaling costs

### Service Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INFRASTRUCTURE STACK                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           VERCEL                                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │    │
│  │  │   Edge      │  │  Serverless │  │   Static    │                  │    │
│  │  │  Network    │  │  Functions  │  │   Assets    │                  │    │
│  │  │  (CDN)      │  │  (Node.js)  │  │  (ISR)      │                  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          SUPABASE                                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │    │
│  │  │ PostgreSQL  │  │    Auth     │  │  Realtime   │  │   Edge     │ │    │
│  │  │  Database   │  │   (GoTrue)  │  │ (WebSocket) │  │ Functions  │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CLOUDFLARE                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐                                   │    │
│  │  │     R2      │  │   Workers   │                                   │    │
│  │  │  (Storage)  │  │  (Optional) │                                   │    │
│  │  └─────────────┘  └─────────────┘                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│  │           RESEND             │  │           TWILIO              │        │
│  │  ┌─────────────────────┐    │  │  ┌─────────────────────┐     │        │
│  │  │   Email Delivery    │    │  │  │   SMS Delivery      │     │        │
│  │  └─────────────────────┘    │  │  └─────────────────────┘     │        │
│  └──────────────────────────────┘  └──────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Compute Layer

### Vercel Serverless Functions

All Next.js API routes and server components run as Vercel Serverless Functions.

**Configuration** (`vercel.json`):

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "regions": ["iad1", "sfo1", "cdg1"]
}
```

**Function Tiers**:

| Route Pattern | Memory | Timeout | Use Case |
|--------------|--------|---------|----------|
| `/api/storage/*` | 1024 MB | 60s | File uploads |
| `/api/email/*` | 512 MB | 30s | Email sending |
| `/api/*` (default) | 512 MB | 10s | Standard API |

### Edge Middleware

The tenant routing middleware runs at the edge for lowest latency:

```typescript
// middleware.ts
export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// Runs in Vercel Edge Runtime
export function middleware(request: NextRequest) {
  // Tenant resolution logic
  // ~1-5ms execution time at edge
}
```

### Edge Runtime vs Node.js Runtime

| Feature | Edge Runtime | Node.js Runtime |
|---------|--------------|-----------------|
| Cold start | ~0ms | ~250ms |
| Max duration | 30s | 5min (Pro) |
| Memory | 128MB | 1024MB+ |
| Node APIs | Limited | Full |
| Best for | Routing, auth | Heavy compute |

---

## Database Layer

### Supabase PostgreSQL

**Instance Configuration**:

| Environment | Plan | Compute | Storage | Connections |
|-------------|------|---------|---------|-------------|
| Development | Free | Shared | 500MB | 60 |
| Staging | Pro | 2 CPU | 8GB | 200 |
| Production | Pro | 4 CPU | 100GB | 500 |

### Connection Pooling

Supabase uses PgBouncer for connection pooling:

```typescript
// Use pooled connection for serverless
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
  }
);
```

**Connection Modes**:

| Mode | Port | Use Case |
|------|------|----------|
| Session | 5432 | Long-lived connections |
| Transaction | 6543 | Serverless (default) |
| Statement | - | Not recommended |

### Database Extensions

Enabled extensions:

```sql
-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Better JSON support
CREATE EXTENSION IF NOT EXISTS "pg_jsonb_ops";

-- Full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Read Replicas (Future)

For high-read workloads:

```
Primary (Write)     Read Replica 1     Read Replica 2
   iad1          →      sfo1        →       cdg1
```

---

## Storage Layer

### Cloudflare R2

**Bucket Configuration**:

```javascript
// R2 Bucket Settings
{
  name: "openpeople-storage",
  location: "auto",  // Automatic region selection
  class: "Standard",
  versioning: true,  // For recovery
}
```

**Access Patterns**:

| Pattern | Implementation | Caching |
|---------|---------------|---------|
| Private uploads | Presigned URLs (15min) | None |
| Public assets | Public bucket + CDN | Edge (1d) |
| Tenant files | RLS-gated presigned | None |

### Storage Limits by Plan

| Plan | Storage | Bandwidth | Files |
|------|---------|-----------|-------|
| Free | 1 GB | 10 GB/mo | 10,000 |
| Starter | 10 GB | 100 GB/mo | 100,000 |
| Pro | 100 GB | 1 TB/mo | 1,000,000 |
| Enterprise | Custom | Custom | Unlimited |

### File Upload Flow

```
Client                    Vercel API               R2
  │                           │                    │
  │  1. Request upload URL    │                    │
  │ ─────────────────────────►│                    │
  │                           │  2. Generate       │
  │                           │     presigned URL  │
  │                           │ ──────────────────►│
  │  3. Return presigned URL  │                    │
  │ ◄─────────────────────────│                    │
  │                           │                    │
  │  4. Upload directly to R2 │                    │
  │ ───────────────────────────────────────────────►│
  │                           │                    │
  │  5. Confirm upload        │                    │
  │ ─────────────────────────►│                    │
  │                           │  6. Verify & save  │
  │                           │     metadata       │
  │                           │ ──────────────────►│
```

---

## Network Configuration

### DNS Configuration

```
; Primary domain
openpeople.ai.          A       76.76.21.21
www.openpeople.ai.      CNAME   cname.vercel-dns.com.
app.openpeople.ai.      CNAME   cname.vercel-dns.com.
*.openpeople.ai.        CNAME   cname.vercel-dns.com.

; Email (Resend)
send.openpeople.ai.     MX      feedback-smtp.resend.dev.
_resend.openpeople.ai.  TXT     "resend-verification=..."

; SPF/DKIM/DMARC
openpeople.ai.          TXT     "v=spf1 include:resend.dev ~all"
resend._domainkey       CNAME   resend._domainkey.resend.dev.
_dmarc.openpeople.ai.   TXT     "v=DMARC1; p=quarantine; rua=..."
```

### SSL/TLS

- **Provider**: Vercel (automatic Let's Encrypt)
- **Protocol**: TLS 1.3
- **HSTS**: Enabled (max-age=31536000)
- **Certificate Renewal**: Automatic

### CORS Configuration

```typescript
// API route CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

**Allowed Origins**:
- `https://openpeople.ai`
- `https://*.openpeople.ai`
- Tenant custom domains (dynamically validated)

---

## Scaling Strategy

### Automatic Scaling

Vercel and Supabase both provide automatic scaling:

```
Load Increase
     │
     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Request    │───►│  Vercel     │───►│  Supabase   │
│  Volume     │    │  Functions  │    │  Pooler     │
│  (auto)     │    │  (auto)     │    │  (auto)     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Scaling Limits

| Component | Free | Pro | Enterprise |
|-----------|------|-----|------------|
| Vercel Functions (concurrent) | 10 | 1000 | Custom |
| Supabase Connections | 60 | 500 | 1000+ |
| R2 Requests/sec | 1000 | 10000 | Custom |

### Database Scaling

**Vertical Scaling** (Supabase Dashboard):
- Upgrade compute size (2 CPU → 4 CPU → 8 CPU)
- Increase storage allocation
- Add more connections

**Horizontal Scaling** (Future):
- Read replicas for read-heavy workloads
- Regional replicas for lower latency

### Function Optimization

```typescript
// Optimize for cold starts
export const runtime = 'edge';  // Use edge when possible

// Minimize bundle size
import { specific } from 'library';  // Named imports

// Connection reuse
const supabase = createClient();  // Module-level singleton
```

---

## Cost Optimization

### Cost Breakdown (Estimated Monthly)

| Service | Free Tier | Starter | Pro |
|---------|-----------|---------|-----|
| Vercel | $0 | $20 | $150+ |
| Supabase | $0 | $25 | $100+ |
| Cloudflare R2 | $0 (10GB) | $15 | $50+ |
| Resend | $0 (3k emails) | $20 | $100+ |
| Twilio | Pay-per-use | $20 | $100+ |
| **Total** | **$0** | **~$100** | **~$500+** |

### Cost Reduction Strategies

1. **Edge Caching**
   ```typescript
   // Cache static responses at edge
   export const revalidate = 3600; // 1 hour
   ```

2. **Database Query Optimization**
   ```sql
   -- Use indexes effectively
   CREATE INDEX CONCURRENTLY idx_tenant_data 
   ON data(tenant_id, created_at DESC);
   ```

3. **Storage Optimization**
   - Compress uploads before storage
   - Use appropriate image formats (WebP)
   - Implement lifecycle policies for old files

4. **Function Optimization**
   - Use edge runtime when possible (cheaper)
   - Minimize function memory allocation
   - Batch database operations

### Resource Monitoring

Monitor costs via:
- Vercel Dashboard → Usage
- Supabase Dashboard → Usage
- Cloudflare Dashboard → R2 → Analytics

---

## Disaster Recovery

### Backup Strategy

See [Backup & Recovery](./backup.md) for detailed procedures.

**Summary**:
- Database: Daily automated backups (Supabase)
- Storage: R2 versioning enabled
- Code: Git repository
- Secrets: Vercel environment variables

### Recovery Time Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Application | 5 min | 0 (git) |
| Database | 1 hour | 24 hours |
| Storage | 15 min | 0 (versioned) |

---

## Related Documentation

- [Deployment Overview](./overview.md)
- [Monitoring](./monitoring.md)
- [Backup & Recovery](./backup.md)
- [Scaling Guide](./scaling.md)

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
