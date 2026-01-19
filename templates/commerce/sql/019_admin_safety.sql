-- Activity logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Pricing rules table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL CHECK (rule_type IN ('brand', 'model', 'condition')),
  match_value text NOT NULL,
  multiplier numeric(5,2) NOT NULL DEFAULT 1.0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(active);

-- RLS Policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
CREATE POLICY "Admins can view activity logs"
ON activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Admins and staff can insert activity logs
-- Note: 'staff' role is added in sql/022_staff_role.sql
-- If running this before 022, remove 'staff' from the list
DROP POLICY IF EXISTS "Admins can insert activity logs" ON activity_logs;
CREATE POLICY "Admins can insert activity logs"
ON activity_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Admins can manage pricing rules
DROP POLICY IF EXISTS "Admins can manage pricing rules" ON pricing_rules;
CREATE POLICY "Admins can manage pricing rules"
ON pricing_rules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Function to log product edits
CREATE OR REPLACE FUNCTION log_product_edit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create_product'
      WHEN TG_OP = 'UPDATE' THEN 'update_product'
      WHEN TG_OP = 'DELETE' THEN 'delete_product'
    END,
    'product',
    COALESCE(NEW.id::text, OLD.id::text),
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('name', NEW.name, 'brand', NEW.brand)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'old', jsonb_build_object('name', OLD.name, 'brand', OLD.brand),
        'new', jsonb_build_object('name', NEW.name, 'brand', NEW.brand)
      )
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('name', OLD.name, 'brand', OLD.brand)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_product_edit ON products;
CREATE TRIGGER trigger_log_product_edit
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_product_edit();

-- Function to log variant edits
CREATE OR REPLACE FUNCTION log_variant_edit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create_variant'
      WHEN TG_OP = 'UPDATE' THEN 'update_variant'
      WHEN TG_OP = 'DELETE' THEN 'delete_variant'
    END,
    'variant',
    COALESCE(NEW.id::text, OLD.id::text),
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('sku', NEW.sku, 'price', NEW.price_cents)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'old', jsonb_build_object('sku', OLD.sku, 'price', OLD.price_cents, 'stock', OLD.stock),
        'new', jsonb_build_object('sku', NEW.sku, 'price', NEW.price_cents, 'stock', NEW.stock)
      )
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('sku', OLD.sku)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_variant_edit ON product_variants;
CREATE TRIGGER trigger_log_variant_edit
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION log_variant_edit();

-- Function to apply pricing rules
CREATE OR REPLACE FUNCTION apply_pricing_rules(
  p_brand text,
  p_model text,
  p_condition text,
  p_base_price integer
)
RETURNS integer AS $$
DECLARE
  v_multiplier numeric := 1.0;
  v_rule RECORD;
BEGIN
  -- Apply brand multiplier
  SELECT multiplier INTO v_rule FROM pricing_rules
  WHERE rule_type = 'brand' AND match_value ILIKE p_brand AND active = true
  LIMIT 1;
  IF FOUND THEN
    v_multiplier := v_multiplier * v_rule.multiplier;
  END IF;

  -- Apply model multiplier
  SELECT multiplier INTO v_rule FROM pricing_rules
  WHERE rule_type = 'model' AND match_value ILIKE p_model AND active = true
  LIMIT 1;
  IF FOUND THEN
    v_multiplier := v_multiplier * v_rule.multiplier;
  END IF;

  -- Apply condition multiplier
  SELECT multiplier INTO v_rule FROM pricing_rules
  WHERE rule_type = 'condition' AND match_value ILIKE p_condition AND active = true
  LIMIT 1;
  IF FOUND THEN
    v_multiplier := v_multiplier * v_rule.multiplier;
  END IF;

  RETURN ROUND(p_base_price * v_multiplier);
END;
$$ LANGUAGE plpgsql;
