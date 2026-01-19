-- ═══════════════════════════════════════════════════════════════════════════
-- Repair dependencies after 709_profiles table → view migration
-- Recreates RLS policies and ensures profiles data integrity
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Ensure 709_profiles view exists (may have been dropped by cascade)
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

-- 2) Ensure helper functions exist
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

-- 3) Profiles RLS policies
alter table public.profiles enable row level security;

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

-- 4) Tenants RLS policies
alter table public.tenants enable row level security;

drop policy if exists "Users can view their own tenant" on tenants;
create policy "Users can view their own tenant"
  on tenants for select
  using (
    public.is_super_admin() or
    id = public.current_user_tenant_id()
  );

drop policy if exists "Super admins can manage tenants" on tenants;
create policy "Super admins can manage tenants"
  on tenants for all
  using (public.is_super_admin());

-- 5) Tenant domains RLS policies (if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tenant_domains') then
    alter table public.tenant_domains enable row level security;
    
    execute 'drop policy if exists "Users can view their tenant domains" on tenant_domains';
    execute 'create policy "Users can view their tenant domains" on tenant_domains for select using (public.is_super_admin() or tenant_id = public.current_user_tenant_id())';
    
    execute 'drop policy if exists "Super admins can manage domains" on tenant_domains';
    execute 'create policy "Super admins can manage domains" on tenant_domains for all using (public.is_super_admin())';
  end if;
end $$;

-- 6) Tenant billing RLS policies (if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tenant_billing') then
    alter table public.tenant_billing enable row level security;
    
    execute 'drop policy if exists "Owners can view tenant billing" on tenant_billing';
    execute 'create policy "Owners can view tenant billing" on tenant_billing for select using (public.is_super_admin() or (tenant_id = public.current_user_tenant_id() and public.is_tenant_admin()))';
    
    execute 'drop policy if exists "Super admins can manage billing" on tenant_billing';
    execute 'create policy "Super admins can manage billing" on tenant_billing for all using (public.is_super_admin())';
  end if;
end $$;

-- 7) Tenant usage RLS policies (if table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'tenant_usage') then
    alter table public.tenant_usage enable row level security;
    
    execute 'drop policy if exists "Users can view their tenant usage" on tenant_usage';
    execute 'create policy "Users can view their tenant usage" on tenant_usage for select using (public.is_super_admin() or tenant_id = public.current_user_tenant_id())';
  end if;
end $$;

-- 8) Re-seed tom@openpeople.ai as super_admin (ensure profile exists)
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
    
    raise notice 'Super admin profile ensured for tom@openpeople.ai (id: %)', v_user_id;
  else
    raise notice 'User tom@openpeople.ai not found in auth.users';
  end if;
end $$;

-- 9) Ensure tenants exist with short slugs (709, swl)
-- Update existing slugs if they exist
update tenants set slug = '709' where slug = '709exclusive';
update tenants set slug = 'swl' where slug = 'snowwhitlaundry';

insert into tenants (name, slug, status, settings)
values (
  '709exclusive',
  '709',
  'active',
  jsonb_build_object(
    'features', jsonb_build_object('admin', true, 'ai_inventory', true, 'ai_chat', true, 'ai_analytics', true),
    'theme', jsonb_build_object('brand_name', '709exclusive'),
    'type', 'commerce'
  )
)
on conflict (slug) do update set status = 'active', updated_at = now();

insert into tenants (name, slug, status, settings)
values (
  'Snow Whit Laundry',
  'swl',
  'active',
  jsonb_build_object(
    'features', jsonb_build_object('admin', true, 'reservations', true, 'menu', true, 'events', true),
    'theme', jsonb_build_object('brand_name', 'Snow Whit Laundry'),
    'type', 'restaurant'
  )
)
on conflict (slug) do update set status = 'active', updated_at = now();
