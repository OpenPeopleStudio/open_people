alter table "709_profiles" enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Users read own profile"
on "709_profiles" for select
using (auth.uid() = id);

create policy "Customers read own orders"
on orders for select
using (auth.uid() = customer_id);

create policy "Admins read all orders"
on orders for select
using (
  exists (
    select 1 from "709_profiles"
    where id = auth.uid()
    and role in ('admin','owner')
  )
);