export type UserRole = 'customer' | 'staff' | 'admin' | 'owner' | 'super_admin'

export type TenantStatus = 'active' | 'inactive' | 'suspended'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  primary_domain: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface TenantDomain {
  id: string
  tenant_id: string
  domain: string
  is_primary: boolean
  verified_at: string | null
  created_at: string
}

export type TenantBillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export interface TenantBilling {
  tenant_id: string
  plan: string
  status: TenantBillingStatus
  billing_email: string | null
  stripe_customer_id: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  tenant_id: string
  created_at: string
  last_active_at: string | null
  is_online: boolean
}

export interface VerifiedContact {
  id: string
  user_id: string
  verified_user_id: string
  verified_public_key: string
  verified_fingerprint: string
  verified_short_fingerprint: string
  verified_at: string
  verified_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  tenant_id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  category: string | null
  drop_starts_at: string | null
  drop_ends_at: string | null
  is_drop: boolean
  created_at: string
}

export interface ProductVariant {
  id: string
  tenant_id: string
  product_id: string
  sku: string
  brand: string
  model: string
  size: string | null
  condition: string | null
  condition_code: string
  price_cents: number
  stock: number
  reserved: number
  first_sold_at: string | null
  created_at: string
}

export interface ProductImage {
  id: string
  tenant_id: string
  product_id: string
  url: string
  position: number
  created_at: string
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'shipped' | 'cancelled' | 'refunded'

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  province: string
  postal_code: string
  country: string
  phone?: string
}

export interface Order {
  id: string
  tenant_id: string
  customer_id: string
  status: OrderStatus
  subtotal_cents: number
  total_cents: number | null
  stripe_payment_intent: string | null
  shipping_address: ShippingAddress
  shipping_cents: number
  shipping_method: string | null
  tax_cents: number
  tax_rate: number | null
  currency: string
  tracking_number: string | null
  carrier: string | null
  paid_at: string | null
  fulfilled_at: string | null
  shipped_at: string | null
  cancelled_at: string | null
  refunded_at: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  tenant_id: string
  order_id: string
  variant_id: string
  qty: number
  price_cents: number
}

export interface StaffLocation {
  id: string
  tenant_id: string
  user_id: string
  recorded_at: string
  latitude: number
  longitude: number
  accuracy_m: number | null
  task_id: string | null
  source: string | null
  expires_at: string
}

export type MessageType = 'text' | 'location'

export interface MessageLocation {
  lat: number
  lng: number
  accuracy?: number
  recordedAt: string
}

export interface Message {
  id: string
  tenant_id: string
  customer_id: string
  content: string
  sender_type: 'customer' | 'admin'
  read: boolean
  created_at: string
  message_type: MessageType
  location: MessageLocation | null
  encrypted?: boolean
  iv?: string
  sender_public_key?: string
  message_index?: number
  deleted_at?: string | null
  deleted_by?: string | null
  deleted_for_both?: boolean
  expires_at?: string | null
  attachment_path?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  attachment_size?: number | null
  attachment_key?: string | null
  attachment_key_iv?: string | null
  attachment_key_sender_public_key?: string | null
  attachment_key_message_index?: number | null
}
