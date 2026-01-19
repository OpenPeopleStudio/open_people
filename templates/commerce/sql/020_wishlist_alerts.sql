-- Wishlist table for saved items and size preferences
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  size_preference VARCHAR(20),
  condition_preference VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Stock alerts for back-in-stock notifications
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  size VARCHAR(20) NOT NULL,
  condition_code VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, condition_code)
);

-- Drop alerts for upcoming releases
CREATE TABLE IF NOT EXISTS drop_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Recently viewed items (for personalization)
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- User preferences (size preference, currency, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_size VARCHAR(20),
  preferred_condition VARCHAR(20),
  preferred_currency VARCHAR(3) DEFAULT 'CAD',
  notifications_enabled BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price history for market context
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE NOT NULL,
  price_cents INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id, size);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_user ON stock_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_drop_alerts_product ON drop_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_variant ON price_history(variant_id, recorded_at DESC);

-- RLS Policies
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drop_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Users can manage their own wishlist
CREATE POLICY "Users manage own wishlist" ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own stock alerts
CREATE POLICY "Users manage own stock alerts" ON stock_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own drop alerts
CREATE POLICY "Users manage own drop alerts" ON drop_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own recently viewed
CREATE POLICY "Users manage own recently viewed" ON recently_viewed
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own preferences
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Price history is read-only for users
CREATE POLICY "Anyone can read price history" ON price_history
  FOR SELECT USING (true);

-- Function to record price when variant is sold
CREATE OR REPLACE FUNCTION record_price_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO price_history (variant_id, price_cents)
    SELECT oi.variant_id, oi.price_cents
    FROM order_items oi
    WHERE oi.order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for price recording
DROP TRIGGER IF EXISTS trigger_record_price ON orders;
CREATE TRIGGER trigger_record_price
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_price_on_sale();

-- Function to check and notify stock alerts when inventory increases
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert RECORD;
  product_name TEXT;
BEGIN
  -- Only check if stock increased
  IF NEW.stock > OLD.stock THEN
    -- Get product name
    SELECT p.name INTO product_name
    FROM products p
    WHERE p.id = NEW.product_id;
    
    -- Mark matching alerts for notification
    -- (Actual email sending would be handled by external process or Edge Function)
    UPDATE stock_alerts
    SET notified_at = NOW()
    WHERE product_id = NEW.product_id
      AND size = NEW.size
      AND (condition_code IS NULL OR condition_code = NEW.condition_code)
      AND notified_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_stock_alerts ON product_variants;
CREATE TRIGGER trigger_check_stock_alerts
  AFTER UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION check_stock_alerts();
