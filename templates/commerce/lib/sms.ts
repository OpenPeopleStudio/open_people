import type { SmsProvider } from '@/lib/integrations'

export type SmsPayload = {
  to: string
  body: string
  from?: string
}

function formEncode(data: Record<string, string>) {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

export async function sendSms(provider: SmsProvider, payload: SmsPayload): Promise<void> {
  if (provider === 'disabled') return

  if (provider !== 'twilio') {
    throw new Error(`Unsupported SMS provider: ${provider}`)
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = payload.from || process.env.TWILIO_FROM_NUMBER

  if (!accountSid) throw new Error('TWILIO_ACCOUNT_SID is not set')
  if (!authToken) throw new Error('TWILIO_AUTH_TOKEN is not set')
  if (!from) throw new Error('TWILIO_FROM_NUMBER is not set')

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode({
      To: payload.to,
      From: from,
      Body: payload.body,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Twilio SMS failed (${res.status}): ${text || res.statusText}`)
  }
}

