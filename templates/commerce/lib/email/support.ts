import sendgrid from '@sendgrid/mail'
import * as postmark from 'postmark'
import type { EmailProvider } from '@/lib/integrations'
import { sendResendEmail } from '@/lib/email/resend'

export type SupportEmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
  fromEmail?: string
  fromName?: string
}

export async function sendSupportEmail(
  provider: EmailProvider,
  payload: SupportEmailPayload
): Promise<void> {
  if (provider === 'disabled') return

  if (provider === 'resend') {
    await sendResendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      fromEmail: payload.fromEmail,
      fromName: payload.fromName,
    })
    return
  }

  if (provider === 'postmark') {
    const apiKey = process.env.POSTMARK_API_KEY
    if (!apiKey) throw new Error('POSTMARK_API_KEY is not set')
    const client = new postmark.ServerClient(apiKey)
    await client.sendEmail({
      From: payload.fromEmail || 'support@709exclusive.com',
      To: payload.to,
      Subject: payload.subject,
      HtmlBody: payload.html,
      TextBody: payload.text,
      MessageStream: 'outbound',
    })
    return
  }

  // Default: sendgrid
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) throw new Error('SENDGRID_API_KEY is not set')
  sendgrid.setApiKey(apiKey)
  await sendgrid.send({
    to: payload.to,
    from: {
      email: payload.fromEmail || 'support@709exclusive.com',
      name: payload.fromName || 'Support',
    },
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
}

