import type { EmailProvider } from '@/lib/integrations'
import type { TenantSettings } from '@/types/tenant'
import { getEmailConfig, formatFrom } from './config'

type ResendEmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
  fromEmail?: string
  fromName?: string
  tenantSettings?: TenantSettings
}

function getResendApiKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('Resend API key not configured. Please set RESEND_API_KEY environment variable.')
  }
  return key
}

function getResendFrom(payload: Pick<ResendEmailPayload, 'fromEmail' | 'fromName' | 'tenantSettings'>) {
  const config = getEmailConfig(payload.tenantSettings)
  const fromEmail = payload.fromEmail || config.fromEmail
  const fromName = payload.fromName || config.fromName
  return formatFrom(fromName, fromEmail)
}

export async function sendResendEmail(payload: ResendEmailPayload): Promise<void> {
  const key = getResendApiKey()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getResendFrom(payload),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let errorMessage = `Resend email failed (${res.status})`
    
    try {
      const errorData = JSON.parse(text)
      if (errorData.message) {
        errorMessage = `Resend: ${errorData.message}`
      } else if (errorData.error) {
        errorMessage = `Resend: ${errorData.error}`
      }
    } catch {
      if (text) {
        errorMessage = `Resend: ${text}`
      }
    }
    
    throw new Error(errorMessage)
  }
}

// Convenience guard for callers already switching on EmailProvider
export function assertResendProvider(provider: EmailProvider) {
  if (provider !== 'resend') throw new Error('Expected provider to be resend')
}

