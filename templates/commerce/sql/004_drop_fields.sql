alter table products
add column if not exists drop_starts_at timestamp,
add column if not exists drop_ends_at timestamp,
add column if not exists is_drop boolean default false;