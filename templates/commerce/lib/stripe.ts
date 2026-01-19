import Stripe from 'stripe'

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
)

// Stripe billing helpers for SaaS tenants
export async function createStripeCustomer(params: {
  email: string
  name: string
  metadata?: Record<string, string>
}): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata || {},
  })
}

export async function createSubscription(params: {
  customerId: string
  priceId: string
  trialDays?: number
  metadata?: Record<string, string>
}): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    trial_period_days: params.trialDays,
    metadata: params.metadata || {},
  })
}

export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
  })
}

export async function createBillingPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  })
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId)
}

export async function updateSubscription(params: {
  subscriptionId: string
  priceId?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Subscription> {
  const updates: Stripe.SubscriptionUpdateParams = {}
  
  if (params.priceId) {
    const subscription = await stripe.subscriptions.retrieve(params.subscriptionId)
    updates.items = [{
      id: subscription.items.data[0].id,
      price: params.priceId,
    }]
  }
  
  if (params.metadata) {
    updates.metadata = params.metadata
  }
  
  return stripe.subscriptions.update(params.subscriptionId, updates)
}