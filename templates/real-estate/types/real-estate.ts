// Real Estate Template Types

export type PropertyType = 'house' | 'condo' | 'townhouse' | 'apartment' | 'land' | 'commercial' | 'multi_family';
export type PropertyStatus = 'active' | 'pending' | 'sold' | 'off_market' | 'coming_soon';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiating' | 'closed' | 'lost';
export type LeadType = 'buyer' | 'seller' | 'renter' | 'investor' | 'agent';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type TransactionStatus = 'active' | 'under_contract' | 'closed' | 'cancelled' | 'expired';
export type UserRole = 'customer' | 'agent' | 'admin' | 'owner';

export interface RealEstateProfile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  license_number: string | null;
  brokerage_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  agent_id: string;
  mls_number: string | null;
  property_type: PropertyType;
  status: PropertyStatus;

  // Address
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;

  // Details
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size: number | null;
  year_built: number | null;
  description: string | null;
  features: string[] | null;

  // Marketing
  title: string | null;
  virtual_tour_url: string | null;
  video_tour_url: string | null;
  floor_plan_url: string | null;

  // Dates
  listed_at: string;
  updated_at: string;
  sold_at: string | null;
  created_at: string;

  // Relations
  agent?: RealEstateProfile;
  images?: PropertyImage[];
  documents?: PropertyDocument[];
  favorites_count?: number;
  is_favorited?: boolean;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  document_type: string;
  title: string;
  document_url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  agent_id: string;
  lead_type: LeadType;
  status: LeadStatus;

  // Contact
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_contact_method: string;

  // Requirements
  budget_min: number | null;
  budget_max: number | null;
  property_types: PropertyType[] | null;
  preferred_locations: string[] | null;
  timeline: string | null;
  financing_status: string | null;
  notes: string | null;

  // Tracking
  lead_source: string | null;
  source_details: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  follow_up_notes: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  agent?: RealEstateProfile;
  appointments?: Appointment[];
  messages?: RealEstateMessage[];
}

export interface Appointment {
  id: string;
  property_id: string;
  lead_id: string;
  agent_id: string;
  status: AppointmentStatus;
  appointment_type: string;

  // Date/Time
  start_time: string;
  end_time: string;
  timezone: string;

  // Details
  notes: string | null;
  feedback: string | null;
  rating: number | null;

  // Confirmation
  confirmed_at: string | null;
  confirmed_by: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  property?: Property;
  lead?: Lead;
  agent?: RealEstateProfile;
}

export interface Transaction {
  id: string;
  property_id: string;
  buyer_lead_id: string | null;
  seller_lead_id: string | null;
  listing_agent_id: string;
  buyer_agent_id: string | null;
  status: TransactionStatus;

  // Financial
  list_price: number | null;
  sale_price: number | null;
  commission_rate: number | null;
  commission_amount: number | null;

  // Dates
  contract_date: string | null;
  closing_date: string | null;
  possession_date: string | null;

  // Status
  contingencies: string[] | null;
  inspection_date: string | null;
  appraisal_date: string | null;
  appraisal_value: number | null;

  // Notes
  transaction_notes: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  property?: Property;
  buyer_lead?: Lead;
  seller_lead?: Lead;
  listing_agent?: RealEstateProfile;
  buyer_agent?: RealEstateProfile;
  documents?: TransactionDocument[];
}

export interface TransactionDocument {
  id: string;
  transaction_id: string;
  document_type: string;
  title: string;
  document_url: string;
  uploaded_by: string | null;
  requires_signature: boolean;
  signed_at: string | null;
  signed_by: string | null;
  created_at: string;
}

export interface MarketData {
  id: string;
  location: string;
  property_type: PropertyType | null;
  data_type: string;
  value: number | null;
  value_text: string | null;
  period_start: string;
  period_end: string;
  data_source: string;
  confidence_score: number | null;
  created_at: string;
}

export interface PropertyFavorite {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
}

export interface RealEstateMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  lead_id: string | null;
  property_id: string | null;
  transaction_id: string | null;
  subject: string | null;
  content: string;
  message_type: string;
  read_at: string | null;
  sent_at: string;
  created_at: string;

  // Relations
  sender?: RealEstateProfile;
  recipient?: RealEstateProfile;
  lead?: Lead;
  property?: Property;
  transaction?: Transaction;
}

// Search and Filter Types
export interface PropertySearchFilters {
  property_type?: PropertyType[];
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_square_feet?: number;
  max_square_feet?: number;
  city?: string;
  state_province?: string;
  postal_code?: string;
  features?: string[];
  status?: PropertyStatus[];
}

export interface LeadSearchFilters {
  lead_type?: LeadType[];
  status?: LeadStatus[];
  agent_id?: string;
  budget_min?: number;
  budget_max?: number;
  property_types?: PropertyType[];
  timeline?: string[];
  lead_source?: string[];
}

// Form Types
export interface PropertyFormData {
  mls_number?: string;
  property_type: PropertyType;
  street_address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: number;
  year_built?: number;
  description?: string;
  features?: string[];
  title?: string;
  virtual_tour_url?: string;
  video_tour_url?: string;
  floor_plan_url?: string;
}

export interface LeadFormData {
  lead_type: LeadType;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  preferred_contact_method?: string;
  budget_min?: number;
  budget_max?: number;
  property_types?: PropertyType[];
  preferred_locations?: string[];
  timeline?: string;
  financing_status?: string;
  notes?: string;
  lead_source?: string;
  source_details?: string;
}

export interface AppointmentFormData {
  property_id: string;
  lead_id: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  appointment_type?: string;
  notes?: string;
}

// Dashboard Analytics
export interface RealEstateAnalytics {
  total_properties: number;
  active_listings: number;
  total_leads: number;
  new_leads_this_month: number;
  appointments_this_week: number;
  transactions_this_quarter: number;
  average_days_on_market: number;
  average_sale_price: number;
}

// AI Integration Types
export interface LeadScore {
  lead_id: string;
  score: number; // 0-100
  confidence: number; // 0-1
  factors: {
    budget_alignment: number;
    timeline_urgency: number;
    location_preference: number;
    communication_quality: number;
    market_knowledge: number;
  };
  recommended_actions: string[];
  predicted_conversion_probability: number;
}

export interface MarketAnalysis {
  location: string;
  property_type: PropertyType;
  market_trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  average_price: number;
  price_change_percentage: number;
  days_on_market_average: number;
  inventory_level: 'low' | 'normal' | 'high';
  recommendations: string[];
}