'use client'

import PolicyPage from '../../../../components/PolicyPage'
import { DEFAULT_SHIPPING_POLICY } from '@/lib/policies/defaults'

export default function ShippingPolicy() {
  return (
    <PolicyPage
      policyKey="shipping"
      defaultTitle="Shipping Information"
      defaultContent={DEFAULT_SHIPPING_POLICY}
    />
  )
}
