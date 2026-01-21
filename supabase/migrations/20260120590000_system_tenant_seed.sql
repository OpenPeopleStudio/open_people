-- Ensure a system tenant exists for global defaults (e.g., shared email labels)
insert into tenants (id, name, slug, status, settings)
values ('00000000-0000-0000-0000-000000000000', 'System', 'system', 'active', '{}'::jsonb)
on conflict (id) do nothing;
