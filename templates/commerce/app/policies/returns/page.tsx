'use client'

import PolicyPage from '../../../../components/PolicyPage'
import { DEFAULT_RETURNS_POLICY } from '@/lib/policies/defaults'

export default function ReturnsPolicy() {
  return (
    <PolicyPage
      policyKey="returns"
      defaultTitle="Returns & Exchanges Policy"
      defaultContent={DEFAULT_RETURNS_POLICY}
    />
  )
}
