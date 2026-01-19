/**
 * Restaurant Tenant Configuration Types
 * 
 * Comprehensive settings for white-label restaurant websites
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Core Feature Flags
   ═══════════════════════════════════════════════════════════════════════════ */

export type RestaurantFeatureFlags = {
  reservations?: boolean          // Enable reservation system
  online_ordering?: boolean       // Enable online ordering
  delivery?: boolean              // Enable delivery options
  takeout?: boolean               // Enable takeout/pickup
  events?: boolean                // Show events section
  careers?: boolean               // Show careers/hiring section
  gift_cards?: boolean            // Enable gift card purchases
  newsletter?: boolean            // Enable email newsletter signup
  gallery?: boolean               // Show photo gallery
  reviews?: boolean               // Show reviews/testimonials
  menu_prices?: boolean           // Show prices on menu
  private_dining?: boolean        // Private dining inquiries
}

/* ═══════════════════════════════════════════════════════════════════════════
   Brand & Theme Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

export type RestaurantThemeColors = {
  bg_primary?: string             // Main background (e.g., #f5f5f0)
  bg_secondary?: string           // Secondary background
  text_primary?: string           // Main text color (e.g., #1a1a1a)
  text_secondary?: string         // Secondary text (e.g., #666)
  text_muted?: string             // Muted/subtle text
  accent?: string                 // Brand accent color
  accent_hover?: string           // Accent hover state
  border?: string                 // Border color
  success?: string                // Success states
  error?: string                  // Error states
}

export type RestaurantTypography = {
  font_primary?: string           // Body font (e.g., 'Inter')
  font_display?: string           // Headings font (e.g., 'Darker Grotesque')
  font_accent?: string            // Special accent font
  text_transform?: 'none' | 'lowercase' | 'uppercase' | 'capitalize'
  base_size?: string              // Base font size
}

export type RestaurantTheme = {
  name?: string                   // Restaurant name
  tagline?: string                // Short tagline
  logo_url?: string | null        // Logo image URL
  favicon_url?: string | null     // Favicon URL
  og_image_url?: string | null    // Open Graph image
  colors?: RestaurantThemeColors
  typography?: RestaurantTypography
  style?: 'minimal' | 'classic' | 'modern' | 'rustic' | 'elegant'
}

/* ═══════════════════════════════════════════════════════════════════════════
   Content Sections
   ═══════════════════════════════════════════════════════════════════════════ */

export type HeroContent = {
  headline?: string               // Main headline (can include <br> for line breaks)
  subheadline?: string            // Below headline text
  background_image?: string       // Optional hero background
  background_video?: string       // Optional hero video
  cta_primary?: { label: string; href: string }
  cta_secondary?: { label: string; href: string }
}

export type AboutSection = {
  title?: string                  // Section title
  content?: string                // Main content (supports basic HTML)
  image_url?: string              // Optional image
  layout?: 'text-only' | 'text-image' | 'image-text'
}

export type PhilosophySection = {
  enabled?: boolean
  title?: string
  content?: string
}

export type ContentSection = {
  id: string
  title?: string
  content: string
  order: number
  enabled?: boolean
}

export type RestaurantContent = {
  hero?: HeroContent
  about?: AboutSection
  philosophy?: PhilosophySection
  status?: {
    enabled?: boolean
    title?: string
    content?: string              // Current status message
  }
  custom_sections?: ContentSection[]
  footer_text?: string
}

/* ═══════════════════════════════════════════════════════════════════════════
   Menu Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

export type MenuItem = {
  id: string
  name: string
  description?: string
  price?: number                  // Price in cents
  price_display?: string          // Custom price display (e.g., "Market Price")
  image_url?: string
  dietary?: ('vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'spicy')[]
  available?: boolean
  featured?: boolean
  order: number
}

export type MenuCategory = {
  id: string
  name: string
  description?: string
  items: MenuItem[]
  order: number
  available_times?: string[]      // e.g., ['lunch', 'dinner', 'brunch']
}

export type MenuConfig = {
  enabled?: boolean
  show_prices?: boolean
  currency?: string               // e.g., 'CAD', 'USD'
  currency_symbol?: string        // e.g., '$'
  categories?: MenuCategory[]
  disclaimer?: string             // e.g., "Prices subject to change"
  dietary_legend?: boolean        // Show dietary icons legend
}

/* ═══════════════════════════════════════════════════════════════════════════
   Location & Hours
   ═══════════════════════════════════════════════════════════════════════════ */

export type BusinessHours = {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  open?: string                   // e.g., "11:30"
  close?: string                  // e.g., "22:00"
  closed?: boolean
  note?: string                   // e.g., "Brunch only"
}

export type RestaurantLocation = {
  address_line1?: string
  address_line2?: string
  city?: string
  region?: string                 // State/Province
  postal_code?: string
  country?: string
  coordinates?: {
    lat: number
    lng: number
  }
  phone?: string
  email?: string
  hours?: BusinessHours[]
  special_hours_note?: string     // e.g., "Closed for private events"
}

/* ═══════════════════════════════════════════════════════════════════════════
   Reservations
   ═══════════════════════════════════════════════════════════════════════════ */

export type ReservationConfig = {
  enabled?: boolean
  provider?: 'internal' | 'opentable' | 'resy' | 'yelp' | 'tock' | 'sevenrooms' | 'external'
  external_url?: string           // For external booking links
  external_widget_id?: string     // Widget embed ID
  max_party_size?: number
  min_advance_hours?: number      // Minimum hours in advance
  max_advance_days?: number       // Maximum days in advance
  time_slot_interval?: number     // Minutes between slots (e.g., 15, 30)
  confirmation_email?: boolean
  reminder_email?: boolean
  special_requests_enabled?: boolean
  deposit_required?: boolean
  deposit_amount?: number         // In cents
  cancellation_policy?: string
}

/* ═══════════════════════════════════════════════════════════════════════════
   Social & Contact
   ═══════════════════════════════════════════════════════════════════════════ */

export type SocialLinks = {
  instagram?: string
  facebook?: string
  twitter?: string
  tiktok?: string
  youtube?: string
  yelp?: string
  tripadvisor?: string
  google_maps?: string
}

export type ContactConfig = {
  email?: string
  phone?: string
  press_email?: string
  events_email?: string
  careers_email?: string
  contact_form_enabled?: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════
   Newsletter / Email
   ═══════════════════════════════════════════════════════════════════════════ */

export type NewsletterConfig = {
  enabled?: boolean
  title?: string                  // e.g., "Stay Updated"
  description?: string            // e.g., "Join our mailing list"
  success_message?: string
  allow_message?: boolean         // Allow users to add a note
  provider?: 'internal' | 'mailchimp' | 'klaviyo' | 'convertkit'
  external_form_url?: string
}

/* ═══════════════════════════════════════════════════════════════════════════
   Events & Private Dining
   ═══════════════════════════════════════════════════════════════════════════ */

export type EventConfig = {
  enabled?: boolean
  upcoming_events?: {
    id: string
    title: string
    date: string                  // ISO date
    time?: string
    description?: string
    image_url?: string
    ticket_url?: string
    price?: number
    sold_out?: boolean
  }[]
}

export type PrivateDiningConfig = {
  enabled?: boolean
  description?: string
  min_guests?: number
  max_guests?: number
  inquiry_email?: string
  spaces?: {
    name: string
    capacity: number
    description?: string
    image_url?: string
  }[]
}

/* ═══════════════════════════════════════════════════════════════════════════
   Careers / Hiring
   ═══════════════════════════════════════════════════════════════════════════ */

export type CareersConfig = {
  enabled?: boolean
  title?: string
  description?: string
  positions?: {
    id: string
    title: string
    type?: 'full-time' | 'part-time' | 'seasonal'
    description?: string
    requirements?: string[]
    active?: boolean
  }[]
  application_email?: string
  application_form_url?: string
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gallery
   ═══════════════════════════════════════════════════════════════════════════ */

export type GalleryConfig = {
  enabled?: boolean
  images?: {
    id: string
    url: string
    alt?: string
    caption?: string
    category?: 'food' | 'interior' | 'team' | 'events' | 'other'
    order: number
  }[]
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEO & Analytics
   ═══════════════════════════════════════════════════════════════════════════ */

export type SEOConfig = {
  title?: string                  // Page title
  description?: string            // Meta description
  keywords?: string[]
  canonical_url?: string
  structured_data?: {
    cuisine_type?: string[]       // e.g., ['Canadian', 'Fine Dining']
    price_range?: '$' | '$$' | '$$$' | '$$$$'
    serves_cuisine?: string
  }
}

export type AnalyticsConfig = {
  google_analytics_id?: string
  google_tag_manager_id?: string
  facebook_pixel_id?: string
  custom_scripts?: string         // Custom tracking scripts
}

/* ═══════════════════════════════════════════════════════════════════════════
   Integrations
   ═══════════════════════════════════════════════════════════════════════════ */

export type IntegrationsConfig = {
  email_provider?: 'resend' | 'sendgrid' | 'postmark' | 'mailchimp'
  pos_system?: 'toast' | 'square' | 'clover' | 'lightspeed' | 'none'
  delivery_partners?: ('doordash' | 'ubereats' | 'grubhub' | 'skip')[]
}

/* ═══════════════════════════════════════════════════════════════════════════
   PWA Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

export type PWAConfig = {
  app_name?: string
  app_short_name?: string
  description?: string
  theme_color?: string
  background_color?: string
  display?: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Settings Type
   ═══════════════════════════════════════════════════════════════════════════ */

export type RestaurantSettings = {
  theme?: RestaurantTheme
  content?: RestaurantContent
  features?: RestaurantFeatureFlags
  menu?: MenuConfig
  location?: RestaurantLocation
  reservations?: ReservationConfig
  social?: SocialLinks
  contact?: ContactConfig
  newsletter?: NewsletterConfig
  events?: EventConfig
  private_dining?: PrivateDiningConfig
  careers?: CareersConfig
  gallery?: GalleryConfig
  seo?: SEOConfig
  analytics?: AnalyticsConfig
  integrations?: IntegrationsConfig
  pwa?: PWAConfig
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Context
   ═══════════════════════════════════════════════════════════════════════════ */

export type RestaurantTenantContext = {
  id: string
  slug: string
  name: string
  primary_domain?: string | null
  settings: RestaurantSettings
  status: 'active' | 'inactive' | 'coming_soon' | 'suspended'
}
