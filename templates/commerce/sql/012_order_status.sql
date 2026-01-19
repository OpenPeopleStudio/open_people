do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'pending',     -- order created, payment not confirmed
      'paid',        -- payment succeeded
      'fulfilled',   -- picked/packed
      'shipped',     -- handed to carrier
      'cancelled',   -- admin cancelled before shipment
      'refunded'     -- refunded after payment
    );
  end if;
end $$;

-- Convert status column to enum type
do $$
begin
  -- Drop default if it exists
  if exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'status'
    and column_default is not null
  ) then
    alter table orders alter column status drop default;
  end if;

  -- Change column type
  alter table orders alter column status type order_status using status::order_status;

  -- Set new default
  alter table orders alter column status set default 'pending'::order_status;
end $$;

alter table orders
add column if not exists paid_at timestamp,
add column if not exists fulfilled_at timestamp,
add column if not exists shipped_at timestamp,
add column if not exists cancelled_at timestamp,
add column if not exists refunded_at timestamp;