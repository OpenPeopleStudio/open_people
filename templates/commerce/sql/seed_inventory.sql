-- Seed inventory data
-- Run this script to populate products and variants

DO $$
DECLARE
  product_id uuid;
  slug_text text;
BEGIN

-- Nike Products
slug_text := 'nike-air-force-1-low';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Force 1 Low', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Force 1 Low', '10', 'DS', 18000, 3);

slug_text := 'nike-air-force-1-mid';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Force 1 Mid', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Force 1 Mid', '10', 'DS', 18000, 3);

slug_text := 'nike-air-force-1-high';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Force 1 High', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Force 1 High', '10', 'DS', 18000, 3);

slug_text := 'nike-dunk-low';
INSERT INTO products (name, slug, brand, category) VALUES ('Dunk Low', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Dunk Low', '10', 'DS', 18000, 3);

slug_text := 'nike-dunk-high';
INSERT INTO products (name, slug, brand, category) VALUES ('Dunk High', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Dunk High', '10', 'DS', 18000, 3);

slug_text := 'nike-sb-dunk-low';
INSERT INTO products (name, slug, brand, category) VALUES ('SB Dunk Low', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'SB Dunk Low', '10', 'DS', 18000, 3);

slug_text := 'nike-sb-dunk-high';
INSERT INTO products (name, slug, brand, category) VALUES ('SB Dunk High', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'SB Dunk High', '10', 'DS', 18000, 3);

slug_text := 'nike-air-max-1';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Max 1', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Max 1', '10', 'DS', 18000, 3);

slug_text := 'nike-air-max-90';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Max 90', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Max 90', '10', 'DS', 18000, 3);

slug_text := 'nike-air-max-95';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Max 95', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Max 95', '10', 'DS', 18000, 3);

slug_text := 'nike-air-max-97';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Max 97', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Max 97', '10', 'DS', 18000, 3);

slug_text := 'nike-air-max-plus';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Max Plus', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Max Plus', '10', 'DS', 18000, 3);

slug_text := 'nike-air-max-270';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Max 270', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Max 270', '10', 'DS', 18000, 3);

slug_text := 'nike-air-max-98';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Max 98', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Max 98', '10', 'DS', 18000, 3);

slug_text := 'nike-blazer-mid-77';
INSERT INTO products (name, slug, brand, category) VALUES ('Blazer Mid 77', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Blazer Mid 77', '10', 'DS', 18000, 3);

slug_text := 'nike-air-presto';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Presto', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Presto', '10', 'DS', 18000, 3);

slug_text := 'nike-air-huarache';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Huarache', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Air Huarache', '10', 'DS', 18000, 3);

slug_text := 'nike-zoom-vomero-5';
INSERT INTO products (name, slug, brand, category) VALUES ('Zoom Vomero 5', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Zoom Vomero 5', '10', 'DS', 18000, 3);

slug_text := 'nike-p-6000';
INSERT INTO products (name, slug, brand, category) VALUES ('P-6000', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'P-6000', '10', 'DS', 18000, 3);

slug_text := 'nike-cortez';
INSERT INTO products (name, slug, brand, category) VALUES ('Cortez', slug_text, 'Nike', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Nike', 'Cortez', '10', 'DS', 18000, 3);

-- Jordan Products
slug_text := 'jordan-air-jordan-1-high';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 1 High', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 1 High', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-1-mid';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 1 Mid', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 1 Mid', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-1-low';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 1 Low', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 1 Low', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-3';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 3', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 3', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-4';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 4', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 4', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-5';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 5', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 5', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-6';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 6', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 6', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-11';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 11', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 11', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-12';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 12', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 12', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-13';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 13', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 13', '10', 'DS', 18000, 3);

slug_text := 'jordan-air-jordan-14';
INSERT INTO products (name, slug, brand, category) VALUES ('Air Jordan 14', slug_text, 'Jordan', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Jordan', 'Air Jordan 14', '10', 'DS', 18000, 3);

-- Yeezy Products
slug_text := 'yeezy-boost-350-v2';
INSERT INTO products (name, slug, brand, category) VALUES ('Boost 350 V2', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', 'Boost 350 V2', '10', 'DS', 18000, 3);

slug_text := 'yeezy-boost-380';
INSERT INTO products (name, slug, brand, category) VALUES ('Boost 380', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', 'Boost 380', '10', 'DS', 18000, 3);

slug_text := 'yeezy-boost-700';
INSERT INTO products (name, slug, brand, category) VALUES ('Boost 700', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', 'Boost 700', '10', 'DS', 18000, 3);

slug_text := 'yeezy-boost-700-v2';
INSERT INTO products (name, slug, brand, category) VALUES ('Boost 700 V2', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', 'Boost 700 V2', '10', 'DS', 18000, 3);

slug_text := 'yeezy-boost-700-v3';
INSERT INTO products (name, slug, brand, category) VALUES ('Boost 700 V3', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', 'Boost 700 V3', '10', 'DS', 18000, 3);

slug_text := 'yeezy-500';
INSERT INTO products (name, slug, brand, category) VALUES ('500', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', '500', '10', 'DS', 18000, 3);

slug_text := 'yeezy-450';
INSERT INTO products (name, slug, brand, category) VALUES ('450', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', '450', '10', 'DS', 18000, 3);

slug_text := 'yeezy-foam-runner';
INSERT INTO products (name, slug, brand, category) VALUES ('Foam Runner', slug_text, 'Yeezy', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', 'Foam Runner', '10', 'DS', 18000, 3);

slug_text := 'yeezy-slide';
INSERT INTO products (name, slug, brand, category) VALUES ('Slide', slug_text, 'Yeezy', 'slides') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Yeezy', 'Slide', '10', 'DS', 18000, 3);

-- Adidas Products
slug_text := 'adidas-samba';
INSERT INTO products (name, slug, brand, category) VALUES ('Samba', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Samba', '10', 'DS', 18000, 3);

slug_text := 'adidas-gazelle';
INSERT INTO products (name, slug, brand, category) VALUES ('Gazelle', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Gazelle', '10', 'DS', 18000, 3);

slug_text := 'adidas-campus-00s';
INSERT INTO products (name, slug, brand, category) VALUES ('Campus 00s', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Campus 00s', '10', 'DS', 18000, 3);

slug_text := 'adidas-forum-low';
INSERT INTO products (name, slug, brand, category) VALUES ('Forum Low', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Forum Low', '10', 'DS', 18000, 3);

slug_text := 'adidas-forum-high';
INSERT INTO products (name, slug, brand, category) VALUES ('Forum High', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Forum High', '10', 'DS', 18000, 3);

slug_text := 'adidas-superstar';
INSERT INTO products (name, slug, brand, category) VALUES ('Superstar', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Superstar', '10', 'DS', 18000, 3);

slug_text := 'adidas-stan-smith';
INSERT INTO products (name, slug, brand, category) VALUES ('Stan Smith', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Stan Smith', '10', 'DS', 18000, 3);

slug_text := 'adidas-ultraboost';
INSERT INTO products (name, slug, brand, category) VALUES ('Ultraboost', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Ultraboost', '10', 'DS', 18000, 3);

slug_text := 'adidas-nmd-r1';
INSERT INTO products (name, slug, brand, category) VALUES ('NMD R1', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'NMD R1', '10', 'DS', 18000, 3);

slug_text := 'adidas-handball-spezial';
INSERT INTO products (name, slug, brand, category) VALUES ('Handball Spezial', slug_text, 'Adidas', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Adidas', 'Handball Spezial', '10', 'DS', 18000, 3);

-- New Balance Products
slug_text := 'new-balance-550';
INSERT INTO products (name, slug, brand, category) VALUES ('550', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '550', '10', 'DS', 18000, 3);

slug_text := 'new-balance-2002r';
INSERT INTO products (name, slug, brand, category) VALUES ('2002R', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '2002R', '10', 'DS', 18000, 3);

slug_text := 'new-balance-1906r';
INSERT INTO products (name, slug, brand, category) VALUES ('1906R', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '1906R', '10', 'DS', 18000, 3);

slug_text := 'new-balance-9060';
INSERT INTO products (name, slug, brand, category) VALUES ('9060', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '9060', '10', 'DS', 18000, 3);

slug_text := 'new-balance-990v3';
INSERT INTO products (name, slug, brand, category) VALUES ('990v3', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '990v3', '10', 'DS', 18000, 3);

slug_text := 'new-balance-990v4';
INSERT INTO products (name, slug, brand, category) VALUES ('990v4', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '990v4', '10', 'DS', 18000, 3);

slug_text := 'new-balance-990v5';
INSERT INTO products (name, slug, brand, category) VALUES ('990v5', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '990v5', '10', 'DS', 18000, 3);

slug_text := 'new-balance-990v6';
INSERT INTO products (name, slug, brand, category) VALUES ('990v6', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '990v6', '10', 'DS', 18000, 3);

slug_text := 'new-balance-992';
INSERT INTO products (name, slug, brand, category) VALUES ('992', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '992', '10', 'DS', 18000, 3);

slug_text := 'new-balance-993';
INSERT INTO products (name, slug, brand, category) VALUES ('993', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '993', '10', 'DS', 18000, 3);

slug_text := 'new-balance-327';
INSERT INTO products (name, slug, brand, category) VALUES ('327', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '327', '10', 'DS', 18000, 3);

slug_text := 'new-balance-530';
INSERT INTO products (name, slug, brand, category) VALUES ('530', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '530', '10', 'DS', 18000, 3);

slug_text := 'new-balance-574';
INSERT INTO products (name, slug, brand, category) VALUES ('574', slug_text, 'New Balance', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'New Balance', '574', '10', 'DS', 18000, 3);

-- ASICS Products
slug_text := 'asics-gel-kayano-14';
INSERT INTO products (name, slug, brand, category) VALUES ('Gel-Kayano 14', slug_text, 'ASICS', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'ASICS', 'Gel-Kayano 14', '10', 'DS', 18000, 3);

slug_text := 'asics-gel-1130';
INSERT INTO products (name, slug, brand, category) VALUES ('Gel-1130', slug_text, 'ASICS', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'ASICS', 'Gel-1130', '10', 'DS', 18000, 3);

slug_text := 'asics-gel-nimbus-9';
INSERT INTO products (name, slug, brand, category) VALUES ('Gel-Nimbus 9', slug_text, 'ASICS', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'ASICS', 'Gel-Nimbus 9', '10', 'DS', 18000, 3);

slug_text := 'asics-gel-lyte-iii';
INSERT INTO products (name, slug, brand, category) VALUES ('Gel-Lyte III', slug_text, 'ASICS', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'ASICS', 'Gel-Lyte III', '10', 'DS', 18000, 3);

-- Salomon Products
slug_text := 'salomon-xt-6';
INSERT INTO products (name, slug, brand, category) VALUES ('XT-6', slug_text, 'Salomon', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Salomon', 'XT-6', '10', 'DS', 18000, 3);

slug_text := 'salomon-xt-4';
INSERT INTO products (name, slug, brand, category) VALUES ('XT-4', slug_text, 'Salomon', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Salomon', 'XT-4', '10', 'DS', 18000, 3);

slug_text := 'salomon-acs-pro';
INSERT INTO products (name, slug, brand, category) VALUES ('ACS Pro', slug_text, 'Salomon', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Salomon', 'ACS Pro', '10', 'DS', 18000, 3);

slug_text := 'salomon-speedcross-5';
INSERT INTO products (name, slug, brand, category) VALUES ('Speedcross 5', slug_text, 'Salomon', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Salomon', 'Speedcross 5', '10', 'DS', 18000, 3);

-- Converse Products
slug_text := 'converse-chuck-70';
INSERT INTO products (name, slug, brand, category) VALUES ('Chuck 70', slug_text, 'Converse', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Converse', 'Chuck 70', '10', 'DS', 18000, 3);

slug_text := 'converse-chuck-taylor-all-star';
INSERT INTO products (name, slug, brand, category) VALUES ('Chuck Taylor All Star', slug_text, 'Converse', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Converse', 'Chuck Taylor All Star', '10', 'DS', 18000, 3);

slug_text := 'converse-one-star';
INSERT INTO products (name, slug, brand, category) VALUES ('One Star', slug_text, 'Converse', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Converse', 'One Star', '10', 'DS', 18000, 3);

-- Vans Products
slug_text := 'vans-old-skool';
INSERT INTO products (name, slug, brand, category) VALUES ('Old Skool', slug_text, 'Vans', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Vans', 'Old Skool', '10', 'DS', 18000, 3);

slug_text := 'vans-sk8-hi';
INSERT INTO products (name, slug, brand, category) VALUES ('Sk8-Hi', slug_text, 'Vans', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Vans', 'Sk8-Hi', '10', 'DS', 18000, 3);

slug_text := 'vans-authentic';
INSERT INTO products (name, slug, brand, category) VALUES ('Authentic', slug_text, 'Vans', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Vans', 'Authentic', '10', 'DS', 18000, 3);

slug_text := 'vans-slip-on';
INSERT INTO products (name, slug, brand, category) VALUES ('Slip-On', slug_text, 'Vans', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Vans', 'Slip-On', '10', 'DS', 18000, 3);

-- Reebok Products
slug_text := 'reebok-club-c-85';
INSERT INTO products (name, slug, brand, category) VALUES ('Club C 85', slug_text, 'Reebok', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Reebok', 'Club C 85', '10', 'DS', 18000, 3);

slug_text := 'reebok-classic-leather';
INSERT INTO products (name, slug, brand, category) VALUES ('Classic Leather', slug_text, 'Reebok', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Reebok', 'Classic Leather', '10', 'DS', 18000, 3);

slug_text := 'reebok-question-mid';
INSERT INTO products (name, slug, brand, category) VALUES ('Question Mid', slug_text, 'Reebok', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Reebok', 'Question Mid', '10', 'DS', 18000, 3);

-- Puma Products
slug_text := 'puma-suede-classic';
INSERT INTO products (name, slug, brand, category) VALUES ('Suede Classic', slug_text, 'Puma', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Puma', 'Suede Classic', '10', 'DS', 18000, 3);

slug_text := 'puma-rs-x';
INSERT INTO products (name, slug, brand, category) VALUES ('RS-X', slug_text, 'Puma', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Puma', 'RS-X', '10', 'DS', 18000, 3);

slug_text := 'puma-slipstream';
INSERT INTO products (name, slug, brand, category) VALUES ('Slipstream', slug_text, 'Puma', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Puma', 'Slipstream', '10', 'DS', 18000, 3);

-- Crocs Products
slug_text := 'crocs-classic-clog';
INSERT INTO products (name, slug, brand, category) VALUES ('Classic Clog', slug_text, 'Crocs', 'clogs') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Crocs', 'Classic Clog', '10', 'DS', 18000, 3);

slug_text := 'crocs-echo-clog';
INSERT INTO products (name, slug, brand, category) VALUES ('Echo Clog', slug_text, 'Crocs', 'clogs') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Crocs', 'Echo Clog', '10', 'DS', 18000, 3);

-- Birkenstock Products
slug_text := 'birkenstock-boston';
INSERT INTO products (name, slug, brand, category) VALUES ('Boston', slug_text, 'Birkenstock', 'clogs') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Birkenstock', 'Boston', '10', 'DS', 18000, 3);

slug_text := 'birkenstock-arizona';
INSERT INTO products (name, slug, brand, category) VALUES ('Arizona', slug_text, 'Birkenstock', 'sandals') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Birkenstock', 'Arizona', '10', 'DS', 18000, 3);

-- UGG Products
slug_text := 'ugg-tasman';
INSERT INTO products (name, slug, brand, category) VALUES ('Tasman', slug_text, 'UGG', 'slippers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'UGG', 'Tasman', '10', 'DS', 18000, 3);

slug_text := 'ugg-classic-mini';
INSERT INTO products (name, slug, brand, category) VALUES ('Classic Mini', slug_text, 'UGG', 'boots') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'UGG', 'Classic Mini', '10', 'DS', 18000, 3);

-- Hoka Products
slug_text := 'hoka-clifton-9';
INSERT INTO products (name, slug, brand, category) VALUES ('Clifton 9', slug_text, 'Hoka', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Hoka', 'Clifton 9', '10', 'DS', 18000, 3);

slug_text := 'hoka-bondi-8';
INSERT INTO products (name, slug, brand, category) VALUES ('Bondi 8', slug_text, 'Hoka', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Hoka', 'Bondi 8', '10', 'DS', 18000, 3);

slug_text := 'hoka-speedgoat-5';
INSERT INTO products (name, slug, brand, category) VALUES ('Speedgoat 5', slug_text, 'Hoka', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Hoka', 'Speedgoat 5', '10', 'DS', 18000, 3);

slug_text := 'hoka-mafate-speed-4';
INSERT INTO products (name, slug, brand, category) VALUES ('Mafate Speed 4', slug_text, 'Hoka', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Hoka', 'Mafate Speed 4', '10', 'DS', 18000, 3);

-- On Products
slug_text := 'on-cloud-5';
INSERT INTO products (name, slug, brand, category) VALUES ('Cloud 5', slug_text, 'On', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'On', 'Cloud 5', '10', 'DS', 18000, 3);

slug_text := 'on-cloudmonster';
INSERT INTO products (name, slug, brand, category) VALUES ('Cloudmonster', slug_text, 'On', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'On', 'Cloudmonster', '10', 'DS', 18000, 3);

slug_text := 'on-cloudnova';
INSERT INTO products (name, slug, brand, category) VALUES ('Cloudnova', slug_text, 'On', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'On', 'Cloudnova', '10', 'DS', 18000, 3);

slug_text := 'on-cloudsurfer';
INSERT INTO products (name, slug, brand, category) VALUES ('Cloudsurfer', slug_text, 'On', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'On', 'Cloudsurfer', '10', 'DS', 18000, 3);

-- Saucony Products
slug_text := 'saucony-shadow-6000';
INSERT INTO products (name, slug, brand, category) VALUES ('Shadow 6000', slug_text, 'Saucony', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Saucony', 'Shadow 6000', '10', 'DS', 18000, 3);

slug_text := 'saucony-jazz-original';
INSERT INTO products (name, slug, brand, category) VALUES ('Jazz Original', slug_text, 'Saucony', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Saucony', 'Jazz Original', '10', 'DS', 18000, 3);

slug_text := 'saucony-grid-9000';
INSERT INTO products (name, slug, brand, category) VALUES ('Grid 9000', slug_text, 'Saucony', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Saucony', 'Grid 9000', '10', 'DS', 18000, 3);

slug_text := 'saucony-progrid-triumph-4';
INSERT INTO products (name, slug, brand, category) VALUES ('ProGrid Triumph 4', slug_text, 'Saucony', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Saucony', 'ProGrid Triumph 4', '10', 'DS', 18000, 3);

-- Mizuno Products
slug_text := 'mizuno-wave-rider-10';
INSERT INTO products (name, slug, brand, category) VALUES ('Wave Rider 10', slug_text, 'Mizuno', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Mizuno', 'Wave Rider 10', '10', 'DS', 18000, 3);

slug_text := 'mizuno-wave-prophecy-ls';
INSERT INTO products (name, slug, brand, category) VALUES ('Wave Prophecy LS', slug_text, 'Mizuno', 'sneakers') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Mizuno', 'Wave Prophecy LS', '10', 'DS', 18000, 3);

-- Timberland Products
slug_text := 'timberland-6-inch-premium-boot';
INSERT INTO products (name, slug, brand, category) VALUES ('6-Inch Premium Boot', slug_text, 'Timberland', 'boots') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Timberland', '6-Inch Premium Boot', '10', 'DS', 18000, 3);

slug_text := 'timberland-3-eye-lug-shoe';
INSERT INTO products (name, slug, brand, category) VALUES ('3-Eye Lug Shoe', slug_text, 'Timberland', 'boots') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Timberland', '3-Eye Lug Shoe', '10', 'DS', 18000, 3);

-- Dr Martens Products
slug_text := 'dr-martens-1460-boot';
INSERT INTO products (name, slug, brand, category) VALUES ('1460 Boot', slug_text, 'Dr Martens', 'boots') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Dr Martens', '1460 Boot', '10', 'DS', 18000, 3);

slug_text := 'dr-martens-1461-shoe';
INSERT INTO products (name, slug, brand, category) VALUES ('1461 Shoe', slug_text, 'Dr Martens', 'boots') ON CONFLICT (slug) DO NOTHING RETURNING id INTO product_id;
IF product_id IS NULL THEN SELECT id INTO product_id FROM products WHERE slug = slug_text; END IF;
PERFORM create_variant_with_sku(product_id, 'Dr Martens', '1461 Shoe', '10', 'DS', 18000, 3);

RAISE NOTICE 'Inventory seed completed successfully!';
END $$;

-- Show summary
SELECT 
  'Products' as entity,
  COUNT(*) as count 
FROM products
UNION ALL
SELECT 
  'Variants' as entity,
  COUNT(*) as count 
FROM product_variants;
