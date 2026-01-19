-- Gate customer messaging to buyers (pending or paid orders)

DROP POLICY IF EXISTS "Customers can send messages" ON messages;
CREATE POLICY "Customers can send messages"
ON messages FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  AND sender_type = 'customer'
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE customer_id = auth.uid()
    AND status IN ('pending', 'paid', 'fulfilled', 'shipped')
  )
);
