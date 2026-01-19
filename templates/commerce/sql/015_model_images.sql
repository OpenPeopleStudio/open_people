create table if not exists product_models (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  slug text unique not null,
  created_at timestamp default now()
);

create table if not exists model_images (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references product_models on delete cascade,
  source text not null,          -- google | manual
  url text not null,             -- Supabase public URL
  is_primary boolean default false,
  position integer default 0,
  created_at timestamp default now()
);

-- RLS for product_models
alter table product_models enable row level security;

create policy "Anyone can view product models"
on product_models for select
using (true);

create policy "Admins can insert product models"
on product_models for insert
with check (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

create policy "Admins can update product models"
on product_models for update
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

-- RLS for model_images
alter table model_images enable row level security;

create policy "Anyone can view model images"
on model_images for select
using (true);

create policy "Admins can manage model images"
on model_images for all
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);