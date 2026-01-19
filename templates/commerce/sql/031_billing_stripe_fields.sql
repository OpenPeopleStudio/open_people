-- Add Stripe subscription tracking to tenant_billing

alter table tenant_billing 
add column if not exists stripe_subscription_id text;

-- Index for looking up by Stripe IDs
create index if not exists idx_tenant_billing_stripe_customer on tenant_billing(stripe_customer_id);
create index if not exists idx_tenant_billing_stripe_subscription on tenant_billing(stripe_subscription_id);
