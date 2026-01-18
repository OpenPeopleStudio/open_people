# OpenPeople.ai

AI-powered commerce infrastructure for ambitious retail brands.

## Overview

OpenPeople.ai is a multi-tenant SaaS platform that provides:

- **AI Inventory Intelligence** - Predictive stock management, restock alerts, pricing optimization
- **Intelligent Customer Chat** - 24/7 AI-powered sales conversations with human handoff
- **Predictive Analytics** - Demand forecasting, trend detection, customer insights
- **Multi-Tenant Platform** - Unlimited storefronts with isolated data and custom domains
- **Flexible Payments** - Stripe cards + NOWPayments crypto

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **AI**: OpenAI GPT-4

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/open_people.git
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
│   ├── (marketing)/      # Public marketing pages (coming soon)
│   │   ├── page.tsx      # Landing page
│   │   ├── pricing/      # Pricing page
│   │   └── signup/       # Self-service signup
│   ├── (platform)/       # Tenant application (from 709exclusive)
│   └── super-admin/      # Platform admin dashboard
├── components/           # Shared UI components
├── lib/                  # Utilities and helpers
├── supabase/            # Database migrations
└── types/               # TypeScript definitions
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

## Environment Variables

See `.env.local.example` for all required variables.

## Deployment

The project is configured for Vercel deployment:

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Related Projects

- [709exclusive](https://github.com/yourusername/709exclusive) - The original multi-tenant codebase

## License

Proprietary - All rights reserved
