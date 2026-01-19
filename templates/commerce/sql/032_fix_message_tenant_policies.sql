-- Fix message RLS policies to work with multi-tenant setup

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own messages" ON messages;
DROP POLICY IF EXISTS "Customers can send messages" ON messages;
DROP POLICY IF EXISTS "Customers can update own messages" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can send messages" ON messages;
DROP POLICY IF EXISTS "Admins can update messages" ON messages;

-- Customers can view their own messages within their tenant
CREATE POLICY "Customers can view own messages"
ON messages FOR SELECT
USING (
  customer_id = auth.uid()
  AND (
    tenant_id IS NULL 
    OR tenant_id = (SELECT tenant_id FROM "709_profiles" WHERE id = auth.uid())
  )
);

-- Customers can send messages if they have eligible orders in the same tenant
CREATE POLICY "Customers can send messages"
ON messages FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  AND sender_type = 'customer'
  AND (
    tenant_id IS NULL 
    OR tenant_id = (SELECT tenant_id FROM "709_profiles" WHERE id = auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE customer_id = auth.uid()
    AND status IN ('pending', 'paid', 'fulfilled', 'shipped')
    AND (
      tenant_id IS NULL 
      OR tenant_id = (SELECT tenant_id FROM "709_profiles" WHERE id = auth.uid())
    )
  )
);

-- Customers can update their own messages within their tenant
CREATE POLICY "Customers can update own messages"
ON messages FOR UPDATE
USING (
  customer_id = auth.uid()
  AND (
    tenant_id IS NULL 
    OR tenant_id = (SELECT tenant_id FROM "709_profiles" WHERE id = auth.uid())
  )
);

-- Admins can view all messages within their tenant
CREATE POLICY "Admins can view all messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
    AND (
      tenant_id IS NULL 
      OR tenant_id = messages.tenant_id
    )
  )
);

-- Admins can send messages within their tenant
CREATE POLICY "Admins can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_type = 'admin'
  AND EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
    AND (
      tenant_id IS NULL 
      OR tenant_id = messages.tenant_id
    )
  )
);

-- Admins can update messages within their tenant
CREATE POLICY "Admins can update messages"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
    AND (
      tenant_id IS NULL 
      OR tenant_id = messages.tenant_id
    )
  )
);
