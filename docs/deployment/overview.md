# Deployment Guide

This guide covers deploying OpenPeople.ai to production, including infrastructure setup, environment configuration, and operational procedures.

## Table of Contents

- [Deployment Architecture](#deployment-architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Vercel Deployment](#vercel-deployment)
- [Supabase Setup](#supabase-setup)
- [External Services](#external-services)
- [Domain Configuration](#domain-configuration)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION ARCHITECTURE                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         EDGE NETWORK (Vercel)                        │    │
│  │  • Global CDN                                                        │    │
│  │  • Edge Functions                                                    │    │
│  │  • SSL/TLS Termination                                              │    │
│  │  • Custom Domain Support                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      APPLICATION (Next.js 16)                        │    │
│  │  • Server Components                                                 │    │
│  │  • API Routes                                                        │    │
│  │  • Middleware (tenant routing)                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐         │
│  │  Supabase   │          │ Cloudflare  │          │   Resend/   │         │
│  │ PostgreSQL  │          │     R2      │          │   Twilio    │         │
│  │  + Auth     │          │  (Storage)  │          │  (Comms)    │         │
│  └─────────────┘          └─────────────┘          └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Service | Purpose |
|-----------|---------|---------|
| **Hosting** | Vercel | Application hosting, edge network, CI/CD |
| **Database** | Supabase | PostgreSQL, Auth, Realtime, Edge Functions |
| **Storage** | Cloudflare R2 | Zero-egress file storage |
| **Email** | Resend | Transactional email delivery |
| **SMS** | Twilio | SMS notifications |

---

## Prerequisites

### Required Accounts

- [ ] Vercel account (Team plan recommended for production)
- [ ] Supabase account (Pro plan for production)
- [ ] Cloudflare account (for R2 storage)
- [ ] Resend account (for email)
- [ ] Twilio account (for SMS)
- [ ] GitHub/GitLab repository

### Required Tools

```bash
# Node.js 20+
node --version  # v20.x or higher

# Package manager
npm --version   # 10.x or higher

# Vercel CLI
npm install -g vercel

# Supabase CLI
npm install -g supabase
```

---

## Environment Setup

### Environment Variables

Create the following environment variables in your deployment platform:

#### Core Configuration

```bash
# Application
NEXT_PUBLIC_APP_URL=https://openpeople.ai
NEXT_PUBLIC_ROOT_DOMAIN=openpeople.ai
NEXT_PUBLIC_DEFAULT_TENANT_SLUG=default
SUPER_ADMIN_DOMAIN=app.openpeople.ai

# Node environment
NODE_ENV=production
```

#### Supabase

```bash
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
```

#### Cloudflare R2 (Storage Add-on)

```bash
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=openpeople-storage
R2_PUBLIC_URL=https://storage.openpeople.ai
```

#### Resend (Email Add-on)

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@openpeople.ai
```

#### Twilio (Notifications Add-on)

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

### Environment File Structure

```
.env.local          # Local development (git-ignored)
.env.development    # Development defaults
.env.production     # Production defaults (no secrets!)
```

**Important**: Never commit secrets to version control. Use your deployment platform's secret management.

---

## Vercel Deployment

### Initial Setup

1. **Connect Repository**

```bash
# Login to Vercel
vercel login

# Link project
vercel link
```

2. **Configure Project Settings**

In Vercel Dashboard → Project Settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node.js Version | 20.x |

3. **Add Environment Variables**

```bash
# Add via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Or use Vercel Dashboard → Settings → Environment Variables
```

### Deployment Commands

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Promote preview to production
vercel promote [deployment-url]
```

### Automatic Deployments

Configure in Vercel Dashboard → Git:

| Branch | Environment |
|--------|-------------|
| `main` | Production |
| `develop` | Preview |
| `feature/*` | Preview |

### Build Configuration

```javascript
// next.config.ts
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Image optimization domains
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },
      { hostname: 'storage.openpeople.ai' },
    ],
  },
  
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: true,
  },
};

export default nextConfig;
```

---

## Supabase Setup

### Project Creation

1. Create new project at [supabase.com](https://supabase.com)
2. Select region closest to your users
3. Note the project URL and keys

### Database Migrations

```bash
# Login to Supabase
supabase login

# Link to remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Or run migrations manually
supabase migration up
```

### Migration Order

Run migrations in order:

1. `001_core_schema.sql` - Base tenant tables
2. `20260118000000_core_schema.sql` - Extended core schema
3. `20260118100000_storage_schema.sql` - Storage add-on
4. `20260118110000_email_schema.sql` - Email add-on
5. `20260118120000_experiments_schema.sql` - Experiments add-on
6. `20260118130000_notifications_schema.sql` - Notifications add-on
7. `20260119090000_multi_tenant_alignment.sql` - User/tenant alignment

### Auth Configuration

In Supabase Dashboard → Authentication → Settings:

1. **Site URL**: `https://openpeople.ai`

2. **Redirect URLs**:
   ```
   https://openpeople.ai/**
   https://*.openpeople.ai/**
   https://app.openpeople.ai/**
   ```

3. **JWT Expiry**: 3600 (1 hour recommended)

4. **Enable Email Confirmations**: Yes (production)

### Database Roles

```sql
-- Verify RLS is enabled on all tenant tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'tenant%' OR tablename = 'profiles';
```

---

## External Services

### Cloudflare R2 Setup

1. **Create R2 Bucket**

```bash
# Via Cloudflare Dashboard or API
# Bucket name: openpeople-storage
```

2. **Create API Token**

In Cloudflare Dashboard → R2 → Manage R2 API Tokens:
- Permissions: Object Read & Write
- Specify bucket: `openpeople-storage`

3. **Configure Public Access** (optional)

For public file serving, enable public access and set custom domain.

### Resend Setup

1. **Verify Domain**

```bash
# Add DNS records provided by Resend
# Example:
# TXT  _resend.openpeople.ai  → verification-code
# MX   send.openpeople.ai     → feedback-smtp.resend.dev
```

2. **Create API Key**

In Resend Dashboard → API Keys:
- Name: `openpeople-production`
- Permissions: Full access

### Twilio Setup

1. **Get Credentials**

From Twilio Console:
- Account SID
- Auth Token
- Phone Number (SMS-enabled)

2. **Configure Webhooks**

Set webhook URL for delivery status:
```
https://openpeople.ai/api/notifications/webhooks
```

---

## Domain Configuration

### Primary Domains

| Domain | Purpose | Configuration |
|--------|---------|---------------|
| `openpeople.ai` | Marketing site | Vercel |
| `www.openpeople.ai` | Marketing (redirect) | Vercel |
| `app.openpeople.ai` | Super Admin | Vercel |
| `*.openpeople.ai` | Tenant subdomains | Vercel wildcard |

### Vercel Domain Setup

1. **Add Domains**

```bash
# Add primary domain
vercel domains add openpeople.ai

# Add wildcard for tenant subdomains
vercel domains add "*.openpeople.ai"
```

2. **Configure DNS**

At your DNS provider:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
CNAME   app     cname.vercel-dns.com
CNAME   *       cname.vercel-dns.com
```

### SSL Certificates

Vercel automatically provisions SSL certificates for all configured domains.

### Custom Tenant Domains

For tenant custom domains:

1. Tenant adds domain in settings
2. System generates verification token
3. Tenant adds DNS TXT record
4. System verifies and activates domain

```
# Tenant DNS setup
CNAME   store       cname.vercel-dns.com
TXT     _openpeople verification-token-here
```

---

## Post-Deployment Checklist

### Immediate Verification

- [ ] Application loads at production URL
- [ ] SSL certificate is valid
- [ ] Authentication flow works
- [ ] Database connections established
- [ ] Environment variables are set correctly

### Functional Testing

- [ ] Marketing site renders
- [ ] Super admin login works
- [ ] Tenant subdomain routing works
- [ ] API endpoints respond correctly
- [ ] File uploads work (R2)
- [ ] Email sending works (Resend)
- [ ] SMS sending works (Twilio)

### Security Verification

- [ ] RLS policies are active
- [ ] Service role key is not exposed
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Error messages don't leak sensitive data

### Performance Baseline

- [ ] Run Lighthouse audit (target: 90+ scores)
- [ ] Verify edge caching is working
- [ ] Check Time to First Byte (target: <200ms)
- [ ] Test database query performance

### Monitoring Setup

- [ ] Error tracking configured (see [Monitoring](./monitoring.md))
- [ ] Uptime monitoring active
- [ ] Database metrics enabled
- [ ] Log aggregation configured

---

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs
vercel logs [deployment-url]

# Test build locally
npm run build
```

#### Database Connection Issues

```bash
# Verify Supabase URL
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Check connection limits
# Supabase Dashboard → Database → Settings
```

#### Domain Not Working

1. Verify DNS propagation: `dig domain.com`
2. Check Vercel domain status
3. Verify SSL certificate provisioned

### Rollback Procedure

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or promote a known-good deployment
vercel promote [deployment-url] --yes
```

---

## Related Documentation

- [Infrastructure](./infrastructure.md) - Detailed infrastructure setup
- [Monitoring](./monitoring.md) - Production monitoring
- [Backup & Recovery](./backup.md) - Data backup procedures
- [Security Overview](../security/overview.md) - Security practices

---

**Last Updated**: January 18, 2026
**Platform Version**: v0.1.0
