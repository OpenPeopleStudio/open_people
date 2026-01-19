'use client'

import PolicyPage from '../../../../components/PolicyPage'
import { DEFAULT_PRIVACY_POLICY } from '@/lib/policies/defaults'

export default function PrivacyPolicy() {
  return (
    <PolicyPage
      policyKey="privacy"
      defaultTitle="Privacy Policy"
      defaultContent={DEFAULT_PRIVACY_POLICY}
    />
  )
}
