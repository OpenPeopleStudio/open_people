import type { TenantSettings } from '@/types/tenant'

export type PaymentProvider = 'stripe' | 'manual'
export type CryptoProvider = 'nowpayments' | 'disabled'
export type EmailProvider = 'sendgrid' | 'postmark' | 'resend' | 'disabled'
export type SmsProvider = 'twilio' | 'disabled'
export type DeliveryProvider = 'internal' | 'manual'

export function resolvePaymentProvider(settings?: TenantSettings): PaymentProvider {
  return settings?.integrations?.payments?.provider ?? 'stripe'
}

export function resolveCryptoProvider(settings?: TenantSettings): CryptoProvider {
  return settings?.integrations?.payments?.crypto_provider ?? 'nowpayments'
}

export function resolveEmailProvider(settings?: TenantSettings): EmailProvider {
  return settings?.integrations?.email?.provider ?? 'sendgrid'
}

export function resolveSmsProvider(settings?: TenantSettings): SmsProvider {
  return settings?.integrations?.sms?.provider ?? 'disabled'
}

export function resolveDeliveryProvider(settings?: TenantSettings): DeliveryProvider {
  return settings?.integrations?.delivery?.provider ?? 'internal'
}
