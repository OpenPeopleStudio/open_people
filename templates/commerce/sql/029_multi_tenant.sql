-- Multi-tenant foundation for SaaS support

-- Tenants and domains
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  primary_domain text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  domain text not null unique,
  is_primary boolean not null default false,
  verified_at timestamp,
  created_at timestamp default now()
);

create table if not exists tenant_billing (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  plan text not null default 'starter',
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  billing_email text,
  stripe_customer_id text,
  trial_ends_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Default tenant (company site)
insert into tenants (name, slug, settings)
values (
  '709exclusive',
  '709exclusive',
  $json$
  {
    "theme": {
      "brand_name": "709exclusive",
      "logo_url": null,
      "colors": {
        "bg_primary": "#0B0B0C",
        "bg_secondary": "#121317",
        "bg_tertiary": "#1A1C22",
        "bg_elevated": "#20232B",
        "text_primary": "#F8F8F8",
        "text_secondary": "#C9CBD1",
        "text_muted": "#8A8F98",
        "accent": "#E10600",
        "accent_hover": "#FF1A14",
        "accent_muted": "#991A1A",
        "accent_blue": "#3B82F6",
        "accent_blue_hover": "#60A5FA",
        "accent_amber": "#F59E0B",
        "accent_amber_hover": "#FBBF24",
        "border_primary": "#272A33",
        "border_secondary": "#343846",
        "success": "#22C55E",
        "warning": "#EAB308",
        "error": "#EF4444"
      }
    },
    "content": {
      "hero": {
        "eyebrow": "709exclusive",
        "headline": "Authentic sneakers with local delivery and pickup.",
        "subhead": "A modern resale marketplace built for Newfoundland. Shop verified inventory, pay with card or crypto, and track every order in one place.",
        "primary_cta": { "label": "Browse inventory", "href": "/shop" },
        "secondary_cta": { "label": "New arrivals", "href": "/shop?sort=newest" }
      },
      "features": [
        { "title": "Local delivery", "description": "Same-day in St. John's with real-time order updates." },
        { "title": "Pickup ready", "description": "Skip the wait and pick up in-store as soon as it's verified." },
        { "title": "Card + crypto", "description": "Pay with Stripe cards or NOWPayments crypto at checkout." }
      ]
    },
    "features": {
      "drops": true,
      "wishlist": true,
      "messages": true,
      "e2e_encryption": true,
      "crypto_payments": true,
      "local_delivery": true,
      "pickup": true,
      "admin": true,
      "consignments": true
    },
    "integrations": {
      "payments": { "provider": "stripe", "crypto_provider": "nowpayments" },
      "email": { "provider": "sendgrid" },
      "delivery": { "provider": "internal" }
    },
    "commerce": { "currency": "cad" }
  }
  $json$::jsonb
)
on conflict (slug) do update
set name = excluded.name;

-- Tenant ownership on core tables
alter table "709_profiles" add column if not exists tenant_id uuid references tenants(id);
alter table products add column if not exists tenant_id uuid references tenants(id);
alter table product_variants add column if not exists tenant_id uuid references tenants(id);
alter table product_images add column if not exists tenant_id uuid references tenants(id);
alter table orders add column if not exists tenant_id uuid references tenants(id);
alter table order_items add column if not exists tenant_id uuid references tenants(id);
alter table product_models add column if not exists tenant_id uuid references tenants(id);
alter table model_images add column if not exists tenant_id uuid references tenants(id);
alter table inventory_audit add column if not exists tenant_id uuid references tenants(id);
alter table messages add column if not exists tenant_id uuid references tenants(id);
alter table returns add column if not exists tenant_id uuid references tenants(id);
alter table consignors add column if not exists tenant_id uuid references tenants(id);
alter table consignment_items add column if not exists tenant_id uuid references tenants(id);
alter table consignment_payouts add column if not exists tenant_id uuid references tenants(id);
alter table shipping_methods add column if not exists tenant_id uuid references tenants(id);
alter table local_delivery_zones add column if not exists tenant_id uuid references tenants(id);
alter table wishlist_items add column if not exists tenant_id uuid references tenants(id);
alter table stock_alerts add column if not exists tenant_id uuid references tenants(id);
alter table drop_alerts add column if not exists tenant_id uuid references tenants(id);
alter table recently_viewed add column if not exists tenant_id uuid references tenants(id);
alter table user_preferences add column if not exists tenant_id uuid references tenants(id);
alter table price_history add column if not exists tenant_id uuid references tenants(id);
alter table site_flags add column if not exists tenant_id uuid references tenants(id);
alter table staff_locations add column if not exists tenant_id uuid references tenants(id);
alter table activity_logs add column if not exists tenant_id uuid references tenants(id);
alter table pricing_rules add column if not exists tenant_id uuid references tenants(id);

-- Adjust uniqueness for multi-tenant data
alter table products drop constraint if exists products_slug_key;
create unique index if not exists idx_products_tenant_slug on products(tenant_id, slug);

alter table product_models drop constraint if exists product_models_slug_key;
create unique index if not exists idx_product_models_tenant_slug on product_models(tenant_id, slug);

alter table shipping_methods drop constraint if exists shipping_methods_code_key;
create unique index if not exists idx_shipping_methods_tenant_code on shipping_methods(tenant_id, code);

alter table local_delivery_zones drop constraint if exists local_delivery_zones_country_province_name_key;
create unique index if not exists idx_local_delivery_zones_tenant_key on local_delivery_zones(tenant_id, country, province, name);

alter table consignors drop constraint if exists consignors_email_key;
create unique index if not exists idx_consignors_tenant_email on consignors(tenant_id, email);

-- Tenant indexes
create index if not exists idx_profiles_tenant_id on "709_profiles"(tenant_id);
create index if not exists idx_products_tenant_id on products(tenant_id);
create index if not exists idx_variants_tenant_id on product_variants(tenant_id);
create index if not exists idx_product_images_tenant_id on product_images(tenant_id);
create index if not exists idx_orders_tenant_id on orders(tenant_id);
create index if not exists idx_order_items_tenant_id on order_items(tenant_id);
create index if not exists idx_product_models_tenant_id on product_models(tenant_id);
create index if not exists idx_model_images_tenant_id on model_images(tenant_id);
create index if not exists idx_inventory_audit_tenant_id on inventory_audit(tenant_id);
create index if not exists idx_messages_tenant_id on messages(tenant_id);
create index if not exists idx_returns_tenant_id on returns(tenant_id);
create index if not exists idx_consignors_tenant_id on consignors(tenant_id);
create index if not exists idx_consignment_items_tenant_id on consignment_items(tenant_id);
create index if not exists idx_consignment_payouts_tenant_id on consignment_payouts(tenant_id);
create index if not exists idx_shipping_methods_tenant_id on shipping_methods(tenant_id);
create index if not exists idx_local_delivery_zones_tenant_id on local_delivery_zones(tenant_id);
create index if not exists idx_wishlist_tenant_id on wishlist_items(tenant_id);
create index if not exists idx_stock_alerts_tenant_id on stock_alerts(tenant_id);
create index if not exists idx_drop_alerts_tenant_id on drop_alerts(tenant_id);
create index if not exists idx_recently_viewed_tenant_id on recently_viewed(tenant_id);
create index if not exists idx_user_preferences_tenant_id on user_preferences(tenant_id);
create index if not exists idx_price_history_tenant_id on price_history(tenant_id);
create index if not exists idx_site_flags_tenant_id on site_flags(tenant_id);
create index if not exists idx_staff_locations_tenant_id on staff_locations(tenant_id);
create index if not exists idx_activity_logs_tenant_id on activity_logs(tenant_id);
create index if not exists idx_pricing_rules_tenant_id on pricing_rules(tenant_id);

-- Backfill tenant_id using default tenant or related data
do $$
declare
  default_tenant uuid;
begin
  select id into default_tenant from tenants where slug = '709exclusive' limit 1;

  update "709_profiles" set tenant_id = default_tenant where tenant_id is null;
  update products set tenant_id = default_tenant where tenant_id is null;

  update product_variants pv
  set tenant_id = p.tenant_id
  from products p
  where pv.tenant_id is null and pv.product_id = p.id;
  update product_variants set tenant_id = default_tenant where tenant_id is null;

  update product_images pi
  set tenant_id = p.tenant_id
  from products p
  where pi.tenant_id is null and pi.product_id = p.id;
  update product_images set tenant_id = default_tenant where tenant_id is null;

  update orders set tenant_id = default_tenant where tenant_id is null;

  update order_items oi
  set tenant_id = o.tenant_id
  from orders o
  where oi.tenant_id is null and oi.order_id = o.id;
  update order_items set tenant_id = default_tenant where tenant_id is null;

  update product_models set tenant_id = default_tenant where tenant_id is null;

  update model_images mi
  set tenant_id = pm.tenant_id
  from product_models pm
  where mi.tenant_id is null and mi.model_id = pm.id;
  update model_images set tenant_id = default_tenant where tenant_id is null;

  update inventory_audit ia
  set tenant_id = pv.tenant_id
  from product_variants pv
  where ia.tenant_id is null and ia.variant_id = pv.id;
  update inventory_audit set tenant_id = default_tenant where tenant_id is null;

  update messages m
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where m.tenant_id is null and m.customer_id = p.id;
  update messages set tenant_id = default_tenant where tenant_id is null;

  update returns r
  set tenant_id = o.tenant_id
  from orders o
  where r.tenant_id is null and r.order_id = o.id;
  update returns set tenant_id = default_tenant where tenant_id is null;

  update consignors set tenant_id = default_tenant where tenant_id is null;
  update consignment_items set tenant_id = default_tenant where tenant_id is null;
  update consignment_payouts set tenant_id = default_tenant where tenant_id is null;

  update shipping_methods set tenant_id = default_tenant where tenant_id is null;
  update local_delivery_zones set tenant_id = default_tenant where tenant_id is null;

  update wishlist_items wi
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where wi.tenant_id is null and wi.user_id = p.id;
  update wishlist_items set tenant_id = default_tenant where tenant_id is null;

  update stock_alerts sa
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where sa.tenant_id is null and sa.user_id = p.id;
  update stock_alerts set tenant_id = default_tenant where tenant_id is null;

  update drop_alerts da
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where da.tenant_id is null and da.user_id = p.id;
  update drop_alerts set tenant_id = default_tenant where tenant_id is null;

  update recently_viewed rv
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where rv.tenant_id is null and rv.user_id = p.id;
  update recently_viewed set tenant_id = default_tenant where tenant_id is null;

  update user_preferences up
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where up.tenant_id is null and up.user_id = p.id;
  update user_preferences set tenant_id = default_tenant where tenant_id is null;

  update price_history ph
  set tenant_id = pv.tenant_id
  from product_variants pv
  where ph.tenant_id is null and ph.variant_id = pv.id;
  update price_history set tenant_id = default_tenant where tenant_id is null;

  update site_flags set tenant_id = default_tenant where tenant_id is null;
  update staff_locations sl
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where sl.tenant_id is null and sl.user_id = p.id;
  update staff_locations set tenant_id = default_tenant where tenant_id is null;

  update activity_logs al
  set tenant_id = p.tenant_id
  from "709_profiles" p
  where al.tenant_id is null and al.user_id = p.id;
  update activity_logs set tenant_id = default_tenant where tenant_id is null;

  update pricing_rules set tenant_id = default_tenant where tenant_id is null;
end $$;

-- Update helper view to include tenant context
drop view if exists variant_availability;
create view variant_availability as
select
  id,
  tenant_id,
  stock,
  reserved,
  (stock - reserved) as available
from product_variants;

-- Update admin analytics view for tenant scope
drop view if exists admin_variant_analytics;
create view admin_variant_analytics as
select
  pv.id,
  pv.tenant_id,
  pv.sku,
  pv.stock,
  pv.reserved,
  coalesce(sum(oi.qty), 0) as sold_units,
  case
    when (coalesce(sum(oi.qty),0) + pv.stock) = 0 then 0
    else
      coalesce(sum(oi.qty),0)::float /
      (coalesce(sum(oi.qty),0) + pv.stock)
  end as sell_through_rate,
  pv.first_sold_at,
  case
    when pv.first_sold_at is not null
    then extract(epoch from (pv.first_sold_at - p.created_at))/86400
    else null
  end as days_to_first_sale
from product_variants pv
left join products p on p.id = pv.product_id
left join order_items oi on oi.variant_id = pv.id
group by pv.id, pv.tenant_id, p.created_at;

-- Update price history trigger to carry tenant_id
create or replace function record_price_on_sale()
returns trigger as $$
begin
  if new.status = 'paid' and old.status != 'paid' then
    insert into price_history (tenant_id, variant_id, price_cents)
    select new.tenant_id, oi.variant_id, oi.price_cents
    from order_items oi
    where oi.order_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Update stock alert trigger for tenant scope
create or replace function check_stock_alerts()
returns trigger as $$
declare
  product_name text;
begin
  if new.stock > old.stock then
    select p.name into product_name
    from products p
    where p.id = new.product_id;

    update stock_alerts
    set notified_at = now()
    where tenant_id = new.tenant_id
      and product_id = new.product_id
      and size = new.size
      and (condition_code is null or condition_code = new.condition_code)
      and notified_at is null;
  end if;
  return new;
end;
$$ language plpgsql;

-- Update auto-profile trigger to store tenant_id
create or replace function public.handle_new_user()
returns trigger as $$
declare
  resolved_tenant uuid;
begin
  if new.raw_user_meta_data ? 'tenant_id' then
    resolved_tenant := (new.raw_user_meta_data->>'tenant_id')::uuid;
  elsif new.raw_user_meta_data ? 'tenant_slug' then
    select id into resolved_tenant from public.tenants where slug = new.raw_user_meta_data->>'tenant_slug' limit 1;
  end if;

  if resolved_tenant is null then
    select id into resolved_tenant from public.tenants where slug = '709exclusive' limit 1;
  end if;

  insert into public."709_profiles" (id, role, full_name, tenant_id, created_at)
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data->>'full_name', null),
    resolved_tenant,
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;
