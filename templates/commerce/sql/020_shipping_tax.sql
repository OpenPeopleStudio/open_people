-- Shipping methods, local delivery zones, and tax fields for orders.

-- Order totals breakdown
alter table orders
add column if not exists subtotal_cents integer not null default 0,
add column if not exists tax_cents integer not null default 0,
add column if not exists tax_rate numeric(6,4),
add column if not exists currency text not null default 'cad';

-- Shipping methods (admin-configurable, customer-visible)
create table if not exists shipping_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  amount_cents integer not null,
  currency text not null default 'cad',
  countries text[] not null default '{CA}',
  provinces text[] not null default '{}',
  requires_local_zone boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_shipping_methods_active on shipping_methods(active);
create index if not exists idx_shipping_methods_sort on shipping_methods(sort_order);

-- Local delivery zones (used by shipping methods that require a zone)
create table if not exists local_delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'CA',
  province text not null default 'NL',
  city_names text[] not null default '{}',
  postal_fsa_prefixes text[] not null default '{}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (country, province, name)
);

create index if not exists idx_local_delivery_zones_active on local_delivery_zones(active);
create index if not exists idx_local_delivery_zones_sort on local_delivery_zones(sort_order);

-- RLS
alter table shipping_methods enable row level security;
alter table local_delivery_zones enable row level security;

create policy "Anyone can view active shipping methods"
on shipping_methods for select
using (active = true);

create policy "Admins can manage shipping methods"
on shipping_methods for all
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
)
with check (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

create policy "Anyone can view active local delivery zones"
on local_delivery_zones for select
using (active = true);

create policy "Admins can manage local delivery zones"
on local_delivery_zones for all
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
)
with check (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

-- Seed: shipping methods
insert into shipping_methods (code, label, description, amount_cents, currency, countries, provinces, requires_local_zone, active, sort_order)
values
  ('standard_ca', 'Standard Shipping (Canada)', 'Tracked shipping within Canada.', 1500, 'cad', array['CA'], array[]::text[], false, true, 10),
  ('standard_us', 'Standard Shipping (United States)', 'Tracked shipping to the United States.', 2500, 'cad', array['US'], array[]::text[], false, true, 20),
  ('local_delivery_nl', 'Local Delivery (Avalon Metro)', 'Local delivery in select NL areas (St. John''s + nearby).', 1000, 'cad', array['CA'], array['NL'], true, true, 5)
on conflict (code) do nothing;

-- Seed: local delivery zone for St. John's area (NL)
insert into local_delivery_zones (name, country, province, city_names, postal_fsa_prefixes, active, sort_order)
values (
  'Avalon Metro',
  'CA',
  'NL',
  array[
    'St. John''s',
    'St Johns',
    'St John''s',
    'Mount Pearl',
    'Paradise',
    'Conception Bay South',
    'CBS',
    'Torbay',
    'Portugal Cove',
    'Portugal Cove-St. Philips',
    'Portugal Cove-St. Philip''s'
  ],
  array[
    'A1A', -- St. John''s (parts)
    'A1B', -- St. John''s (parts)
    'A1C', -- St. John''s (downtown)
    'A1E', -- St. John''s (parts)
    'A1G', -- St. John''s (parts)
    'A1H', -- St. John''s (parts)
    'A1K', -- Torbay
    'A1L', -- Paradise
    'A1M', -- Portugal Cove-St. Philips
    'A1N', -- Mount Pearl
    'A1W'  -- Conception Bay South
  ],
  true,
  1
)
on conflict (country, province, name) do nothing;

