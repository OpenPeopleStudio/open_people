import Stripe from 'stripe'

export type StripePaymentIntent = Stripe.PaymentIntent
export type StripeEvent = Stripe.Event
export type StripeWebhookEvent = Stripe.Event