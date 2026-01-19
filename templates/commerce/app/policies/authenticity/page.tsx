'use client'

import PolicyPage from '../../../../components/PolicyPage'
import { DEFAULT_AUTHENTICITY_POLICY } from '@/lib/policies/defaults'

export default function AuthenticityPolicy() {
  return (
    <PolicyPage
      policyKey="authenticity"
      defaultTitle="Authenticity Guarantee"
      defaultContent={DEFAULT_AUTHENTICITY_POLICY}
    />
  )
}
