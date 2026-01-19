create or replace function finalize_inventory(
  variant_id_input uuid,
  qty_input integer
)
returns void
language plpgsql
as $$
begin
  update product_variants
  set
    stock = stock - qty_input,
    reserved = reserved - qty_input
  where id = variant_id_input;

  -- Update first_sold_at if this is the first sale
  perform update_first_sold_at(variant_id_input);
end;
$$;