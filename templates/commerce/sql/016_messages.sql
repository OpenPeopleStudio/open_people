-- Messages table for customer-admin chat
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_customer_id ON messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Customers can view their own messages
CREATE POLICY "Customers can view own messages"
ON messages FOR SELECT
USING (customer_id = auth.uid());

-- Customers can insert their own messages
CREATE POLICY "Customers can send messages"
ON messages FOR INSERT
WITH CHECK (
  customer_id = auth.uid() 
  AND sender_type = 'customer'
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Admins can insert messages (as admin)
CREATE POLICY "Admins can send messages"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
  AND sender_type = 'admin'
);

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Customers can update their own messages (mark as read)
CREATE POLICY "Customers can update own messages"
ON messages FOR UPDATE
USING (customer_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
