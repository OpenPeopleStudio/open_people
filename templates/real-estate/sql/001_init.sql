-- Real Estate Template Database Schema
-- Properties, Leads, Appointments, and Transaction Management

-- Property types and statuses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE property_type AS ENUM ('house', 'condo', 'townhouse', 'apartment', 'land', 'commercial', 'multi_family');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
    CREATE TYPE property_status AS ENUM ('active', 'pending', 'sold', 'off_market', 'coming_soon');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiating', 'closed', 'lost');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_type') THEN
    CREATE TYPE lead_type AS ENUM ('buyer', 'seller', 'renter', 'investor', 'agent');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE transaction_status AS ENUM ('active', 'under_contract', 'closed', 'cancelled', 'expired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'agent', 'admin', 'owner');
  END IF;
END $$;

-- User profiles with real estate specific fields
CREATE TABLE IF NOT EXISTS real_estate_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role user_role DEFAULT 'customer',
  full_name TEXT,
  phone TEXT,
  license_number TEXT, -- For licensed agents
  brokerage_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  specialties TEXT[], -- Areas of expertise
  languages TEXT[], -- Languages spoken
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Properties table - core listings
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES real_estate_profiles(id) ON DELETE CASCADE,
  mls_number TEXT UNIQUE,
  property_type property_type NOT NULL,
  status property_status DEFAULT 'active',

  -- Address information
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Property details
  price DECIMAL(12, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  square_feet INTEGER,
  lot_size DECIMAL(10, 2),
  year_built INTEGER,
  description TEXT,
  features TEXT[],

  -- Marketing
  title TEXT,
  virtual_tour_url TEXT,
  video_tour_url TEXT,
  floor_plan_url TEXT,

  -- Dates
  listed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property images
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property documents (contracts, disclosures, etc.)
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'contract', 'disclosure', 'inspection', etc.
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES real_estate_profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads/Clients
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES real_estate_profiles(id) ON DELETE CASCADE,
  lead_type lead_type NOT NULL,
  status lead_status DEFAULT 'new',

  -- Contact information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_contact_method TEXT DEFAULT 'email', -- 'email', 'phone', 'text'

  -- Lead details
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  property_types property_type[],
  preferred_locations TEXT[],
  timeline TEXT, -- 'immediately', '3_months', '6_months', '1_year'
  financing_status TEXT, -- 'pre_approved', 'not_yet', 'cash_buyer'
  notes TEXT,

  -- Source tracking
  lead_source TEXT, -- 'website', 'referral', 'mls', 'social_media', 'advertisement'
  source_details TEXT,

  -- Follow-up
  last_contacted_at TIMESTAMP,
  next_follow_up_at TIMESTAMP,
  follow_up_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments/Showings
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES real_estate_profiles(id) ON DELETE CASCADE,

  status appointment_status DEFAULT 'scheduled',
  appointment_type TEXT DEFAULT 'showing', -- 'showing', 'open_house', 'meeting'

  -- Date/Time
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',

  -- Details
  notes TEXT,
  feedback TEXT, -- Post-appointment feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Confirmation
  confirmed_at TIMESTAMP,
  confirmed_by UUID REFERENCES real_estate_profiles(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions/Deals
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  buyer_lead_id UUID REFERENCES leads(id),
  seller_lead_id UUID REFERENCES leads(id),
  listing_agent_id UUID REFERENCES real_estate_profiles(id),
  buyer_agent_id UUID REFERENCES real_estate_profiles(id),

  status transaction_status DEFAULT 'active',

  -- Financial details
  list_price DECIMAL(12, 2),
  sale_price DECIMAL(12, 2),
  commission_rate DECIMAL(5, 2), -- Percentage
  commission_amount DECIMAL(10, 2),

  -- Important dates
  contract_date TIMESTAMP,
  closing_date TIMESTAMP,
  possession_date TIMESTAMP,

  -- Status tracking
  contingencies TEXT[], -- Array of contingency types
  inspection_date TIMESTAMP,
  appraisal_date TIMESTAMP,
  appraisal_value DECIMAL(12, 2),

  -- Notes and documents
  transaction_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transaction documents
CREATE TABLE IF NOT EXISTS transaction_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'contract', 'amendment', 'disclosure', 'inspection', 'closing'
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES real_estate_profiles(id),
  requires_signature BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP,
  signed_by UUID REFERENCES real_estate_profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Market data for analysis
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL, -- City, neighborhood, or zip code
  property_type property_type,
  data_type TEXT NOT NULL, -- 'median_price', 'average_price', 'days_on_market', 'inventory'

  -- Data values
  value DECIMAL(12, 2),
  value_text TEXT, -- For non-numeric data
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Source
  data_source TEXT, -- 'mls', 'zillow', 'realtor_com', 'internal'
  confidence_score DECIMAL(3, 2), -- 0.0 to 1.0

  created_at TIMESTAMP DEFAULT NOW()
);

-- Property favorites/watchlist
CREATE TABLE IF NOT EXISTS property_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES real_estate_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- Messages between agents and leads
CREATE TABLE IF NOT EXISTS real_estate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES real_estate_profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES real_estate_profiles(id), -- NULL for leads
  lead_id UUID REFERENCES leads(id), -- For lead conversations
  property_id UUID REFERENCES properties(id), -- Context property
  transaction_id UUID REFERENCES transactions(id), -- Context transaction

  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'email', -- 'email', 'sms', 'in_app'
  read_at TIMESTAMP,
  sent_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);

CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

CREATE INDEX IF NOT EXISTS idx_appointments_property_id ON appointments(property_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_agent_id ON appointments(agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);

CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_market_data_location ON market_data(location);
CREATE INDEX IF NOT EXISTS idx_market_data_period ON market_data(period_start, period_end);

-- Row Level Security policies will be added in a separate migration