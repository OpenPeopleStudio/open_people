-- Key Verification Storage
-- Stores verified contacts and their fingerprints for each user

CREATE TABLE IF NOT EXISTS "709_verified_contacts" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_public_key text NOT NULL,
  verified_fingerprint text NOT NULL,
  verified_short_fingerprint text NOT NULL,
  verified_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_method text, -- 'qr_scan', 'manual', 'in_person', etc.
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, verified_user_id)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_verified_contacts_user 
  ON "709_verified_contacts" (user_id, verified_at DESC);

-- RLS Policies
ALTER TABLE "709_verified_contacts" ENABLE ROW LEVEL SECURITY;

-- Users can view their own verified contacts
CREATE POLICY verified_contacts_select_own 
  ON "709_verified_contacts" 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can add their own verified contacts
CREATE POLICY verified_contacts_insert_own 
  ON "709_verified_contacts" 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verified contacts
CREATE POLICY verified_contacts_update_own 
  ON "709_verified_contacts" 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own verified contacts
CREATE POLICY verified_contacts_delete_own 
  ON "709_verified_contacts" 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to check if a contact is verified
CREATE OR REPLACE FUNCTION is_contact_verified(
  p_user_id uuid,
  p_contact_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM "709_verified_contacts"
    WHERE user_id = p_user_id 
      AND verified_user_id = p_contact_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
