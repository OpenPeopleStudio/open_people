-- Returns table
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  return_type text NOT NULL CHECK (return_type IN ('return', 'exchange')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'completed', 'rejected')),
  reason text NOT NULL,
  inventory_action text CHECK (inventory_action IN ('restock', 'writeoff')),
  refund_amount_cents integer,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp DEFAULT now(),
  completed_at timestamp
);

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

-- Consignors table
CREATE TABLE IF NOT EXISTS consignors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  commission_rate numeric(5,2) NOT NULL DEFAULT 20.00,
  balance_cents integer NOT NULL DEFAULT 0,
  total_sales_cents integer NOT NULL DEFAULT 0,
  total_paid_cents integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consignors_email ON consignors(email);

-- Consignment items table
CREATE TABLE IF NOT EXISTS consignment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consignor_id uuid NOT NULL REFERENCES consignors(id),
  variant_id uuid REFERENCES product_variants(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'returned', 'paid')),
  list_price_cents integer NOT NULL,
  sold_price_cents integer,
  commission_cents integer,
  payout_cents integer,
  order_id uuid REFERENCES orders(id),
  created_at timestamp DEFAULT now(),
  sold_at timestamp
);

CREATE INDEX IF NOT EXISTS idx_consignment_items_consignor ON consignment_items(consignor_id);
CREATE INDEX IF NOT EXISTS idx_consignment_items_status ON consignment_items(status);

-- Consignment payouts table
CREATE TABLE IF NOT EXISTS consignment_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consignor_id uuid NOT NULL REFERENCES consignors(id),
  amount_cents integer NOT NULL,
  method text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamp DEFAULT now(),
  completed_at timestamp
);

CREATE INDEX IF NOT EXISTS idx_consignment_payouts_consignor ON consignment_payouts(consignor_id);

-- RLS Policies
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignment_payouts ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage returns"
ON returns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can manage consignors"
ON consignors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can manage consignment items"
ON consignment_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can manage consignment payouts"
ON consignment_payouts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Function to update consignor balance when item is sold
CREATE OR REPLACE FUNCTION update_consignor_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status = 'active' THEN
    -- Calculate commission and payout
    NEW.commission_cents := ROUND(NEW.sold_price_cents * (
      SELECT commission_rate / 100 FROM consignors WHERE id = NEW.consignor_id
    ));
    NEW.payout_cents := NEW.sold_price_cents - NEW.commission_cents;
    NEW.sold_at := now();
    
    -- Update consignor totals
    UPDATE consignors SET
      total_sales_cents = total_sales_cents + NEW.sold_price_cents,
      balance_cents = balance_cents + NEW.payout_cents,
      updated_at = now()
    WHERE id = NEW.consignor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consignment_sale ON consignment_items;
CREATE TRIGGER trigger_consignment_sale
  BEFORE UPDATE ON consignment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_consignor_on_sale();

-- Add returned status to orders
DO $$
BEGIN
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
