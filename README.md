# OpenPeople.ai

Human-centric AI solutions for businesses. We help you keep your data safe, useful, and yours.

## Overview

OpenPeople.ai is a multi-tenant SaaS platform that provides modular AI-powered products:

### Product Add-ons

- **Cloud Storage** (Cloudflare R2) - Zero-egress file storage with versioning and CDN
- **Email** (Resend) - Transactional email with templates and domain management
- **Experiments & Feature Flags** - A/B testing and progressive rollouts

### Core Features

- **Multi-Tenant Platform** - Unlimited storefronts with isolated data and custom domains
- **Super Admin Console** - Platform-wide management and analytics
- **Self-Service Signup** - Automated tenant provisioning

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Storage**: Cloudflare R2
- **Email**: Resend
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/OpenPeopleStudio/open_people.git
cd open_people

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the marketing site.

## Project Structure

```
open_people/
├── app/
│   ├── (marketing)/        # Public marketing pages
│   │   ├── page.tsx        # Landing page
│   │   ├── login/          # Login page
│   │   └── signup/         # Self-service signup
│   ├── (platform)/         # Tenant application
│   │   └── admin/          # Tenant admin dashboard
│   │       ├── storage/    # Cloud storage management
│   │       ├── email/      # Email management
│   │       └── experiments/# A/B testing dashboard
│   ├── super-admin/        # Platform admin dashboard
│   │   ├── tenants/        # Tenant management
│   │   ├── storage/        # Storage add-on metrics
│   │   ├── email/          # Email add-on metrics
│   │   ├── experiments/    # Experiments add-on metrics
│   │   ├── analytics/      # Platform analytics
│   │   ├── billing/        # Revenue overview
│   │   └── settings/       # Platform settings
│   └── api/                # API routes
│       ├── storage/        # Storage API
│       ├── email/          # Email API
│       └── experiments/    # Experiments API
├── components/             # Shared UI components
├── lib/                    # Utilities and helpers
│   ├── supabase/           # Supabase clients
│   ├── storage/            # R2 storage client
│   ├── email/              # Resend email client
│   ├── experiments/        # Experiments SDK
│   └── tenant.ts           # Tenant resolution
├── supabase/              # Database migrations
└── types/                 # TypeScript definitions
```

## Architecture

OpenPeople.ai uses a multi-tenant architecture where:

1. **Marketing site** (`openpeople.ai`, `www.openpeople.ai`) - Public landing pages
2. **Tenant sites** (`{slug}.openpeople.ai` or custom domains) - Individual storefronts
3. **Super admin** (`app.openpeople.ai`) - Platform management

Domain routing is handled in middleware, with tenant resolution based on:
- Custom domain lookup (highest priority)
- Subdomain extraction
- Default tenant fallback

## Product Add-ons

### Cloud Storage

Powered by Cloudflare R2 with zero egress fees.

**Pricing**: $0-99/month
- Free: 1GB storage, 5GB bandwidth
- Starter ($9/mo): 10GB storage, 50GB bandwidth
- Pro ($29/mo): 100GB storage, 500GB bandwidth
- Enterprise ($99/mo): 1TB storage, 5TB bandwidth

**Environment Variables**:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=openpeople-storage
```

### Email

Powered by Resend for reliable email delivery.

**Pricing**: $0-199/month
- Free: 100 emails/month
- Starter ($19/mo): 5K emails/month
- Pro ($49/mo): 50K emails/month
- Enterprise ($199/mo): 500K emails/month

**Environment Variables**:
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@mail.openpeople.ai
DEFAULT_FROM_NAME=OpenPeople
```

### Experiments & Feature Flags

Built-in A/B testing and feature flag management.

**Pricing**: $0-299/month
- Free: 5 flags, 2 experiments, 1K events/day
- Starter ($29/mo): 20 flags, 10 experiments, 50K events/day
- Pro ($99/mo): 100 flags, 50 experiments, 500K events/day
- Enterprise ($299/mo): Unlimited flags, experiments, events

**SDK Usage**:

```typescript
import { useExperiments } from '@/lib/experiments/sdk';

// Initialize the SDK
const experiments = useExperiments('your-tenant-id');

// Set user context
experiments.setUser('user-123', {
  country: 'US',
  plan: 'pro',
});

// Fetch config from server
await experiments.fetchConfig();

// Get experiment variant
const variant = experiments.getVariant('checkout_flow');
if (variant?.variantKey === 'variant_a') {
  // Show variant A
}

// Check feature flag
if (experiments.isEnabled('new_dashboard')) {
  // Show new dashboard
}
```

**Server-side usage**:

```typescript
import { OpenPeopleExperiments } from '@/lib/experiments/sdk';

const sdk = new OpenPeopleExperiments('your-tenant-id');
await sdk.fetchConfig();

sdk.setUser('user-123', { plan: 'pro' });
const variant = sdk.getVariant('pricing_test');
```

**API Endpoints**:
- `GET /api/experiments/config?tenant_id=xxx` - Fetch flags and experiments
- `POST /api/experiments/exposure` - Track exposure event
- `GET /api/experiments/experiments` - List experiments
- `POST /api/experiments/experiments` - Create experiment
- `GET /api/experiments/flags` - List feature flags
- `POST /api/experiments/flags` - Create feature flag

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare R2 (Storage)
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=openpeople-storage

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@mail.openpeople.ai
DEFAULT_FROM_NAME=OpenPeople

# Deployment
NEXT_PUBLIC_ROOT_DOMAIN=openpeople.ai
NEXT_PUBLIC_SUPER_ADMIN_DOMAIN=app.openpeople.ai
```

## Deployment

The project is configured for Vercel deployment:

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Database Migrations

Apply migrations with Supabase CLI:

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Check migration status
supabase migration list
```

## License

Proprietary - All rights reserved
