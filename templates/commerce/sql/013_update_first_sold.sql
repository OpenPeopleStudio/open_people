create or replace function update_first_sold_at(variant_id_input uuid)
returns void
language plpgsql
as $$
begin
  update product_variants
  set first_sold_at = now()
  where id = variant_id_input
    and first_sold_at is null;
end;
$$;