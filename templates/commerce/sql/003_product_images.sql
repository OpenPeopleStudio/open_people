create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products on delete cascade,
  url text not null,
  position integer default 0,
  created_at timestamp default now()
);

alter table product_images enable row level security;

-- Enable RLS
alter table product_images enable row level security;

-- Public read access for all images
create policy "Anyone can view product images"
on product_images for select
using (true);

-- Admin/owner only can insert/delete images
create policy "Admins can insert product images"
on product_images for insert
with check (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);

create policy "Admins can delete product images"
on product_images for delete
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);