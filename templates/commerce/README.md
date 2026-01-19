# Commerce Template

A fully-featured, white-label e-commerce platform built with Next.js 16, React 19, and Supabase. This template is designed for easy customization and multi-tenant deployment.

## Features

- **Full E-commerce Functionality**
  - Product catalog with variants (size, condition, color)
  - Shopping cart with inventory reservation
  - Checkout with Stripe and cryptocurrency payments
  - Order management and fulfillment
  - Drops (scheduled product releases with countdowns)
  - Wishlist and stock alerts
  - Consignment management

- **White-Label Ready**
  - Fully configurable branding (logo, colors, typography)
  - Customizable hero content and feature cards
  - Configurable social links and contact information
  - Tenant-specific search terms and featured keywords
  - Dynamic copyright and legal links

- **Multi-Tenant Architecture**
  - Subdomain and custom domain routing
  - Per-tenant feature flags
  - Row-level security (RLS) for data isolation
  - Tenant-specific settings stored in database

- **Modern Tech Stack**
  - Next.js 16 with App Router
  - React 19 with Server Components
  - Tailwind CSS v4 with CSS variables
  - Supabase for database, auth, and realtime
  - TypeScript throughout

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public
   ```

3. **Run database migrations**
   ```bash
   # Apply migrations in order from /sql directory
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Customization Guide

### Tenant Settings Structure

All customization is done through the `settings` JSONB column in the `tenants` table:

```typescript
type TenantSettings = {
  // Branding
  theme?: {
    brand_name?: string          // Display name
    logo_url?: string            // Logo image URL
    colors?: TenantThemeColors   // Color palette
    typography?: TenantTypography // Font settings
  }
  
  // Homepage content
  content?: {
    hero?: {
      eyebrow?: string           // Small text above headline
      headline?: string          // Main headline
      subhead?: string           // Supporting text
      primary_cta?: { label: string; href: string }
      secondary_cta?: { label: string; href: string }
    }
    features?: Array<{
      title: string
      description: string
      icon?: string
    }>
  }
  
  // Feature toggles
  features?: {
    drops?: boolean              // Scheduled releases
    wishlist?: boolean           // Save for later
    messages?: boolean           // Customer messaging
    e2e_encryption?: boolean     // Encrypted messages
    crypto_payments?: boolean    // Cryptocurrency checkout
    local_delivery?: boolean     // Local delivery option
    pickup?: boolean             // Store pickup
    admin?: boolean              // Admin panel access
    consignments?: boolean       // Consignment tracking
  }
  
  // Contact information
  contact?: {
    email?: string               // Support email
    phone?: string               // Phone number
    address?: string             // Street address
    city?: string                // City name
    region?: string              // State/Province
    country?: string             // Country
  }
  
  // Social media links
  social?: {
    instagram?: string           // Full URL
    twitter?: string
    tiktok?: string
    facebook?: string
    youtube?: string
  }
  
  // Search configuration
  search?: {
    placeholder?: string         // Search input placeholder
    popular_terms?: string[]     // Quick search suggestions
    featured_keywords?: string[] // Keywords for homepage sorting
  }
  
  // Legal/copyright
  legal?: {
    company_name?: string        // Legal company name
    privacy_url?: string         // Privacy policy URL
    terms_url?: string           // Terms of service URL
    copyright_text?: string      // Custom copyright text
  }
  
  // Payment/integration settings
  integrations?: {
    payments?: {
      provider?: 'stripe' | 'manual'
      crypto_provider?: 'nowpayments' | 'disabled'
    }
    email?: {
      provider?: 'sendgrid' | 'postmark' | 'resend' | 'disabled'
    }
    sms?: {
      provider?: 'twilio' | 'disabled'
    }
  }
  
  // Commerce settings
  commerce?: {
    currency?: string            // e.g., 'USD', 'CAD', 'EUR'
  }
  
  // Email configuration
  email?: {
    from_name?: string           // Sender display name
    from_email?: string          // Sender email address
    support_email?: string       // Support inbox
    orders_email?: string        // Orders inbox
    reply_to?: string            // Reply-to address
  }
  
  // Regional settings
  regional?: {
    ship_from_city?: string      // Shipping origin city
    ship_from_region?: string    // Shipping origin state/province
    ship_from_country?: string   // Shipping origin country
    ship_from_coordinates?: [number, number]  // Map center [lat, lng]
    local_delivery_postal_prefixes?: string[] // Postal codes for local delivery
    phone_country_code?: string  // e.g., '+1'
    timezone?: string            // e.g., 'America/New_York'
  }
  
  // Storefront terminology
  storefront?: {
    product_term_singular?: string  // e.g., 'sneaker', 'product'
    product_term_plural?: string    // e.g., 'sneakers', 'products'
    brand_term?: string             // e.g., 'brand', 'designer'
    category_term?: string          // e.g., 'category', 'collection'
  }
  
  // PWA (Progressive Web App) settings
  pwa?: {
    app_name?: string            // Full app name
    app_short_name?: string      // Short name for home screen
    app_description?: string     // App description
    theme_color?: string         // Browser theme color
    background_color?: string    // Splash screen background
  }
}
```

### Theme Colors

The following CSS variables can be customized via `theme.colors`:

| Setting | CSS Variable | Description |
|---------|--------------|-------------|
| `bg_primary` | `--bg-primary` | Main background |
| `bg_secondary` | `--bg-secondary` | Secondary background |
| `bg_tertiary` | `--bg-tertiary` | Tertiary background |
| `bg_elevated` | `--bg-elevated` | Elevated surfaces |
| `text_primary` | `--text-primary` | Primary text |
| `text_secondary` | `--text-secondary` | Secondary text |
| `text_muted` | `--text-muted` | Muted/disabled text |
| `accent` | `--accent` | Primary accent color |
| `accent_hover` | `--accent-hover` | Accent hover state |
| `border_primary` | `--border-primary` | Primary borders |
| `success` | `--success` | Success state |
| `warning` | `--warning` | Warning state |
| `error` | `--error` | Error state |

### Example Tenant Configuration

```json
{
  "theme": {
    "brand_name": "Urban Kicks",
    "logo_url": "https://example.com/logo.png",
    "colors": {
      "accent": "#FF6B35",
      "accent_hover": "#FF8555"
    }
  },
  "content": {
    "hero": {
      "eyebrow": "Premium Sneakers",
      "headline": "Step Into Style",
      "subhead": "Authentic streetwear with free local delivery",
      "primary_cta": { "label": "Shop Now", "href": "/shop" }
    }
  },
  "features": {
    "drops": true,
    "wishlist": true,
    "crypto_payments": false,
    "local_delivery": true
  },
  "contact": {
    "email": "hello@urbankicks.com",
    "city": "Toronto",
    "region": "ON"
  },
  "social": {
    "instagram": "https://instagram.com/urbankicks",
    "tiktok": "https://tiktok.com/@urbankicks"
  },
  "search": {
    "placeholder": "Search kicks...",
    "popular_terms": ["Jordan", "Nike", "Adidas", "New Balance"],
    "featured_keywords": ["Jordan 1", "Dunk Low", "Yeezy"]
  },
  "legal": {
    "company_name": "Urban Kicks Inc.",
    "copyright_text": "© 2026 Urban Kicks. Made with love in Toronto."
  },
  "commerce": {
    "currency": "CAD"
  }
}
```

## Directory Structure

```
templates/commerce/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── account/           # Customer account pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── policies/          # Store policies
│   ├── product/           # Product pages
│   ├── shop/              # Shop/catalog
│   └── super-admin/       # Super admin panel
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── inbox/            # Messaging components
│   ├── staff/            # Staff components
│   └── ui/               # Reusable UI components
├── context/              # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Business logic
│   ├── crypto/          # Cryptocurrency utilities
│   ├── email/           # Email templates
│   └── workflows/       # Business workflows
├── public/              # Static assets
├── sql/                 # Database migrations
└── types/               # TypeScript types
```

## Database Schema

The template uses Supabase with the following key tables:

- `tenants` - Tenant configuration
- `tenant_domains` - Custom domain mappings
- `709_profiles` - User profiles (per tenant)
- `products` - Product catalog
- `product_variants` - Size/condition variants
- `product_images` - Product images
- `orders` - Customer orders
- `order_items` - Order line items
- `inventory_audit` - Inventory tracking
- `messages` - Customer messaging

## Deployment

### Vercel (Recommended)

1. Connect your repo to Vercel
2. Set environment variables
3. Deploy

### Self-Hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the server:
   ```bash
   npm start
   ```

## Admin Panel

Access the admin panel at `/admin` (requires owner/admin/staff role).

Features:
- Product management
- Inventory tracking
- Order fulfillment
- Customer messaging
- Analytics dashboard
- Team management
- Tenant settings

### Tenant Settings UI (`/admin/tenant-settings`)

The admin panel includes a comprehensive settings interface with the following tabs:

| Tab | Settings Available |
|-----|-------------------|
| **General** | Brand name, logo upload, custom domains |
| **Store Info** | Contact details (email, phone, address), social media links, search configuration, legal/footer settings, currency |
| **Customization** | Hero content (headline, subhead, CTAs), color theme presets & custom colors, typography settings |
| **Policies** | Markdown editor for shipping, returns, authenticity, privacy, and terms pages with placeholder support |
| **Features** | Toggle 9 feature flags (drops, wishlist, messages, crypto payments, etc.) |
| **Integrations** | Payment providers, email providers, delivery settings |
| **Advanced** | Email sender configuration, regional/shipping settings, product terminology, PWA configuration |
| **Subscription** | Plan management, billing history |

## Super Admin

For platform operators, access `/super-admin` to manage:
- All tenants
- Platform billing
- System settings
- Support tools

## License

This template is part of the OpenPeople platform.
