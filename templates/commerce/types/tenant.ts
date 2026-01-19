export type TenantFeatureFlags = {
  drops?: boolean
  wishlist?: boolean
  messages?: boolean
  e2e_encryption?: boolean
  crypto_payments?: boolean
  local_delivery?: boolean
  pickup?: boolean
  admin?: boolean
  consignments?: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════
   White-label Configuration Types
   Extended settings for multi-tenant commerce customization
   ═══════════════════════════════════════════════════════════════════════════ */

export type TenantContact = {
  email?: string
  phone?: string
  address?: string
  city?: string
  region?: string
  country?: string
}

export type TenantSocial = {
  instagram?: string
  twitter?: string
  tiktok?: string
  facebook?: string
  youtube?: string
}

export type TenantSearch = {
  placeholder?: string
  popular_terms?: string[]
  featured_keywords?: string[]
}

export type TenantLegal = {
  company_name?: string
  privacy_url?: string
  terms_url?: string
  copyright_text?: string
}

export type TenantEmailConfig = {
  from_name?: string
  from_email?: string
  support_email?: string
  orders_email?: string
  reply_to?: string
}

export type TenantRegional = {
  ship_from_city?: string
  ship_from_region?: string
  ship_from_country?: string
  ship_from_coordinates?: [number, number]
  local_delivery_postal_prefixes?: string[]
  phone_country_code?: string
  timezone?: string
}

export type TenantStorefront = {
  product_term_singular?: string   // e.g., "sneaker", "product", "item"
  product_term_plural?: string     // e.g., "sneakers", "products", "items"
  brand_term?: string              // e.g., "brand", "designer", "maker"
  category_term?: string           // e.g., "category", "collection", "type"
}

export type TenantPWA = {
  app_name?: string
  app_short_name?: string
  app_description?: string
  theme_color?: string
  background_color?: string
}

export type TenantPolicyPage = {
  enabled?: boolean
  title?: string
  content?: string              // Markdown content
  last_updated?: string         // ISO date string
}

export type TenantPolicies = {
  shipping?: TenantPolicyPage
  returns?: TenantPolicyPage
  authenticity?: TenantPolicyPage
  privacy?: TenantPolicyPage
  terms?: TenantPolicyPage
}

export type TenantThemeColors = {
  bg_primary?: string
  bg_secondary?: string
  bg_tertiary?: string
  bg_elevated?: string
  text_primary?: string
  text_secondary?: string
  text_muted?: string
  accent?: string
  accent_hover?: string
  accent_muted?: string
  accent_blue?: string
  accent_blue_hover?: string
  accent_amber?: string
  accent_amber_hover?: string
  border_primary?: string
  border_secondary?: string
  success?: string
  warning?: string
  error?: string
}

export type TenantTypography = {
  product_card?: {
    font_family?: string
    brand_size?: string
    name_size?: string
    price_size?: string
    spacing?: string
  }
  headings?: {
    font_family?: string
  }
  body?: {
    font_family?: string
  }
}

export type TenantTheme = {
  brand_name?: string
  logo_url?: string | null
  colors?: TenantThemeColors
  typography?: TenantTypography
}

export type TenantHeroContent = {
  eyebrow?: string
  headline?: string
  subhead?: string
  primary_cta?: { label: string; href: string }
  secondary_cta?: { label: string; href: string }
}

export type TenantFeatureCard = {
  title: string
  description: string
  icon?: string
}

export type TenantContent = {
  hero?: TenantHeroContent
  features?: TenantFeatureCard[]
}

export type TenantIntegrations = {
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
  delivery?: {
    provider?: 'internal' | 'manual'
  }
}

export type TenantCommerce = {
  currency?: string
}

export type TenantSettings = {
  theme?: TenantTheme
  content?: TenantContent
  features?: TenantFeatureFlags
  integrations?: TenantIntegrations
  commerce?: TenantCommerce
  // White-label customization
  contact?: TenantContact
  social?: TenantSocial
  search?: TenantSearch
  legal?: TenantLegal
  // Advanced white-label
  email?: TenantEmailConfig
  regional?: TenantRegional
  storefront?: TenantStorefront
  pwa?: TenantPWA
  policies?: TenantPolicies
}

export type TenantContextValue = {
  id: string
  slug: string
  name: string
  primary_domain?: string | null
  settings: TenantSettings
  status: 'active' | 'inactive' | 'suspended'
}
