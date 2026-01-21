export interface TenantSettings {
  // Branding
  theme?: {
    agent_name?: string;
    agency_name?: string;
    logo_url?: string;
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
    typography?: {
      font_primary?: string;
      font_headline?: string;
    };
  };

  // Hero content
  hero?: {
    headline?: string;
    subheadline?: string;
    background_image?: string;
    cta_primary?: { label: string; href: string };
    cta_secondary?: { label: string; href: string };
  };

  // Agent information
  agent?: {
    name?: string;
    title?: string;
    bio?: string;
    photo_url?: string;
    license_number?: string;
    specialties?: string[];
    languages?: string[];
    experience_years?: number;
  };

  // Contact information
  contact?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      country?: string;
    };
    social_media?: {
      linkedin?: string;
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
    };
  };

  // Services offered
  services?: {
    residential_sales?: boolean;
    commercial_sales?: boolean;
    property_management?: boolean;
    consulting?: boolean;
    investment_analysis?: boolean;
    market_analysis?: boolean;
  };

  // Market area
  market_area?: {
    cities?: string[];
    counties?: string[];
    zip_codes?: string[];
    radius_miles?: number;
  };

  // Features
  features?: {
    property_search?: boolean;
    virtual_tours?: boolean;
    market_reports?: boolean;
    lead_capture?: boolean;
    appointment_scheduling?: boolean;
    document_management?: boolean;
  };

  // Integrations
  integrations?: {
    mls_provider?: string;
    crm_system?: string;
    email_provider?: 'resend' | 'sendgrid' | 'postmark';
    calendar_provider?: 'google' | 'outlook';
  };

  // Legal and compliance
  legal?: {
    company_name?: string;
    license_info?: string;
    privacy_policy_url?: string;
    terms_of_service_url?: string;
  };
}

export interface Property {
  id: string;
  mls_number?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
  };
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  property_type: 'house' | 'condo' | 'townhouse' | 'land' | 'commercial';
  listing_type: 'sale' | 'rent' | 'lease';
  status: 'active' | 'pending' | 'sold' | 'off_market';
  description: string;
  images: string[];
  virtual_tour_url?: string;
  year_built?: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  property_interest?: string;
  lead_source: 'website' | 'mls' | 'referral' | 'social' | 'advertising';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost';
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  lead_id?: string;
  property_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}