create table if not exists inventory_audit (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references product_variants,
  delta integer not null,
  reason text not null,
  actor uuid,
  created_at timestamp default now()
);