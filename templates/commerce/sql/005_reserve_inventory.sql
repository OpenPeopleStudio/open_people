create or replace function reserve_inventory(
  variant_id_input uuid,
  qty_input integer
)
returns void
language plpgsql
as $$
declare
  available integer;
begin
  select stock - reserved
  into available
  from product_variants
  where id = variant_id_input
  for update;

  if available < qty_input then
    raise exception 'Insufficient stock';
  end if;

  update product_variants
  set reserved = reserved + qty_input
  where id = variant_id_input;
end;
$$;