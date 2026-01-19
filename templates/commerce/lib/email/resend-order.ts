import { sendResendEmail } from '@/lib/email/resend'
import { formatAddress, formatCurrency } from '@/lib/email/templates'

type EmailData = {
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
}

type InviteEmailData = {
  inviteeEmail: string
  inviteLink: string
  tenantName: string
  role: string
  inviterEmail?: string | null
}

export async function sendOrderConfirmation(data: EmailData): Promise<void> {
  const itemsHtml = data.items
    .map(
      (item) => `<tr>
  <td>${item.sku}</td>
  <td>${item.name}${item.size ? ` (${item.size})` : ''} - ${item.condition}</td>
  <td>${item.quantity}</td>
  <td>${formatCurrency(item.price * item.quantity)}</td>
</tr>`
    )
    .join('')

  await sendResendEmail({
    to: data.customerEmail,
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
      <p>Questions? Contact us at support@709exclusive.com</p>
    `,
  })
}

export async function sendOrderShipped(data: EmailData): Promise<void> {
  const trackingInfo =
    data.trackingNumber && data.carrier
      ? `<p>Tracking: ${data.trackingNumber} (${data.carrier})</p>`
      : ''

  await sendResendEmail({
    to: data.customerEmail,
    subject: `Your order has shipped - ${data.orderId}`,
    html: `
      <h1>Your order has shipped!</h1>
      <p>Order ID: ${data.orderId}</p>

      ${trackingInfo}

      <h2>Shipping Address</h2>
      <pre>${formatAddress(data.shippingAddress)}</pre>

      <p>Questions? Contact us at support@709exclusive.com</p>
    `,
  })
}

export async function sendOrderCancelled(data: EmailData): Promise<void> {
  await sendResendEmail({
    to: data.customerEmail,
    subject: `Order Cancelled - ${data.orderId}`,
    html: `
      <h1>Order Cancelled</h1>
      <p>We're sorry, but your order ${data.orderId} has been cancelled.</p>
      <p>If you were charged, your payment will be refunded within 5-7 business days.</p>
      <p>Questions? Contact us at support@709exclusive.com</p>
    `,
  })
}

export async function sendOrderRefunded(data: EmailData): Promise<void> {
  await sendResendEmail({
    to: data.customerEmail,
    subject: `Refund Processed - ${data.orderId}`,
    html: `
      <h1>Refund Processed</h1>
      <p>Your refund for order ${data.orderId} has been processed.</p>
      <p>Amount: ${formatCurrency(data.total)}</p>
      <p>Please allow 5-7 business days for the refund to appear on your account.</p>
      <p>Questions? Contact us at support@709exclusive.com</p>
    `,
  })
}

export async function sendInviteEmail(data: InviteEmailData): Promise<void> {
  const roleLabel = data.role.charAt(0).toUpperCase() + data.role.slice(1)
  const inviterLine = data.inviterEmail ? `<p>Invited by: ${data.inviterEmail}</p>` : ''
  
  try {
    await sendResendEmail({
      to: data.inviteeEmail,
      subject: `You're invited to ${data.tenantName}`,
      html: `
        <h1>You're invited to ${data.tenantName}</h1>
        <p>Role: ${roleLabel}</p>
        ${inviterLine}
        <p><a href="${data.inviteLink}" style="display: inline-block; background: #E10600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept your invite</a></p>
        <p style="margin-top: 20px; color: #8A8F98; font-size: 14px;">If you did not expect this invite, you can ignore this email.</p>
      `,
    })
  } catch (error) {
    console.error('Resend invite email error:', error)
    throw error // Re-throw to propagate the error message from sendResendEmail
  }
}
