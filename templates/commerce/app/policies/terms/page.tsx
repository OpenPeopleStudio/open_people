'use client'

import PolicyPage from '../../../../components/PolicyPage'
import { DEFAULT_TERMS_POLICY } from '@/lib/policies/defaults'

export default function TermsOfService() {
  return (
    <PolicyPage
      policyKey="terms"
      defaultTitle="Terms of Service"
      defaultContent={DEFAULT_TERMS_POLICY}
    />
  )
}
