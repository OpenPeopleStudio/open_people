-- Row Level Security Policies for Real Estate Template

-- Enable RLS on all tables
ALTER TABLE real_estate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_messages ENABLE ROW LEVEL SECURITY;

-- Real Estate Profiles Policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile"
ON real_estate_profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON real_estate_profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON real_estate_profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Agents and admins can view all profiles (for client management)
CREATE POLICY "Agents and admins can view all profiles"
ON real_estate_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM real_estate_profiles
    WHERE id = auth.uid()
    AND role IN ('agent', 'admin', 'owner')
  )
);

-- Properties Policies
-- Agents can view/edit their own properties
CREATE POLICY "Agents can view own properties"
ON properties FOR SELECT
USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own properties"
ON properties FOR INSERT
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own properties"
ON properties FOR UPDATE
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

-- Public can view active properties (for website)
CREATE POLICY "Public can view active properties"
ON properties FOR SELECT
USING (status = 'active');

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
ON properties FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM real_estate_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Property Images Policies
-- Inherit from property permissions
CREATE POLICY "Property image access"
ON property_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND (
      properties.agent_id = auth.uid() OR
      properties.status = 'active' OR
      EXISTS (
        SELECT 1 FROM real_estate_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  )
);

-- Property Documents Policies
-- Only property agents and admins can access documents
CREATE POLICY "Property document access"
ON property_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_documents.property_id
    AND (
      properties.agent_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM real_estate_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  )
);

-- Leads Policies
-- Agents can view/manage their own leads
CREATE POLICY "Agents can view own leads"
ON leads FOR SELECT
USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert leads"
ON leads FOR INSERT
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own leads"
ON leads FOR UPDATE
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

-- Admins can view all leads
CREATE POLICY "Admins can view all leads"
ON leads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM real_estate_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Appointments Policies
-- Agents can view appointments for their properties or assigned to them
CREATE POLICY "Appointment access"
ON appointments FOR ALL
USING (
  agent_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = appointments.property_id
    AND properties.agent_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM real_estate_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Transactions Policies
-- Involved parties can access their transactions
CREATE POLICY "Transaction access"
ON transactions FOR ALL
USING (
  listing_agent_id = auth.uid() OR
  buyer_agent_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM leads
    WHERE (leads.id = transactions.buyer_lead_id OR leads.id = transactions.seller_lead_id)
    AND leads.agent_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM real_estate_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Transaction Documents Policies
-- Inherit from transaction permissions
CREATE POLICY "Transaction document access"
ON transaction_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_documents.transaction_id
    AND (
      transactions.listing_agent_id = auth.uid() OR
      transactions.buyer_agent_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM leads
        WHERE (leads.id = transactions.buyer_lead_id OR leads.id = transactions.seller_lead_id)
        AND leads.agent_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM real_estate_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  )
);

-- Market Data Policies
-- Everyone can read market data (public info)
CREATE POLICY "Market data is public"
ON market_data FOR SELECT
USING (true);

-- Only admins can insert/update market data
CREATE POLICY "Admins can manage market data"
ON market_data FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM real_estate_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Property Favorites Policies
-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
ON property_favorites FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Messages Policies
-- Users can view messages they're involved in
CREATE POLICY "Message access"
ON real_estate_messages FOR ALL
USING (
  sender_id = auth.uid() OR
  recipient_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = real_estate_messages.lead_id
    AND leads.agent_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM real_estate_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE properties;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE real_estate_messages;