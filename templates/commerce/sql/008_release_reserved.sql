-- Function for admin to manually release reserved inventory
create or replace function release_reserved_inventory_admin(
  variant_id_input uuid,
  qty_to_release integer
)
returns void
language plpgsql
security definer
as $$
begin
  -- Only allow if user is admin/owner
  if not exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin', 'owner')
  ) then
    raise exception 'Admin access required';
  end if;

  -- Release the specified amount from reserved
  update product_variants
  set reserved = greatest(reserved - qty_to_release, 0)
  where id = variant_id_input;

  if not found then
    raise exception 'Variant not found';
  end if;
end;
$$;