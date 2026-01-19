alter table product_variants
add column if not exists brand text not null,
add column if not exists model text not null,
add column if not exists condition_code text not null,
add column if not exists sku text unique;

-- Enforce condition codes
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'valid_condition'
    and table_name = 'product_variants'
  ) then
    alter table product_variants
    add constraint valid_condition
    check (condition_code in ('DS','VNDS','USED'));
  end if;
end $$;

-- Add default values for existing rows (if any)
update product_variants
set
  brand = 'UNKNOWN',
  model = 'UNKNOWN',
  condition_code = 'DS'
where brand is null or model is null or condition_code is null;