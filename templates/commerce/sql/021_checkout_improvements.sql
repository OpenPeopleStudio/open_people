-- Customer UX improvements - additional columns and tables
-- Run AFTER 020_shipping_tax.sql and 020_wishlist_alerts.sql

-- Add columns for tracking customer shipping preferences (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    ALTER TABLE user_preferences 
      ADD COLUMN IF NOT EXISTS default_shipping_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS saved_addresses JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add local pickup option to shipping methods if not exists
INSERT INTO shipping_methods (code, label, description, amount_cents, currency, countries, provinces, requires_local_zone, active, sort_order)
VALUES
  ('local_pickup', 'Local Pickup', 'Pick up your order from our location in St. John''s, NL. FREE.', 0, 'cad', array['CA'], array['NL'], false, true, 1)
ON CONFLICT (code) DO NOTHING;

-- Add express shipping option for Canada
INSERT INTO shipping_methods (code, label, description, amount_cents, currency, countries, provinces, requires_local_zone, active, sort_order)
VALUES
  ('express_ca', 'Express Shipping (Canada)', 'Expedited tracked shipping within Canada (2-3 business days).', 2500, 'cad', array['CA'], array[]::text[], false, true, 15)
ON CONFLICT (code) DO NOTHING;

-- Add express shipping option for US
INSERT INTO shipping_methods (code, label, description, amount_cents, currency, countries, provinces, requires_local_zone, active, sort_order)
VALUES
  ('express_us', 'Express Shipping (United States)', 'Expedited tracked shipping to the US (3-5 business days).', 4500, 'cad', array['US'], array[]::text[], false, true, 25)
ON CONFLICT (code) DO NOTHING;
