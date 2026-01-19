-- ═══════════════════════════════════════════════════════════════════════════
-- Multi-tenant alignment
-- - 709exclusive is a TENANT (row in tenants table), not a profile table
-- - profiles table stores user profiles linked to tenants via tenant_id
-- - super_admin users have tenant_id = NULL (platform-wide access)
-- - Seed 709exclusive tenant, Snow Whit Laundry tenant, and link users
-- ═══════════════════════════════════════════════════════════════════════════

-- 0) Ensure enum user_role has required values
do $$
declare
  enum_exists boolean;
  has_super_admin boolean;
  has_member boolean;
  has_customer boolean;
begin
  select exists (select 1 from pg_type t where t.typname = 'user_role') into enum_exists;

  if enum_exists then
    select exists (
      select 1 from pg_type t join pg_enum e on t.oid = e.enumtypid
      where t.typname = 'user_role' and e.enumlabel = 'super_admin'
    ) into has_super_admin;
    if not has_super_admin then
      alter type user_role add value 'super_admin';
    end if;

    select exists (
      select 1 from pg_type t join pg_enum e on t.oid = e.enumtypid
      where t.typname = 'user_role' and e.enumlabel = 'member'
    ) into has_member;
    if not has_member then
      alter type user_role add value 'member';
    end if;

    select exists (
      select 1 from pg_type t join pg_enum e on t.oid = e.enumtypid
      where t.typname = 'user_role' and e.enumlabel = 'customer'
    ) into has_customer;
    if not has_customer then
      alter type user_role add value 'customer';
    end if;
  end if;
end $$;

-- 1) Ensure profiles table exists with required columns
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'customer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if missing (idempotent)
alter table public.profiles add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Enable RLS
alter table public.profiles enable row level security;

-- 2) Create compatibility view "709_profiles" pointing to profiles
--    (code/RLS helpers that reference "709_profiles" will still work)
--    First drop table if it exists, then create view
do $$
declare
  v_has_email boolean;
  v_has_full_name boolean;
  v_has_avatar_url boolean;
  v_sql text;
begin
  -- Check if 709_profiles is a table (not a view)
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = '709_profiles' and c.relkind = 'r'
  ) then
    -- Check which columns exist in 709_profiles
    select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = '709_profiles' and column_name = 'email') into v_has_email;
    select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = '709_profiles' and column_name = 'full_name') into v_has_full_name;
    select exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = '709_profiles' and column_name = 'avatar_url') into v_has_avatar_url;

    -- Migrate data from 709_profiles table to profiles before dropping
    -- Only copy id, tenant_id, role (guaranteed to exist) plus any optional columns
    insert into public.profiles (id, tenant_id, role)
    select id, tenant_id, role::text
    from public."709_profiles"
    on conflict (id) do update
      set tenant_id = excluded.tenant_id,
          role = excluded.role;

    -- Drop the table
    drop table public."709_profiles" cascade;
  elsif exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = '709_profiles' and c.relkind = 'v'
  ) then
    -- It's already a view, drop it to recreate
    drop view public."709_profiles" cascade;
  end if;
end $$;

create or replace view public."709_profiles" as
select
  id,
  tenant_id,
  email,
  full_name,
  avatar_url,
  role,
  created_at,
  updated_at
from public.profiles;

-- 3) RLS helper functions (in public schema since we can't write to auth schema)
create or replace function public.current_user_tenant_id()
returns uuid as $$
  select tenant_id from public.profiles
  where id = auth.uid()
  limit 1;
$$ language sql stable security definer;

create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'super_admin'
  );
$$ language sql stable security definer;

create or replace function public.is_tenant_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'owner')
  );
$$ language sql stable security definer;

-- 4) Seed 709exclusive tenant (the commerce platform tenant)
insert into tenants (name, slug, status, settings)
values (
  '709exclusive',
  '709exclusive',
  'active',
  jsonb_build_object(
    'features', jsonb_build_object(
      'admin', true,
      'ai_inventory', true,
      'ai_chat', true,
      'ai_analytics', true
    ),
    'theme', jsonb_build_object('brand_name', '709exclusive'),
    'type', 'commerce'
  )
)
on conflict (slug) do update
  set status = 'active',
      updated_at = now();

-- 5) Seed Snow Whit Laundry tenant (the restaurant tenant)
insert into tenants (name, slug, status, settings)
values (
  'Snow Whit Laundry',
  'snowwhitlaundry',
  'active',
  jsonb_build_object(
    'features', jsonb_build_object(
      'admin', true,
      'reservations', true,
      'menu', true,
      'events', true
    ),
    'theme', jsonb_build_object('brand_name', 'Snow Whit Laundry'),
    'type', 'restaurant'
  )
)
on conflict (slug) do update
  set status = 'active',
      updated_at = now();

-- 6) Ensure tom@openpeople.ai is super_admin (tenant_id NULL = platform-wide)
do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = 'tom@openpeople.ai' limit 1;

  if v_user_id is not null then
    insert into profiles (id, tenant_id, email, full_name, role)
    values (v_user_id, null, 'tom@openpeople.ai', 'Tom', 'super_admin')
    on conflict (id) do update
      set role = 'super_admin',
          tenant_id = null,
          email = 'tom@openpeople.ai',
          full_name = coalesce(profiles.full_name, 'Tom');
  end if;
end $$;

-- 7) Link house@snowwhitlaundry.co as owner of Snow Whit Laundry tenant
do $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
begin
  select id into v_user_id from auth.users where lower(email) = 'house@snowwhitlaundry.co' limit 1;
  select id into v_tenant_id from tenants where slug = 'snowwhitlaundry' limit 1;

  if v_user_id is not null and v_tenant_id is not null then
    insert into profiles (id, tenant_id, email, full_name, role)
    values (v_user_id, v_tenant_id, 'house@snowwhitlaundry.co', 'Snow Whit Laundry', 'owner')
    on conflict (id) do update
      set tenant_id = v_tenant_id,
          role = 'owner',
          email = 'house@snowwhitlaundry.co',
          full_name = coalesce(profiles.full_name, 'Snow Whit Laundry');
  end if;
end $$;

-- 8) Basic RLS policies for profiles
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (id = auth.uid() or public.is_super_admin());

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

drop policy if exists "Admins can view tenant profiles" on profiles;
create policy "Admins can view tenant profiles"
  on profiles for select
  using (
    public.is_super_admin() or
    (public.is_tenant_admin() and tenant_id = public.current_user_tenant_id())
  );

drop policy if exists "Super admins can manage all profiles" on profiles;
create policy "Super admins can manage all profiles"
  on profiles for all
  using (public.is_super_admin());
