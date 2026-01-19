-- Comprehensive RLS policies for multi-tenant isolation
-- This migration ensures tenant_id is enforced across all queries

-- Helper function to get current user's tenant_id
create or replace function auth.current_user_tenant_id()
returns uuid as $$
  select tenant_id from public."709_profiles"
  where id = auth.uid()
  limit 1;
$$ language sql stable;

-- Helper function to check if user is super admin
create or replace function auth.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public."709_profiles"
    where id = auth.uid()
    and role = 'super_admin'
  );
$$ language sql stable;

-- Helper function to check if user is tenant admin
create or replace function auth.is_tenant_admin()
returns boolean as $$
  select exists (
    select 1 from public."709_profiles"
    where id = auth.uid()
    and role in ('admin', 'owner')
  );
$$ language sql stable;

-- Tenants table policies (super admin only)
drop policy if exists "Super admins can view all tenants" on tenants;
create policy "Super admins can view all tenants"
on tenants for select
using (auth.is_super_admin());

drop policy if exists "Super admins can manage tenants" on tenants;
create policy "Super admins can manage tenants"
on tenants for all
using (auth.is_super_admin());

-- Tenant domains (super admin and tenant owners)
drop policy if exists "Tenant owners can view their domains" on tenant_domains;
create policy "Tenant owners can view their domains"
on tenant_domains for select
using (
  auth.is_super_admin() or
  tenant_id = auth.current_user_tenant_id()
);

drop policy if exists "Super admins can manage all domains" on tenant_domains;
create policy "Super admins can manage all domains"
on tenant_domains for all
using (auth.is_super_admin());

-- Tenant billing (super admin and tenant owners)
drop policy if exists "Tenant owners can view their billing" on tenant_billing;
create policy "Tenant owners can view their billing"
on tenant_billing for select
using (
  auth.is_super_admin() or
  tenant_id = auth.current_user_tenant_id()
);

drop policy if exists "Super admins can manage billing" on tenant_billing;
create policy "Super admins can manage billing"
on tenant_billing for all
using (auth.is_super_admin());

-- Profiles: Users can only see profiles in their tenant
drop policy if exists "Users read own profile" on "709_profiles";
create policy "Users read own profile"
on "709_profiles" for select
using (
  auth.is_super_admin() or
  (auth.uid() = id and tenant_id = auth.current_user_tenant_id())
);

drop policy if exists "Admins read tenant profiles" on "709_profiles";
create policy "Admins read tenant profiles"
on "709_profiles" for select
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Products: Tenant isolation
drop policy if exists "Public can view active tenant products" on products;
create policy "Public can view active tenant products"
on products for select
using (tenant_id = auth.current_user_tenant_id() or auth.is_super_admin());

drop policy if exists "Admins manage tenant products" on products;
create policy "Admins manage tenant products"
on products for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Product variants: Tenant isolation
drop policy if exists "Public can view tenant variants" on product_variants;
create policy "Public can view tenant variants"
on product_variants for select
using (tenant_id = auth.current_user_tenant_id() or auth.is_super_admin());

drop policy if exists "Admins manage tenant variants" on product_variants;
create policy "Admins manage tenant variants"
on product_variants for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Product images: Tenant isolation
drop policy if exists "Public can view tenant images" on product_images;
create policy "Public can view tenant images"
on product_images for select
using (tenant_id = auth.current_user_tenant_id() or auth.is_super_admin());

drop policy if exists "Admins manage tenant images" on product_images;
create policy "Admins manage tenant images"
on product_images for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Orders: Customers see own, admins see all in tenant
drop policy if exists "Customers read own orders" on orders;
create policy "Customers read own orders"
on orders for select
using (
  auth.is_super_admin() or
  (auth.uid() = customer_id and tenant_id = auth.current_user_tenant_id())
);

drop policy if exists "Admins read all orders" on orders;
drop policy if exists "Admins read tenant orders" on orders;
create policy "Admins read tenant orders"
on orders for select
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

drop policy if exists "Admins manage tenant orders" on orders;
create policy "Admins manage tenant orders"
on orders for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Order items: Follow order permissions
drop policy if exists "Users view order items via orders" on order_items;
create policy "Users view order items via orders"
on order_items for select
using (
  auth.is_super_admin() or
  tenant_id = auth.current_user_tenant_id()
);

drop policy if exists "Admins manage tenant order items" on order_items;
create policy "Admins manage tenant order items"
on order_items for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Messages: Tenant isolation
drop policy if exists "Users read own messages" on messages;
create policy "Users read own messages"
on messages for select
using (
  auth.is_super_admin() or
  (tenant_id = auth.current_user_tenant_id() and (
    customer_id = auth.uid() or auth.is_tenant_admin()
  ))
);

drop policy if exists "Users create messages in tenant" on messages;
create policy "Users create messages in tenant"
on messages for insert
with check (tenant_id = auth.current_user_tenant_id());

drop policy if exists "Admins manage tenant messages" on messages;
create policy "Admins manage tenant messages"
on messages for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Product models: Tenant isolation
drop policy if exists "Public view tenant models" on product_models;
create policy "Public view tenant models"
on product_models for select
using (tenant_id = auth.current_user_tenant_id() or auth.is_super_admin());

drop policy if exists "Admins manage tenant models" on product_models;
create policy "Admins manage tenant models"
on product_models for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Inventory audit: Tenant isolation
drop policy if exists "Admins view tenant inventory audit" on inventory_audit;
create policy "Admins view tenant inventory audit"
on inventory_audit for select
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

drop policy if exists "System insert inventory audit" on inventory_audit;
create policy "System insert inventory audit"
on inventory_audit for insert
with check (tenant_id = auth.current_user_tenant_id() or auth.is_super_admin());

-- Consignors: Tenant isolation
drop policy if exists "Admins manage tenant consignors" on consignors;
create policy "Admins manage tenant consignors"
on consignors for all
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Wishlist: Users own data in tenant
drop policy if exists "Users manage own wishlist" on wishlist_items;
create policy "Users manage own wishlist"
on wishlist_items for all
using (
  auth.is_super_admin() or
  (auth.uid() = user_id and tenant_id = auth.current_user_tenant_id())
);

-- Stock alerts: Users own data in tenant
drop policy if exists "Users manage own stock alerts" on stock_alerts;
create policy "Users manage own stock alerts"
on stock_alerts for all
using (
  auth.is_super_admin() or
  (auth.uid() = user_id and tenant_id = auth.current_user_tenant_id())
);

-- Activity logs: Tenant isolation
drop policy if exists "Admins view tenant activity logs" on activity_logs;
create policy "Admins view tenant activity logs"
on activity_logs for select
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

drop policy if exists "System create activity logs" on activity_logs;
create policy "System create activity logs"
on activity_logs for insert
with check (tenant_id = auth.current_user_tenant_id() or auth.is_super_admin());

-- Staff locations: Tenant isolation
drop policy if exists "Staff manage own locations" on staff_locations;
create policy "Staff manage own locations"
on staff_locations for all
using (
  auth.is_super_admin() or
  (auth.uid() = user_id and tenant_id = auth.current_user_tenant_id())
);

drop policy if exists "Admins view tenant staff locations" on staff_locations;
create policy "Admins view tenant staff locations"
on staff_locations for select
using (
  auth.is_super_admin() or
  (auth.is_tenant_admin() and tenant_id = auth.current_user_tenant_id())
);

-- Enable RLS on all tenant-scoped tables
alter table tenants enable row level security;
alter table tenant_domains enable row level security;
alter table tenant_billing enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table order_items enable row level security;
alter table product_models enable row level security;
alter table model_images enable row level security;
alter table inventory_audit enable row level security;
alter table messages enable row level security;
alter table returns enable row level security;
alter table consignors enable row level security;
alter table consignment_items enable row level security;
alter table consignment_payouts enable row level security;
alter table shipping_methods enable row level security;
alter table local_delivery_zones enable row level security;
alter table wishlist_items enable row level security;
alter table stock_alerts enable row level security;
alter table drop_alerts enable row level security;
alter table recently_viewed enable row level security;
alter table user_preferences enable row level security;
alter table price_history enable row level security;
alter table site_flags enable row level security;
alter table staff_locations enable row level security;
alter table activity_logs enable row level security;
alter table pricing_rules enable row level security;
