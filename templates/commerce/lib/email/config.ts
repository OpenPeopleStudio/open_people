import type { TenantSettings } from '@/types/tenant'

/**
 * Get email configuration for a tenant
 * Falls back to environment variables if tenant settings not configured
 */
export function getEmailConfig(settings?: TenantSettings) {
  const brandName = settings?.theme?.brand_name || process.env.BRAND_NAME || 'Store'
  const domain = process.env.EMAIL_DOMAIN || 'example.com'
  
  return {
    fromName: settings?.email?.from_name || brandName,
    fromEmail: settings?.email?.from_email || `noreply@${domain}`,
    supportEmail: settings?.email?.support_email || settings?.contact?.email || `support@${domain}`,
    ordersEmail: settings?.email?.orders_email || `orders@${domain}`,
    replyTo: settings?.email?.reply_to || settings?.contact?.email || `support@${domain}`,
    brandName,
  }
}

/**
 * Format email "from" field with name and address
 */
export function formatFrom(name: string, email: string): string {
  return `${name} <${email}>`
}

/**
 * Get email provider from tenant settings
 */
export function getEmailProvider(settings?: TenantSettings): 'sendgrid' | 'postmark' | 'resend' | 'disabled' {
  return settings?.integrations?.email?.provider || 'resend'
}
