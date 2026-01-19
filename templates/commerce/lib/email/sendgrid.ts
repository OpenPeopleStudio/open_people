import sendgrid from '@sendgrid/mail'
import type { TenantSettings } from '@/types/tenant'
import { getEmailConfig } from './config'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || 'dummy-key')

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
  tax: number
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
  const itemsHtml = data.items.map(item =>
    `<tr>
      <td>${item.sku}</td>
      <td>${item.name}${item.size ? ` (${item.size})` : ''} - ${item.condition}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price * item.quantity)}</td>
    </tr>`
  ).join('')

  const emailConfig = getEmailConfig(data.tenantSettings)
  
  const msg = {
    to: data.customerEmail,
    from: {
      email: emailConfig.ordersEmail,
      name: emailConfig.brandName
    },
    subject: `Order Confirmation - ${data.orderId}`,
    html: `
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
      <p>Tax: ${formatCurrency(data.tax)}</p>
      <p><strong>Total: ${formatCurrency(data.total)}</strong></p>

      <h2>Shipping Address</h2>
      <pre>${formatAddress(data.shippingAddress)}</pre>

      <p>We'll send you another email when your order ships.</p>
      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `
  }

  await sendgrid.send(msg)
}

export async function sendOrderShipped(data: EmailData): Promise<void> {
  const emailConfig = getEmailConfig(data.tenantSettings)
  const trackingInfo = data.trackingNumber && data.carrier
    ? `<p>Tracking: ${data.trackingNumber} (${data.carrier})</p>`
    : ''

  const msg = {
    to: data.customerEmail,
    from: {
      email: emailConfig.ordersEmail,
      name: emailConfig.brandName
    },
    subject: `Your order has shipped - ${data.orderId}`,
    html: `
      <h1>Your order has shipped!</h1>
      <p>Order ID: ${data.orderId}</p>

      ${trackingInfo}

      <h2>Shipping Address</h2>
      <pre>${formatAddress(data.shippingAddress)}</pre>

      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `
  }

  await sendgrid.send(msg)
}

export async function sendOrderCancelled(data: EmailData): Promise<void> {
  const emailConfig = getEmailConfig(data.tenantSettings)
  const msg = {
    to: data.customerEmail,
    from: {
      email: emailConfig.ordersEmail,
      name: emailConfig.brandName
    },
    subject: `Order Cancelled - ${data.orderId}`,
    html: `
      <h1>Order Cancelled</h1>
      <p>We're sorry, but your order ${data.orderId} has been cancelled.</p>
      <p>If you were charged, your payment will be refunded within 5-7 business days.</p>
      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `
  }

  await sendgrid.send(msg)
}

export async function sendOrderRefunded(data: EmailData): Promise<void> {
  const emailConfig = getEmailConfig(data.tenantSettings)
  const msg = {
    to: data.customerEmail,
    from: {
      email: emailConfig.ordersEmail,
      name: emailConfig.brandName
    },
    subject: `Refund Processed - ${data.orderId}`,
    html: `
      <h1>Refund Processed</h1>
      <p>Your refund for order ${data.orderId} has been processed.</p>
      <p>Amount: ${formatCurrency(data.total)}</p>
      <p>Please allow 5-7 business days for the refund to appear on your account.</p>
      <p>Questions? Contact us at ${emailConfig.supportEmail}</p>
    `
  }

  await sendgrid.send(msg)
}

export async function sendAdminOrderNotification(orderId: string, customerEmail: string, total: number, items: Array<{ sku: string; name: string; quantity: number }>, tenantSettings?: TenantSettings): Promise<void> {
  const emailConfig = getEmailConfig(tenantSettings)
  const msg = {
    to: emailConfig.ordersEmail,
    from: emailConfig.fromEmail,
    subject: `New Order Received - ${orderId}`,
    html: `
      <h1>New Order Received</h1>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Customer:</strong> ${customerEmail}</p>
      <p><strong>Total:</strong> ${formatCurrency(total)}</p>

      <h2>Items</h2>
      <ul>
        ${items.map(item => `<li>${item.sku} - ${item.name} (x${item.quantity})</li>`).join('')}
      </ul>

      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders/${orderId}">View Order</a></p>
    `
  }

  await sendgrid.send(msg)
}

export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey || apiKey === 'dummy-key') {
    throw new Error('SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable.')
  }

  const emailConfig = getEmailConfig(data.tenantSettings)
  const roleLabel = data.role.charAt(0).toUpperCase() + data.role.slice(1)
  const inviterLine = data.inviterEmail ? `<p>Invited by: ${data.inviterEmail}</p>` : ''

  const msg = {
    to: data.inviteeEmail,
    from: {
      email: emailConfig.fromEmail,
      name: emailConfig.brandName
    },
    subject: `You're invited to ${data.tenantName}`,
    html: `
      <h1>You're invited to ${data.tenantName}</h1>
      <p>Role: ${roleLabel}</p>
      ${inviterLine}
      <p><a href="${data.inviteLink}" style="display: inline-block; background: #E10600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept your invite</a></p>
      <p style="margin-top: 20px; color: #8A8F98; font-size: 14px;">If you did not expect this invite, you can ignore this email.</p>
    `,
  }

  try {
    await sendgrid.send(msg)
  } catch (error: unknown) {
    console.error('SendGrid error:', error)
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { body?: { errors?: Array<{ message: string }> } } }).response
      const errors = response?.body?.errors
      if (errors && errors.length > 0) {
        throw new Error(`SendGrid: ${errors.map(e => e.message).join(', ')}`)
      }
    }
    throw new Error('SendGrid failed to send email. Check API key and sender verification.')
  }
}
