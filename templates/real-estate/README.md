# Real Estate Agent Template

A comprehensive white-label real estate website template built for real estate agents, teams, and brokerages. Features property listings, lead management, appointment scheduling, transaction tracking, and CRM capabilities.

## Features

### 🏠 Property Management
- **Property Listings**: Create and manage property listings with photos, videos, and virtual tours
- **MLLS Integration**: Import properties from MLS feeds
- **Advanced Search**: Filter by price, location, property type, features, and more
- **Property Analytics**: Track views, favorites, and engagement metrics

### 👥 Lead Management & CRM
- **Lead Capture**: Website forms, social media, and referral tracking
- **Lead Scoring**: AI-powered lead qualification and prioritization
- **Communication Hub**: Email, SMS, and in-app messaging
- **Pipeline Management**: Track leads through the buying/selling process

### 📅 Appointment Scheduling
- **Calendar Integration**: Sync with Google Calendar, Outlook, and iCal
- **Showing Management**: Schedule property showings with automated reminders
- **Availability Management**: Set agent availability and buffer times
- **Confirmation System**: Automated confirmation requests and follow-ups

### 💼 Transaction Management
- **Deal Tracking**: Monitor contracts, offers, and closing progress
- **Document Management**: Secure storage for contracts, disclosures, and paperwork
- **Commission Tracking**: Calculate and track commission earnings
- **Closing Timeline**: Automated reminders for important dates

### 📊 Analytics & Insights
- **Market Analysis**: Local market trends and comparables
- **Performance Metrics**: Conversion rates, days on market, sale-to-list ratios
- **Lead Source Tracking**: ROI analysis for marketing campaigns
- **Custom Reports**: Generate reports for management and clients

### 🎨 White-Label Customization
- **Brand Customization**: Logo, colors, fonts, and messaging
- **Domain Setup**: Custom domains with SSL certificates
- **SEO Optimization**: Property pages optimized for search engines
- **Mobile Responsive**: Fully responsive design for all devices

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Styling**: Tailwind CSS v4
- **Maps**: Leaflet with React integration
- **Calendar**: React Big Calendar
- **File Uploads**: React Dropzone
- **AI**: OpenAI integration for lead scoring and market analysis

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
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
   ```

3. **Run database migrations**
   ```bash
   # Apply migrations in order from /sql directory
   npm run migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Database Schema

The template uses a comprehensive database schema:

- `real_estate_profiles` - Agent profiles with licensing and brokerage info
- `properties` - Property listings with full details and media
- `property_images` - Property photo management
- `leads` - Client and prospect management
- `appointments` - Showing and meeting scheduling
- `transactions` - Deal and contract management
- `market_data` - Local market analytics
- `real_estate_messages` - Communication tracking

## Admin Dashboard

Access the admin panel at `/admin` with features for:

### Property Management
- Add/edit property listings
- Upload and manage photos/videos
- Set pricing and availability
- Track listing performance

### Lead Management
- View and qualify leads
- Schedule appointments
- Send follow-up communications
- Track conversion funnel

### Transaction Management
- Create new transactions
- Upload and manage documents
- Set important dates and reminders
- Track commission calculations

### Analytics & Reports
- View key performance metrics
- Generate custom reports
- Analyze market trends
- Track marketing ROI

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | GET | List/search properties |
| `/api/properties/[id]` | GET | Get property details |
| `/api/leads` | POST | Create new lead |
| `/api/leads/[id]` | PUT | Update lead information |
| `/api/appointments` | POST | Schedule appointment |
| `/api/messages` | POST | Send message |
| `/api/market-data` | GET | Get market analytics |

## Customization Guide

### Tenant Settings Structure

All customization is managed through the `settings` JSONB column in the `tenants` table:

```typescript
type RealEstateSettings = {
  theme: {
    brand_name: string
    logo_url: string
    colors: {
      primary: string
      secondary: string
      accent: string
    }
  }
  contact: {
    name: string
    phone: string
    email: string
    address: string
    license_number: string
  }
  business: {
    brokerage_name: string
    specialties: string[]
    service_areas: string[]
  }
  features: {
    virtual_tours: boolean
    video_tours: boolean
    market_reports: boolean
    lead_scoring: boolean
  }
}
```

### Example Configuration

```json
{
  "theme": {
    "brand_name": "Smith Realty Group",
    "logo_url": "https://example.com/logo.png",
    "colors": {
      "primary": "#1a365d",
      "secondary": "#2d3748",
      "accent": "#3182ce"
    }
  },
  "contact": {
    "name": "Sarah Smith",
    "phone": "(555) 123-4567",
    "email": "sarah@smithrealty.com",
    "address": "123 Main St, Anytown, USA",
    "license_number": "CA-DRE-12345678"
  },
  "business": {
    "brokerage_name": "Premier Realty Partners",
    "specialties": ["Residential", "Commercial", "Investment Properties"],
    "service_areas": ["Anytown", "Nearby City", "Greater Metro Area"]
  }
}
```

## AI Integration

### Lead Scoring
Automatically score leads based on:
- Budget alignment with available properties
- Timeline urgency
- Communication quality
- Market knowledge
- Engagement level

### Market Analysis
- Local market trend analysis
- Price predictions
- Days on market forecasts
- Inventory level assessments
- Comparative market analysis

### Communication Assistance
- Automated follow-up emails
- Personalized property recommendations
- Market update newsletters
- Lead nurturing campaigns

## Deployment

### Vercel (Recommended)
1. Connect repository to Vercel
2. Set environment variables
3. Configure custom domain
4. Deploy

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (for AI features)
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key

# Email (optional - uses OpenPeople platform)
RESEND_API_KEY=your_resend_key

# SMS (optional - uses OpenPeople platform)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM_NUMBER=+1234567890
```

## License

This template is part of the OpenPeople.ai platform. See the main repository for licensing details.