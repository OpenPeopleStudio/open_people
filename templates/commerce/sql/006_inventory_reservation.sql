-- Function to reserve inventory for cart items
-- This runs in a transaction to prevent race conditions
create or replace function reserve_inventory(cart_items jsonb)
returns text
language plpgsql
security definer
as $$
declare
  item jsonb;
  variant_id uuid;
  qty integer;
  current_stock integer;
  current_reserved integer;
  available integer;
  reservation_id text;
begin
  -- Generate unique reservation ID
  reservation_id := 'res_' || gen_random_uuid()::text;

  -- Process each cart item
  for item in select * from jsonb_array_elements(cart_items)
  loop
    variant_id := (item->>'variant_id')::uuid;
    qty := (item->>'qty')::integer;

    -- Lock the variant row for update
    select stock, reserved into current_stock, current_reserved
    from product_variants
    where id = variant_id
    for update;

    -- Check if variant exists
    if current_stock is null then
      raise exception 'Product variant not found: %', variant_id;
    end if;

    -- Calculate available stock
    available := current_stock - current_reserved;

    -- Check if enough stock is available
    if available < qty then
      raise exception 'Insufficient stock for variant %: requested %, available %',
        variant_id, qty, available;
    end if;

    -- Reserve the inventory
    update product_variants
    set reserved = reserved + qty
    where id = variant_id;
  end loop;

  return reservation_id;
exception
  when others then
    -- Rollback will happen automatically
    raise exception '%', sqlerrm;
end;
$$;