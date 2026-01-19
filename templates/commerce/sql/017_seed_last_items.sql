-- Seed data for last requested additions only.
-- Safe to run multiple times; uses ON CONFLICT (slug) DO NOTHING.

-- Nike basketball and heritage additions
insert into product_models (brand, model, slug) values
  ('Nike', 'LeBron 9', 'nike-lebron-9'),
  ('Nike', 'LeBron 10', 'nike-lebron-10'),
  ('Nike', 'LeBron 15', 'nike-lebron-15'),
  ('Nike', 'KD 7', 'nike-kd-7'),
  ('Nike', 'KD 8', 'nike-kd-8'),
  ('Nike', 'KD 9', 'nike-kd-9'),
  ('Nike', 'Foamposite One', 'nike-foamposite-one'),
  ('Nike', 'Foamposite Pro', 'nike-foamposite-pro'),
  ('Nike', 'Blazer Low 77', 'nike-blazer-low-77')
on conflict (slug) do nothing;

-- Converse collaborations
insert into product_models (brand, model, slug) values
  ('Converse', 'Chuck Taylor All Star CDG Play', 'converse-chuck-taylor-all-star-cdg-play')
on conflict (slug) do nothing;
