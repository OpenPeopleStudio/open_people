/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Types
   Matches the 709exclusive tenant schema for compatibility
   ═══════════════════════════════════════════════════════════════════════════ */

export type TenantFeatureFlags = {
  drops?: boolean;
  wishlist?: boolean;
  messages?: boolean;
  e2e_encryption?: boolean;
  crypto_payments?: boolean;
  local_delivery?: boolean;
  pickup?: boolean;
  admin?: boolean;
  consignments?: boolean;
  // AI features for OpenPeople.ai
  ai_inventory?: boolean;
  ai_chat?: boolean;
  ai_analytics?: boolean;
};

export type TenantThemeColors = {
  bg_primary?: string;
  bg_secondary?: string;
  bg_tertiary?: string;
  bg_elevated?: string;
  text_primary?: string;
  text_secondary?: string;
  text_muted?: string;
  accent?: string;
  accent_hover?: string;
  accent_muted?: string;
  accent_blue?: string;
  accent_blue_hover?: string;
  accent_amber?: string;
  accent_amber_hover?: string;
  border_primary?: string;
  border_secondary?: string;
  success?: string;
  warning?: string;
  error?: string;
};

export type TenantTypography = {
  product_card?: {
    font_family?: string;
    brand_size?: string;
    name_size?: string;
    price_size?: string;
    spacing?: string;
  };
  headings?: {
    font_family?: string;
  };
  body?: {
    font_family?: string;
  };
};

export type TenantTheme = {
  brand_name?: string;
  logo_url?: string | null;
  colors?: TenantThemeColors;
  typography?: TenantTypography;
};

export type TenantHeroContent = {
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  primary_cta?: { label: string; href: string };
  secondary_cta?: { label: string; href: string };
};

export type TenantFeatureCard = {
  title: string;
  description: string;
  icon?: string;
};

export type TenantContent = {
  hero?: TenantHeroContent;
  features?: TenantFeatureCard[];
};

export type TenantIntegrations = {
  payments?: {
    provider?: "stripe" | "manual";
    crypto_provider?: "nowpayments" | "disabled";
  };
  email?: {
    provider?: "sendgrid" | "postmark" | "resend" | "disabled";
  };
  sms?: {
    provider?: "twilio" | "disabled";
  };
  delivery?: {
    provider?: "internal" | "manual";
  };
  ai?: {
    provider?: "openai" | "anthropic" | "disabled";
    model?: string;
  };
};

export type TenantCommerce = {
  currency?: string;
};

export type TenantSettings = {
  theme?: TenantTheme;
  content?: TenantContent;
  features?: TenantFeatureFlags;
  integrations?: TenantIntegrations;
  commerce?: TenantCommerce;
};

export type TenantContextValue = {
  id: string;
  slug: string;
  name: string;
  primary_domain?: string | null;
  settings: TenantSettings;
  status: "active" | "inactive" | "suspended";
};

export type TenantBilling = {
  tenant_id: string;
  plan: "starter" | "pro" | "enterprise" | string;
  status: "trialing" | "active" | "past_due" | "canceled";
  billing_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantDomain = {
  id: string;
  tenant_id: string;
  domain: string;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
};
