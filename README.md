# OpenPeople.ai

Human-centric AI solutions for businesses. We help you keep your data safe, useful, and yours.

## Overview

OpenPeople.ai is a multi-tenant SaaS platform that provides modular AI-powered products:

### Product Add-ons

- **Cloud Storage** (Cloudflare R2) - Zero-egress file storage with versioning and CDN
- **Email** (Resend) - Transactional email with templates and domain management
- **Experiments & Feature Flags** - A/B testing and progressive rollouts
- **Notifications** (Twilio) - SMS, in-app, and push notifications with preferences

### Core Features

- **Multi-Tenant Platform** - Unlimited storefronts with isolated data and custom domains
- **Super Admin Console** - Platform-wide management and analytics
- **Tenant Admin Workspace** - Full-featured workspace for tenant owners
- **Self-Service Signup** - Automated tenant provisioning

### Workspace Features (Available to Tenant Owners)

- **Encrypted Vault** - Zero-knowledge encrypted file storage
- **Notes** - Personal knowledge management with templates and graph view
- **AI Chat** - AI assistant with context and memory
- **Knowledge Base** - Facts and document management
- **API Keys** - Integration key management
- **Workflows** - Projects and task management

### AI Governance & Operations

- **AI Cost Analytics** - Token usage tracking, budgets, and optimization recommendations
- **Drift Detection** - Automated detection of model behavior changes with baselines
- **Quality Scoring** - Automated evaluation of AI output quality across dimensions
- **AI Workers** - Chief of Staff (weekly planning), Ops Worker (decision → tasks), and more
- **HITL (Human-in-the-Loop)** - Review queues, risk evaluation, and QA sampling
- **Policy Engine** - Rule-based content policies with preview and lint tools

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Storage**: Cloudflare R2
- **Email**: Resend
- **SMS**: Twilio
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

### Development URLs

| URL | Purpose |
|-----|---------|
| `localhost:3000` | Marketing site |
| `app.localhost:3000` | Super admin console |
| `mars.localhost:3000` | Internal tenant (Open People workspace) |
| `demo.localhost:3000` | Demo tenant |

### Seeding the Mars Tenant

To set up the internal Open People workspace:

```bash
# Apply database migrations
supabase db push

# Seed the mars tenant and owner user
node scripts/seed-mars-tenant.js
```

Then access `mars.localhost:3000/admin` to use the workspace.

## Project Structure

```
open_people/
├── app/
│   ├── (marketing)/        # Public marketing pages
│   │   ├── page.tsx        # Landing page
│   │   ├── login/          # Login page
│   │   └── signup/         # Self-service signup
│   ├── (platform)/         # Tenant application
│   │   └── admin/          # Tenant admin workspace
│   │       ├── layout.tsx  # Sidebar navigation
│   │       ├── page.tsx    # Dashboard
│   │       ├── vault/      # Encrypted vault
│   │       ├── keys/       # API key management
│   │       ├── notes/      # Notes, templates, graph
│   │       ├── chat/       # AI chat, profile, settings
│   │       ├── knowledge/  # Facts and documents
│   │       ├── workflows/  # Projects and tasks
│   │       ├── storage/    # Cloud storage management
│   │       ├── email/      # Email management
│   │       ├── experiments/# A/B testing dashboard
│   │       ├── notifications/ # Notification management
│   │       ├── ai/         # AI governance (costs, drift, quality)
│   │       ├── hitl/       # Human-in-the-loop review
│   │       ├── ops/        # Ops worker decisions
│   │       ├── policies/   # Policy engine
│   │       └── chief-of-staff/ # Weekly planning
│   ├── super-admin/        # Platform admin dashboard
│   │   ├── tenants/        # Tenant management
│   │   ├── storage/        # Storage add-on metrics
│   │   ├── email/          # Email add-on metrics
│   │   ├── experiments/    # Experiments add-on metrics
│   │   ├── notifications/  # Notifications add-on metrics
│   │   ├── analytics/      # Platform analytics
│   │   ├── billing/        # Revenue overview
│   │   └── settings/       # Platform settings
│   └── api/                # API routes
│       ├── storage/        # Storage API
│       ├── email/          # Email API
│       ├── experiments/    # Experiments API
│       ├── notifications/  # Notifications API
│       ├── ai/             # AI governance APIs (costs, drift, quality, jobs)
│       ├── hitl/           # Human-in-the-loop APIs
│       ├── ops/            # Ops worker APIs (ingest, propose, commit)
│       ├── policies/       # Policy engine APIs (lint, preview, test)
│       ├── events/         # Event system APIs
│       ├── risk/           # Risk evaluation APIs
│       └── v1/             # External API (OpenAI-compatible chat)
├── components/             # Shared UI components
│   └── workspace/          # Reusable workspace components
│       ├── notes/          # NotesListView
│       └── chat/           # ChatView
├── lib/                    # Utilities and helpers
│   ├── supabase/           # Supabase clients
│   ├── storage/            # R2 storage client
│   ├── email/              # Resend email client + IMAP/POP3/SMTP
│   ├── experiments/        # Experiments SDK
│   ├── notifications/      # Notifications client
│   ├── ai/                 # AI workers, prompts, jobs
│   ├── hitl/               # HITL service and QA sampling
│   ├── ops/                # Ops worker service
│   ├── policy/             # Policy evaluator, lint, preview
│   ├── risk/               # Risk aggregation and scoring
│   ├── events/             # Event dispatcher and handlers
│   ├── gateway/            # AI gateway router
│   ├── cache/              # Semantic cache with invalidation
│   ├── rag/                # RAG and PII scanning
│   └── tenant.ts           # Tenant resolution
├── scripts/               # Setup and maintenance
│   └── seed-mars-tenant.js # Mars tenant seeding
├── supabase/              # Database migrations
└── types/                 # TypeScript definitions
```

## Architecture

OpenPeople.ai uses a multi-tenant architecture where:

1. **Marketing site** (`openpeople.ai`, `www.openpeople.ai`) - Public landing pages
2. **Tenant sites** (`{slug}.openpeople.ai` or custom domains) - Individual storefronts
3. **Super admin** (`app.openpeople.ai`) - Platform management
4. **Internal tenant** (`mars.openpeople.ai`) - Open People's own workspace

Domain routing is handled in middleware, with tenant resolution based on:
- Custom domain lookup (highest priority)
- Subdomain extraction
- Default tenant fallback

### Tenant Admin

Each tenant has access to a full workspace at `/admin` with feature-gated modules:
- Dashboard with stats and quick actions
- All enabled product add-ons
- Personal tools (vault, notes, AI chat, knowledge, workflows)

Access is controlled by user role (`owner`, `admin`) and tenant feature flags.

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

### Notifications

SMS via Twilio, in-app notifications, and push (coming soon).

**Pricing**: $0-249/month
- Free: 50 SMS/month, 500 in-app/month
- Starter ($29/mo): 1K SMS, 10K in-app, 5K push
- Pro ($99/mo): 10K SMS, 100K in-app, 50K push
- Enterprise ($249/mo): Unlimited

**Environment Variables**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

**Usage**:

```typescript
import { sendSMS, sendInAppNotification } from '@/lib/notifications/client';

// Send SMS
await sendSMS('+1234567890', 'Your order has shipped!');

// Send SMS with template
await sendSMS('+1234567890', '', {
  templateId: 'order-confirmation',
  templateVariables: {
    name: 'John',
    order_number: '12345',
  },
});

// Send in-app notification
await sendInAppNotification(
  'user-uuid',
  'New Message',
  'You have a new message from support.',
  { actionUrl: '/messages' }
);
```

**Inbox API**:

```typescript
import { fetchInbox, markAsRead, markAllAsRead } from '@/lib/notifications/client';

// Fetch user's notifications
const { notifications, unread } = await fetchInbox({ unreadOnly: true });

// Mark as read
await markAsRead(['notif-id-1', 'notif-id-2']);

// Mark all as read
await markAllAsRead();
```

**API Endpoints**:
- `POST /api/notifications/send` - Send SMS or in-app notification
- `GET /api/notifications/inbox` - Fetch user's in-app notifications
- `PUT /api/notifications/inbox` - Mark notifications as read
- `GET /api/notifications/preferences` - Fetch user preferences
- `PUT /api/notifications/preferences` - Update user preferences
- `POST /api/notifications/webhooks?provider=twilio` - Twilio status callbacks

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

# Twilio (Notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

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
