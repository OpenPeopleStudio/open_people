create or replace function admin_adjust_inventory(
  variant_id_input uuid,
  delta_input integer,
  reason_input text,
  actor_input uuid
)
returns void
language plpgsql
as $$
begin
  update product_variants
  set stock = stock + delta_input
  where id = variant_id_input;

  insert into inventory_audit (
    variant_id, delta, reason, actor
  ) values (
    variant_id_input, delta_input, reason_input, actor_input
  );
end;
$$;