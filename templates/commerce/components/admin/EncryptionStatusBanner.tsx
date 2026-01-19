'use client'

import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Surface from '../../../components/ui/Surface'

interface EncryptionStatusBannerProps {
  isInitialized: boolean
  isInitializing: boolean
  publicKey: string | null
  fingerprint: string | null
  shortFingerprint: string | null
  error: string | null
  isLocked: boolean
  recipientHasKey: boolean
  recipientId: string | null
  onBackupKeys?: () => void
  onVerifyKeys?: () => void
  supportTitle?: string
  supportDescription?: string
  supportWarning?: string
}

export default function EncryptionStatusBanner({
  isInitialized,
  isInitializing,
  publicKey,
  fingerprint,
  shortFingerprint,
  error,
  isLocked,
  recipientHasKey,
  recipientId,
  onBackupKeys,
  onVerifyKeys,
  supportTitle,
  supportDescription,
  supportWarning,
}: EncryptionStatusBannerProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (isInitializing) {
    return (
      <Surface padding="sm" className="mb-4 bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--accent-blue)]">Initializing encryption...</span>
        </div>
      </Surface>
    )
  }

  if (error) {
    return (
      <Surface padding="sm" className="mb-4 bg-[var(--error)]/10 border border-[var(--error)]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-[var(--error)]">Encryption error: {error}</span>
          </div>
        </div>
      </Surface>
    )
  }

  if (!isInitialized) {
    return (
      <Surface padding="sm" className="mb-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-[var(--text-primary)]">Messages will be sent unencrypted</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>
            Initialize Encryption
          </Button>
        </div>
      </Surface>
    )
  }

  // Encryption is working
  const isDeviceReady = isInitialized && publicKey && !isLocked
  const isSecure = isDeviceReady && (!recipientId || recipientHasKey)

  return (
    <Surface padding="sm" className={`mb-4 ${
      isSecure 
        ? 'bg-[var(--success)]/10 border border-[var(--success)]/20'
        : 'bg-[var(--warning)]/10 border border-[var(--warning)]/20'
    }`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSecure ? (
              <>
                <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-medium text-[var(--success)]">End-to-end encrypted</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-[var(--warning)]">
                  {isLocked
                    ? 'Security is locked on this device'
                    : recipientId && !recipientHasKey
                      ? 'Recipient has no encryption key'
                      : 'Partial encryption'}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} details
          </button>
        </div>

        {(supportTitle || supportDescription || supportWarning) && (
          <div className="pl-7 space-y-1">
            {supportTitle && (
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {supportTitle}
              </p>
            )}
            {supportDescription && (
              <p className="text-xs text-[var(--text-muted)]">
                {supportDescription}
              </p>
            )}
            {supportWarning && (
              <p className="text-xs text-[var(--warning)]">
                {supportWarning}
              </p>
            )}
          </div>
        )}

        {showDetails && (
          <div className="pl-7 space-y-1">
            <div className="text-xs text-[var(--text-muted)]">
              <span className="font-medium">Your fingerprint:</span>{' '}
              <code className="font-mono">{shortFingerprint || 'Not available'}</code>
            </div>
            {recipientId && (
              <div className="text-xs text-[var(--text-muted)]">
                <span className="font-medium">Recipient encryption:</span>{' '}
                {recipientHasKey ? (
                  <span className="text-[var(--success)]">✓ Enabled</span>
                ) : (
                  <span className="text-[var(--warning)]">⚠ Not set up</span>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              {onBackupKeys && (
                <Button size="sm" variant="ghost" onClick={onBackupKeys}>
                  Backup Keys
                </Button>
              )}
              {onVerifyKeys && recipientId && (
                <Button size="sm" variant="ghost" onClick={onVerifyKeys}>
                  Verify with Recipient
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Surface>
  )
}
