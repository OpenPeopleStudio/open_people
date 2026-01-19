do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('customer', 'admin', 'owner');
  end if;
end $$;

create table if not exists "709_profiles" (
  id uuid primary key references auth.users on delete cascade,
  role user_role default 'customer',
  full_name text,
  created_at timestamp default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  brand text,
  description text,
  category text,
  created_at timestamp default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products on delete cascade,
  size text,
  condition text,
  price_cents integer not null,
  stock integer not null default 0
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users,
  status text default 'pending',
  total_cents integer,
  stripe_payment_intent text,
  created_at timestamp default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders on delete cascade,
  variant_id uuid references product_variants,
  qty integer,
  price_cents integer
);