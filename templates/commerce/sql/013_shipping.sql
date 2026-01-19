alter table orders
add column if not exists shipping_address jsonb not null,
add column if not exists shipping_cents integer not null default 0,
add column if not exists shipping_method text,
add column if not exists tracking_number text,
add column if not exists carrier text;