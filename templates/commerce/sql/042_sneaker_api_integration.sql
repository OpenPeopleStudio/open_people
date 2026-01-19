-- =============================================================================
-- 042: Sneaker API Integration - MVP Architecture
-- =============================================================================
-- 
-- This migration adds support for third-party sneaker API integration following
-- the "lens, not load-bearing beam" principle:
-- 
-- - Products can exist without API data
-- - External image URLs are stored but site works if they break
-- - SKU is the canonical identifier for matching
-- - Market data is informational only
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add canonical fields to products table
-- -----------------------------------------------------------------------------

-- SKU: Industry-standard identifier (e.g., "555088-001" for Jordan 1 Bred)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Colorway: The specific color variant name
ALTER TABLE products ADD COLUMN IF NOT EXISTS colorway TEXT;

-- Release date: When the shoe originally released
ALTER TABLE products ADD COLUMN IF NOT EXISTS release_date DATE;

-- External image URL: Third-party hosted image (not our responsibility to keep alive)
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_image_url TEXT;

-- Source: Where this product data came from (manual, sneaker-api, etc.)
ALTER TABLE products ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';

-- External ID: Reference ID from the third-party API for future lookups
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Create index on SKU for quick lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id) WHERE external_id IS NOT NULL;

-- Ensure SKU uniqueness per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_sku 
ON products(tenant_id, sku) 
WHERE sku IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Market reference data (read-only, informational)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS market_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Price data (in cents)
  lowest_ask_cents INTEGER,
  highest_bid_cents INTEGER,
  last_sale_cents INTEGER,
  
  -- Volume
  sales_count_7d INTEGER,
  sales_count_30d INTEGER,
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'unknown', -- e.g., 'sneaker-api'
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, product_id)
);

-- RLS for market_references
ALTER TABLE market_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market references"
ON market_references FOR SELECT
USING (true);

CREATE POLICY "Admins can manage market references"
ON market_references FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Index for quick product lookups
CREATE INDEX IF NOT EXISTS idx_market_references_product_id ON market_references(product_id);
CREATE INDEX IF NOT EXISTS idx_market_references_tenant_product ON market_references(tenant_id, product_id);

-- -----------------------------------------------------------------------------
-- 3. Sneaker API cache table (for search results)
-- -----------------------------------------------------------------------------
-- This is ephemeral data - can be cleared anytime

CREATE TABLE IF NOT EXISTS sneaker_api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE, -- e.g., "search:jordan 1 bred"
  response_data JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Auto-cleanup old cache entries
CREATE INDEX IF NOT EXISTS idx_sneaker_api_cache_expires ON sneaker_api_cache(expires_at);

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_sneaker_api_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM sneaker_api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 4. Add same fields to product_models (for catalog/reference)
-- -----------------------------------------------------------------------------

ALTER TABLE product_models ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE product_models ADD COLUMN IF NOT EXISTS colorway TEXT;
ALTER TABLE product_models ADD COLUMN IF NOT EXISTS release_date DATE;
ALTER TABLE product_models ADD COLUMN IF NOT EXISTS external_image_url TEXT;
ALTER TABLE product_models ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE INDEX IF NOT EXISTS idx_product_models_sku ON product_models(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_models_external_id ON product_models(external_id) WHERE external_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Comments for documentation
-- -----------------------------------------------------------------------------

COMMENT ON COLUMN products.external_image_url IS 'Third-party hosted image URL. Site must work if this breaks.';
COMMENT ON COLUMN products.data_source IS 'Origin of product data: manual, sneaker-api, import, etc.';
COMMENT ON COLUMN products.external_id IS 'Reference ID from third-party sneaker API for future syncs.';
COMMENT ON TABLE market_references IS 'Read-only market data from third-party APIs. Informational only - never auto-price.';
COMMENT ON TABLE sneaker_api_cache IS 'Ephemeral cache for sneaker API search results. Can be cleared anytime.';
