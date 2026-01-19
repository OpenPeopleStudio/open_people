alter table product_variants
add column if not exists reserved integer not null default 0;

-- Safety: stock and reserved can never go negative
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'stock_non_negative'
    and table_name = 'product_variants'
  ) then
    alter table product_variants
    add constraint stock_non_negative check (stock >= 0);
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'reserved_non_negative'
    and table_name = 'product_variants'
  ) then
    alter table product_variants
    add constraint reserved_non_negative check (reserved >= 0);
  end if;
end $$;

-- Helper view (optional but useful)
create or replace view variant_availability as
select
  id,
  stock,
  reserved,
  (stock - reserved) as available
from product_variants;