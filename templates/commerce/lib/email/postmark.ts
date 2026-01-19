import * as postmark from 'postmark'
import type { TenantSettings } from '@/types/tenant'
import { getEmailConfig } from './config'

const getClient = () => {
  const apiKey = process.env.POSTMARK_API_KEY
  if (!apiKey) {
    throw new Error('POSTMARK_API_KEY is not set')
  }
  return new postmark.ServerClient(apiKey)
}

interface EmailData {
  orderId: string
  customerEmail: string
  items: Array<{
    sku: string
    name: string
    size: string | null
    condition: string
    quantity: number
    price: number
  }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: {
    name: string
    line1: string
    line2?: string
    city: string
    province: string
    postal_code: string
    country: string
  }
  trackingNumber?: string
  carrier?: string
  tenantSettings?: TenantSettings
}

interface InviteEmailData {
  inviteeEmail: string
  inviteLink: string
  tenantName: string
  role: string
  inviterEmail?: string | null
  tenantSettings?: TenantSettings
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function formatAddress(address: EmailData['shippingAddress']): string {
  return `${address.name}
${address.line1}${address.line2 ? `\n${address.line2}` : ''}
${address.city}, ${address.province} ${address.postal_code}
${address.country}`
}

export async function sendOrderConfirmation(data: EmailData): Promise<void> {
  const client = getClient()
  const emailConfig = getEmailConfig(data.tenantSettings)
  const itemsHtml = data.items.map(item =>
    `<tr>
      <td>${item.sku}</td>
      <td>${item.name}${item.size ? ` (${item.size})` : ''} - ${item.condition}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price * item.quantity)}</td>
    </tr>`
  ).join('')

  await client.sendEmail({
    From: emailConfig.ordersEmail,
    To: data.customerEmail,
    Subject: `Order Confirmation - ${data.orderId}`,
    HtmlBody: `
      <h1>Thank you for your order!</h1>
      <p>Order ID: ${data.orderId}</p>

      <h2>Items Ordered</h2>
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h2>Order Summary</h2>
      <p>Subtotal: ${formatCurrency(data.subtotal)}</p>
      <p>Shipping: ${formatCurrency(data.shipping)}</p>
      <p><strong>Total: ${formatCurrency(data.total)}</strong></p>

      <h2>Shipping Address</h2>
      <pre>${formatAddress(data.shippingAddress)}</pre>

      <p>We'll send you another email when your order ships.</p>
      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `,
    MessageStream: 'outbound'
  })
}

export async function sendOrderShipped(data: EmailData): Promise<void> {
  const client = getClient()
  const emailConfig = getEmailConfig(data.tenantSettings)
  const trackingInfo = data.trackingNumber && data.carrier
    ? `<p>Tracking: ${data.trackingNumber} (${data.carrier})</p>`
    : ''

  await client.sendEmail({
    From: emailConfig.ordersEmail,
    To: data.customerEmail,
    Subject: `Your order has shipped - ${data.orderId}`,
    HtmlBody: `
      <h1>Your order has shipped!</h1>
      <p>Order ID: ${data.orderId}</p>

      ${trackingInfo}

      <h2>Shipping Address</h2>
      <pre>${formatAddress(data.shippingAddress)}</pre>

      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `,
    MessageStream: 'outbound'
  })
}

export async function sendOrderCancelled(data: EmailData): Promise<void> {
  const client = getClient()
  const emailConfig = getEmailConfig(data.tenantSettings)
  await client.sendEmail({
    From: emailConfig.ordersEmail,
    To: data.customerEmail,
    Subject: `Order Cancelled - ${data.orderId}`,
    HtmlBody: `
      <h1>Order Cancelled</h1>
      <p>We're sorry, but your order ${data.orderId} has been cancelled.</p>
      <p>If you were charged, your payment will be refunded within 5-7 business days.</p>
      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `,
    MessageStream: 'outbound'
  })
}

export async function sendOrderRefunded(data: EmailData): Promise<void> {
  const client = getClient()
  const emailConfig = getEmailConfig(data.tenantSettings)
  await client.sendEmail({
    From: emailConfig.ordersEmail,
    To: data.customerEmail,
    Subject: `Refund Processed - ${data.orderId}`,
    HtmlBody: `
      <h1>Refund Processed</h1>
      <p>Your refund for order ${data.orderId} has been processed.</p>
      <p>Amount: ${formatCurrency(data.total)}</p>
      <p>Please allow 5-7 business days for the refund to appear on your account.</p>
      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `,
    MessageStream: 'outbound'
  })
}

export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  let client
  try {
    client = getClient()
  } catch (error) {
    throw new Error('Postmark API key not configured. Please set POSTMARK_API_KEY environment variable.')
  }

  const emailConfig = getEmailConfig(data.tenantSettings)
  const roleLabel = data.role.charAt(0).toUpperCase() + data.role.slice(1)
  const inviterLine = data.inviterEmail ? `<p>Invited by: ${data.inviterEmail}</p>` : ''

  try {
    await client.sendEmail({
      From: emailConfig.fromEmail,
      To: data.inviteeEmail,
      Subject: `You're invited to ${data.tenantName}`,
      HtmlBody: `
        <h1>You're invited to ${data.tenantName}</h1>
        <p>Role: ${roleLabel}</p>
        ${inviterLine}
        <p><a href="${data.inviteLink}">Accept your invite</a></p>
        <p>If you did not expect this invite, you can ignore this email.</p>
      `,
      TextBody: `You've been invited to join ${data.tenantName} as ${roleLabel}.\n${data.inviterEmail ? `Invited by: ${data.inviterEmail}\n` : ''}Accept invite: ${data.inviteLink}`,
      MessageStream: 'outbound'
    })
  } catch (error: unknown) {
    console.error('Postmark error:', error)
    if (error && typeof error === 'object' && 'message' in error) {
      throw new Error(`Postmark: ${(error as { message: string }).message}`)
    }
    throw new Error('Postmark failed to send email. Check API key and sender verification.')
  }
}