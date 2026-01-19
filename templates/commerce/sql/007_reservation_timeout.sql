-- Function to release abandoned reservations (call periodically)
-- Releases reservations for orders that have been pending for too long
create or replace function release_abandoned_reservations()
returns integer
language plpgsql
as $$
declare
  abandoned_order record;
  item_record record;
  released_count integer := 0;
begin
  -- Find orders that are still pending after 30 minutes
  for abandoned_order in
    select id
    from orders
    where status = 'pending'
    and created_at < now() - interval '30 minutes'
  loop
    -- Get all items for this order
    for item_record in
      select variant_id, qty
      from order_items
      where order_id = abandoned_order.id
    loop
      -- Release the reservation
      update product_variants
      set reserved = greatest(reserved - item_record.qty, 0)
      where id = item_record.variant_id;

      released_count := released_count + item_record.qty;
    end loop;

    -- Mark order as expired
    update orders
    set status = 'expired'
    where id = abandoned_order.id;
  end loop;

  return released_count;
end;
$$;