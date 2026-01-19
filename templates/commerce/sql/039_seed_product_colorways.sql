-- =============================================================================
-- Seed product "colorways" into product_models + products
-- =============================================================================
--
-- This script adds a curated set of sneaker colorways to:
-- - public.product_models (catalog / "colorways" list used by admin tooling)
-- - public.products       (so images/intake flows can attach to a real product row)
--
-- Idempotent:
-- - Avoids duplicates by checking (tenant_id, brand, model/name) existence
-- - Also uses ON CONFLICT DO NOTHING as a safety net
--
-- Tenant:
-- - If public.tenants exists, targets slug = '709exclusive'
-- - If tenant-scoped columns don't exist, inserts without tenant_id
--
-- Run in Supabase SQL editor (service_role).
-- =============================================================================

DO $$
DECLARE
  target_tenant_id uuid;
  has_tenants boolean;
  has_products_tenant_id boolean;
  has_models_tenant_id boolean;
BEGIN
  has_tenants := to_regclass('public.tenants') IS NOT NULL;

  has_products_tenant_id := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'tenant_id'
  );

  has_models_tenant_id := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_models'
      AND column_name = 'tenant_id'
  );

  IF has_tenants THEN
    SELECT id INTO target_tenant_id
    FROM public.tenants
    WHERE slug = '709exclusive'
    LIMIT 1;
  END IF;

  CREATE TEMP TABLE tmp_colorways (
    brand text NOT NULL,
    name  text NOT NULL
  ) ON COMMIT DROP;

  -- De-duped list (notes like "(duplicate image)" / "(again)" removed)
  INSERT INTO tmp_colorways (brand, name) VALUES
    -- Nike
    ('Nike', 'Air Force 1 Low — White / University Gold'),
    ('Nike', 'Kyrie 7 — Play for the Future'),
    ('Nike', 'Kobe 5 Protro — Bruce Lee'),
    ('Nike', 'Kobe AD NXT 360 — White / Metallic Gold'),
    ('Nike', 'LeBron Soldier 14 — Blue Void / Green Strike'),
    ('Nike', 'LeBron 8 — Lakers'),
    ('Nike', 'LeBron 15 — Ashes'),
    ('Nike', 'Air Max 1 — Patta Aqua Noise'),
    ('Nike', 'Air Max 1 — Denim / Obsidian'),
    ('Nike', 'Air Max 90 — Infrared Black'),
    ('Nike', 'Air Max 95 — Neon'),
    ('Nike', 'Air Max 97 — Pink Fade'),

    -- Jordan
    ('Jordan', 'Air Jordan 11 Retro — Legend Blue'),
    ('Jordan', 'Air Jordan 10 Retro — Seattle'),
    ('Jordan', 'Air Jordan 8 Retro — Aqua'),
    ('Jordan', 'Air Jordan 11 Low — Bred'),
    ('Jordan', 'Air Jordan 14 Retro — Cool Grey'),
    ('Jordan', 'Air Jordan 6 Retro — White / Black'),
    ('Jordan', 'Air Jordan 3 Retro — Animal Instinct'),
    ('Jordan', 'Air Jordan 13 Retro — He Got Game'),
    ('Jordan', 'Air Jordan 12 Retro — Reverse Flu Game'),
    ('Jordan', 'Air Jordan 11 Low — Snakeskin Light Bone'),
    ('Jordan', 'Air Jordan 8 Retro — White / Chrome'),
    ('Jordan', 'Air Jordan 13 Retro — Black / University Blue'),
    ('Jordan', 'Air Jordan 11 Low — Concord'),
    ('Jordan', 'Air Jordan 2 Retro — Chicago'),
    ('Jordan', 'Air Jordan 12 Retro — Deep Royal Blue'),
    ('Jordan', 'Air Jordan 3 Retro — Black Cement'),
    ('Jordan', 'Air Jordan 3 Retro — True Blue'),

    -- Yeezy
    ('Yeezy', '450 — Cloud White'),
    ('Yeezy', 'Foam Runner — MX Carbon'),
    ('Yeezy', 'Boost 350 V2 — Beluga Reflective'),
    ('Yeezy', 'Boost 350 V2 — Zyon'),
    ('Yeezy', 'Boost 380 — Covellite'),
    ('Yeezy', 'Boost 350 V2 — Triple White'),
    ('Yeezy', 'Foam Runner — Ochre'),
    ('Yeezy', 'Foam Runner — Onyx'),

    -- New Balance
    ('New Balance', '990v5 — Navy'),

    -- Converse
    ('Converse', 'Comme des Garçons PLAY x Chuck 70 Low — Black / Red Heart');

  -- ---------------------------------------------------------------------------
  -- product_models (catalog / "colorways")
  -- ---------------------------------------------------------------------------
  IF has_models_tenant_id THEN
    INSERT INTO public.product_models (tenant_id, brand, model, slug)
    SELECT
      target_tenant_id,
      c.brand,
      c.name,
      trim(both '-' from regexp_replace(lower(c.brand || '-' || c.name), '[^a-z0-9]+', '-', 'g'))
    FROM tmp_colorways c
    WHERE target_tenant_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.product_models pm
        WHERE pm.tenant_id = target_tenant_id
          AND pm.brand = c.brand
          AND pm.model = c.name
      )
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.product_models (brand, model, slug)
    SELECT
      c.brand,
      c.name,
      trim(both '-' from regexp_replace(lower(c.brand || '-' || c.name), '[^a-z0-9]+', '-', 'g'))
    FROM tmp_colorways c
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.product_models pm
      WHERE pm.brand = c.brand
        AND pm.model = c.name
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- ---------------------------------------------------------------------------
  -- products (real product rows so image attach/intake flows work)
  -- ---------------------------------------------------------------------------
  IF has_products_tenant_id THEN
    INSERT INTO public.products (tenant_id, name, slug, brand, category, description)
    SELECT
      target_tenant_id,
      c.name,
      trim(both '-' from regexp_replace(lower(c.brand || '-' || c.name), '[^a-z0-9]+', '-', 'g')),
      c.brand,
      'footwear',
      c.brand || ' ' || c.name
    FROM tmp_colorways c
    WHERE target_tenant_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.products p
        WHERE p.tenant_id = target_tenant_id
          AND p.brand = c.brand
          AND p.name = c.name
      )
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.products (name, slug, brand, category, description)
    SELECT
      c.name,
      trim(both '-' from regexp_replace(lower(c.brand || '-' || c.name), '[^a-z0-9]+', '-', 'g')),
      c.brand,
      'footwear',
      c.brand || ' ' || c.name
    FROM tmp_colorways c
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.brand = c.brand
        AND p.name = c.name
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

