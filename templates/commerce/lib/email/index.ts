// Unified email interface with order ID-based wrappers
import { createSupabaseServer } from '../supabaseServer'
import type { TenantSettings } from '@/types/tenant'
import { resolveEmailProvider, type EmailProvider } from '../integrations'
import {
  sendOrderConfirmation as sendOrderConfirmationSG,
  sendOrderShipped as sendOrderShippedSG,
  sendOrderCancelled as sendOrderCancelledSG,
  sendOrderRefunded as sendOrderRefundedSG,
  sendAdminOrderNotification,
  sendInviteEmail as sendInviteEmailSG
} from './sendgrid'
import {
  sendOrderConfirmation as sendOrderConfirmationPM,
  sendOrderShipped as sendOrderShippedPM,
  sendOrderCancelled as sendOrderCancelledPM,
  sendOrderRefunded as sendOrderRefundedPM,
  sendInviteEmail as sendInviteEmailPM,
} from './postmark'
import {
  sendOrderConfirmation as sendOrderConfirmationRS,
  sendOrderShipped as sendOrderShippedRS,
  sendOrderCancelled as sendOrderCancelledRS,
  sendOrderRefunded as sendOrderRefundedRS,
  sendInviteEmail as sendInviteEmailRS,
} from './resend-order'

interface OrderEmailData {
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
  emailProvider: EmailProvider
}

interface InviteEmailData {
  inviteeEmail: string
  inviteLink: string
  tenantName: string
  role: string
  inviterEmail?: string | null
  emailProvider: EmailProvider
}

// Fetch order data from database
async function getOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
  const supabase = await createSupabaseServer()

  // Get order with stored shipping address (includes customer email)
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      tenant:tenants(settings)
    `)
    .eq('id', orderId)
    .single()

  if (!order) return null

  const tenant = Array.isArray(order.tenant) ? order.tenant[0] : order.tenant
  const tenantSettings = (tenant?.settings || undefined) as TenantSettings | undefined
  const emailProvider = resolveEmailProvider(tenantSettings)

  // Get order items with variant details
  const { data: items } = await supabase
    .from('order_items')
    .select(`
      qty,
      price_cents,
      product_variants!inner(
        sku,
        brand,
        model,
        size,
        condition_code
      )
    `)
    .eq('order_id', orderId)

  if (!items) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailItems = items?.map((item: any) => ({
    sku: item.product_variants.sku,
    name: `${item.product_variants.brand} ${item.product_variants.model}`,
    size: item.product_variants.size,
    condition: item.product_variants.condition_code,
    quantity: item.qty,
    price: item.price_cents
  })) || []

  const computedSubtotal = emailItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const subtotal = (order.subtotal_cents ?? computedSubtotal) as number
  const shipping = (order.shipping_cents ?? 0) as number
  const tax = (order.tax_cents ?? 0) as number
  const total = (order.total_cents ?? (subtotal + shipping + tax)) as number

  const customerEmail = (order.shipping_address as unknown as { email?: string } | null)?.email || ''

  return {
    orderId: order.id,
    customerEmail,
    items: emailItems,
    subtotal,
    shipping,
    tax,
    total,
    shippingAddress: order.shipping_address,
    trackingNumber: order.tracking_number,
    carrier: order.carrier,
    emailProvider
  }
}

// Wrapper functions that accept orderId
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    if (data.emailProvider === 'disabled') {
      return
    }
    if (data.emailProvider === 'resend') {
      await sendOrderConfirmationRS(data)
      return
    }
    if (data.emailProvider === 'postmark') {
      await sendOrderConfirmationPM(data)
      return
    }
    await sendOrderConfirmationSG(data)
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
  }
}

export async function sendOrderShipped(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    if (data.emailProvider === 'disabled') {
      return
    }
    if (data.emailProvider === 'resend') {
      await sendOrderShippedRS(data)
      return
    }
    if (data.emailProvider === 'postmark') {
      await sendOrderShippedPM(data)
      return
    }
    await sendOrderShippedSG(data)
  } catch (error) {
    console.error('Failed to send shipping notification:', error)
  }
}

export async function sendOrderCancelled(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    if (data.emailProvider === 'disabled') {
      return
    }
    if (data.emailProvider === 'resend') {
      await sendOrderCancelledRS(data)
      return
    }
    if (data.emailProvider === 'postmark') {
      await sendOrderCancelledPM(data)
      return
    }
    await sendOrderCancelledSG(data)
  } catch (error) {
    console.error('Failed to send cancellation email:', error)
  }
}

export async function sendOrderRefunded(orderId: string): Promise<void> {
  try {
    const data = await getOrderEmailData(orderId)
    if (!data) {
      console.error('Order not found for email:', orderId)
      return
    }
    if (data.emailProvider === 'disabled') {
      return
    }
    if (data.emailProvider === 'resend') {
      await sendOrderRefundedRS(data)
      return
    }
    if (data.emailProvider === 'postmark') {
      await sendOrderRefundedPM(data)
      return
    }
    await sendOrderRefundedSG(data)
  } catch (error) {
    console.error('Failed to send refund email:', error)
  }
}

interface InviteEmailParams {
  inviteeEmail: string
  inviteLink: string
  tenantName: string
  role: string
  inviterEmail?: string | null
  emailProvider: EmailProvider
}

export async function sendInviteEmail(data: InviteEmailParams): Promise<void> {
  try {
    if (data.emailProvider === 'disabled') {
      console.warn('Email provider is disabled. Cannot send invite email.')
      throw new Error('Email provider is disabled. Please configure an email service.')
    }
    if (data.emailProvider === 'resend') {
      await sendInviteEmailRS(data)
      return
    }
    if (data.emailProvider === 'postmark') {
      await sendInviteEmailPM(data)
      return
    }
    await sendInviteEmailSG(data)
  } catch (error) {
    console.error('Failed to send invite email:', error)
    // Re-throw the error with more context
    if (error instanceof Error) {
      throw new Error(`Failed to send invite email: ${error.message}`)
    }
    throw new Error('Failed to send invite email due to an unknown error')
  }
}

export { sendAdminOrderNotification }
