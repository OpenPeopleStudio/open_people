// NOWPayments Integration
// Docs: https://documenter.getpostman.com/view/7907941/S1a32n38

import crypto from 'crypto'

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1'

interface CreatePaymentData {
  price_amount: number
  price_currency: string
  order_id: string
  order_description: string
  ipn_callback_url: string
  success_url: string
  cancel_url: string
}

interface NOWPaymentInvoice {
  id: string
  token_id: string
  order_id: string
  order_description: string
  price_amount: number
  price_currency: string
  invoice_url: string
  created_at: string
  updated_at: string
}

interface NOWPaymentStatus {
  payment_id: number
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired'
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  purchase_id: string
  outcome_amount: number
  outcome_currency: string
}

export async function createNOWPaymentInvoice(data: CreatePaymentData): Promise<NOWPaymentInvoice> {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create NOWPayments invoice')
  }

  return response.json()
}

export async function getNOWPaymentStatus(paymentId: string): Promise<NOWPaymentStatus> {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/payment/${paymentId}`, {
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get payment status')
  }

  return response.json()
}

export async function getAvailableCurrencies(): Promise<{ currencies: string[] }> {
  const response = await fetch(`${NOWPAYMENTS_API_URL}/currencies`, {
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get currencies')
  }

  return response.json()
}

export function verifyNOWPaymentsIPN(
  payload: Record<string, unknown>,
  signature: string
): boolean {
  // Sort payload keys and create string
  const sortedPayload = Object.keys(payload)
    .sort()
    .reduce((acc, key) => {
      acc[key] = payload[key]
      return acc
    }, {} as Record<string, unknown>)

  const payloadString = JSON.stringify(sortedPayload)
  
  const expectedSignature = crypto
    .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
    .update(payloadString)
    .digest('hex')

  return signature === expectedSignature
}

export type NOWPaymentsIPNPayload = {
  payment_id: number
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  purchase_id: string
  created_at: string
  updated_at: string
  outcome_amount: number
  outcome_currency: string
}
