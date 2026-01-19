# Restaurant Website Template

A modern, minimal restaurant website template built with Next.js 15, React 19, and TypeScript. Designed for white-label deployment with comprehensive customization options.

## Features

### Landing Page
- Scroll-snap sections with elegant animations
- Customizable hero with headline and tagline
- About, Philosophy, and Status sections
- Newsletter signup with optional message
- Fully responsive design
- Reduced motion support

### Menu System
- Categorized menu items with descriptions
- Optional price display
- Dietary indicators (vegetarian, vegan, GF, etc.)
- Featured items highlighting
- Available time slots per category

### Reservations
- Built-in reservation form
- Support for external providers (OpenTable, Resy, etc.)
- Configurable party size limits
- Special requests field
- Cancellation policy display

### Contact & Location
- Business hours display
- Location with map link
- Multiple contact emails (general, press, events)
- Social media links

### Careers
- Job listings with descriptions
- Application email or external form
- Position types (full-time, part-time, seasonal)

### Admin Dashboard
- Brand & theme customization
- Content editing for all sections
- Feature toggles
- Hours and location management
- Social media configuration

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS Custom Properties

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run development server:
```bash
npm run dev
```

## Configuration

### TenantSettings Structure

```typescript
{
  theme: {
    name: string           // Restaurant name
    tagline: string        // Short tagline
    logo_url: string       // Logo image URL
    colors: {
      bg_primary: string   // Main background (#f5f5f0)
      text_primary: string // Primary text (#1a1a1a)
      text_secondary: string
      accent: string
    }
    typography: {
      font_primary: string // Body font
      font_display: string // Headings font
      text_transform: 'lowercase' | 'none' | 'uppercase'
    }
  }
  
  content: {
    hero: {
      headline: string     // Supports <br> for line breaks
      subheadline: string
      cta_primary: { label, href }
      cta_secondary: { label, href }
    }
    about: { title, content }
    philosophy: { enabled, title, content }
    status: { enabled, title, content }
  }
  
  features: {
    reservations: boolean
    newsletter: boolean
    careers: boolean
    events: boolean
    menu_prices: boolean
    gallery: boolean
    online_ordering: boolean
    gift_cards: boolean
    private_dining: boolean
  }
  
  location: {
    address_line1: string
    city: string
    region: string
    postal_code: string
    country: string
    phone: string
    email: string
    hours: BusinessHours[]
    coordinates: { lat, lng }
  }
  
  menu: {
    enabled: boolean
    show_prices: boolean
    currency_symbol: string
    categories: MenuCategory[]
    disclaimer: string
  }
  
  reservations: {
    enabled: boolean
    provider: 'internal' | 'opentable' | 'resy' | 'external'
    external_url: string
    max_party_size: number
    cancellation_policy: string
  }
  
  social: {
    instagram: string
    facebook: string
    twitter: string
    yelp: string
  }
  
  careers: {
    enabled: boolean
    title: string
    description: string
    positions: Position[]
    application_email: string
  }
  
  newsletter: {
    enabled: boolean
    title: string
    description: string
    success_message: string
    allow_message: boolean
  }
}
```

## Admin Settings Tabs

| Tab | Settings |
|-----|----------|
| **General** | Brand name, tagline, logo, colors, typography |
| **Content** | Hero, about, philosophy, status sections, newsletter text |
| **Menu** | Prices visibility, currency, disclaimer |
| **Hours & Location** | Address, phone, email, business hours |
| **Reservations** | Enable/disable, provider, max party size, policies |
| **Features** | Toggle all major features on/off |
| **Social** | Instagram, Facebook, Twitter, Yelp links |
| **Careers** | Page title, description, application email |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/subscribe` | POST | Newsletter signup |
| `/api/reservations` | POST | Create reservation |
| `/api/reservations` | GET | List reservations (admin) |
| `/api/admin/settings` | GET | Get tenant settings |
| `/api/admin/settings` | PATCH | Update tenant settings |

## Pages

- `/` - Landing page
- `/menu` - Menu page
- `/contact` - Contact & reservations
- `/careers` - Job listings
- `/admin/settings` - Admin dashboard

## Customization Guide

### 1. Brand Colors
Update theme colors in admin or directly in settings:
- `bg_primary`: Main background (default: #f5f5f0 - warm white)
- `text_primary`: Main text (default: #1a1a1a - near black)
- `text_secondary`: Secondary text (default: #666)

### 2. Typography Style
Choose text transform:
- `lowercase` - Modern, casual feel (default)
- `none` - Traditional capitalization
- `uppercase` - Bold, formal feel

### 3. Content Sections
All content supports `<br>` tags for line breaks.

### 4. Feature Flags
Enable/disable features based on restaurant needs:
- Pre-opening: Disable reservations, enable newsletter
- Fully open: Enable reservations, menu prices
- Hiring: Enable careers page

## Database Schema

When connecting to Supabase, create these tables:

```sql
-- Email signups
CREATE TABLE email_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  message TEXT,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL,
  special_requests TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant settings (for multi-tenant)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Deployment

### Vercel
1. Connect your repository to Vercel
2. Set environment variables
3. Deploy

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## License

MIT
