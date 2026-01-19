-- Function to fulfill an order item (decrement stock and reserved)
create or replace function fulfill_order_item(variant_id uuid, qty integer)
returns void
language plpgsql
security definer
as $$
begin
  update product_variants
  set stock = stock - qty,
      reserved = reserved - qty
  where id = variant_id
    and stock >= qty
    and reserved >= qty;

  if not found then
    raise exception 'Failed to fulfill order item: insufficient stock or reservation for variant %', variant_id;
  end if;
end;
$$;

-- Function to release reserved inventory (when payment fails)
create or replace function release_reserved_inventory(variant_id uuid, qty integer)
returns void
language plpgsql
security definer
as $$
begin
  update product_variants
  set reserved = greatest(reserved - qty, 0)
  where id = variant_id;

  if not found then
    raise exception 'Failed to release reserved inventory for variant %', variant_id;
  end if;
end;
$$;