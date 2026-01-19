'use client'

import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Surface from '../../../components/ui/Surface'

interface EncryptionSetupPanelProps {
  onInitialize: () => void
  onViewKeys: () => void
  currentUserKey: string | null
  recipientKey: string | null
  recipientName: string | null
}

export default function EncryptionSetupPanel({
  onInitialize,
  onViewKeys,
  currentUserKey,
  recipientKey,
  recipientName,
}: EncryptionSetupPanelProps) {
  const [showFingerprint, setShowFingerprint] = useState(false)

  const bothHaveKeys = currentUserKey && recipientKey
  const yourStatus = currentUserKey ? '✓ Set up' : '✗ Not set up'
  const theirStatus = recipientKey ? '✓ Set up' : '✗ Not set up'

  return (
    <Surface padding="md" className="mb-4 bg-[var(--bg-secondary)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              {bothHaveKeys ? '🔐 Encryption Active' : '⚠️ Encryption Setup Required'}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {bothHaveKeys 
                ? 'Messages are end-to-end encrypted. Only you and the recipient can read them.'
                : 'Set up encryption keys for both users to enable secure messaging.'
              }
            </p>
          </div>
          {currentUserKey && (
            <button
              onClick={() => setShowFingerprint(!showFingerprint)}
              className="text-xs text-[var(--accent-blue)] hover:underline"
            >
              {showFingerprint ? 'Hide' : 'Show'} fingerprint
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
            <div className="text-[var(--text-muted)] mb-1">Your encryption</div>
            <div className={currentUserKey ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
              {yourStatus}
            </div>
            {!currentUserKey && (
              <Button
                onClick={onInitialize}
                size="sm"
                variant="primary"
                className="mt-2"
              >
                Initialize Now
              </Button>
            )}
          </div>

          {recipientName && (
            <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
              <div className="text-[var(--text-muted)] mb-1">{recipientName}'s encryption</div>
              <div className={recipientKey ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                {theirStatus}
              </div>
              {!recipientKey && (
                <div className="text-xs text-[var(--text-muted)] mt-2">
                  Ask them to visit the messages page to initialize
                </div>
              )}
            </div>
          )}
        </div>

        {showFingerprint && currentUserKey && (
          <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
            <div className="text-xs text-[var(--text-muted)] mb-2">
              Your encryption fingerprint (for verification):
            </div>
            <code className="text-xs font-mono text-[var(--accent-blue)] break-all">
              {currentUserKey.substring(0, 64)}...
            </code>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onViewKeys}
            variant="ghost"
            size="sm"
          >
            Manage Keys
          </Button>
          {bothHaveKeys && (
            <Button
              onClick={() => setShowFingerprint(true)}
              variant="ghost"
              size="sm"
            >
              Verify Security
            </Button>
          )}
        </div>

        {!bothHaveKeys && (
          <div className="p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
            <p className="text-xs text-[var(--text-secondary)]">
              <strong>Note:</strong> Messages can still be sent without encryption, but they won't be end-to-end encrypted. 
              For full privacy, both users need encryption keys set up.
            </p>
          </div>
        )}
      </div>
    </Surface>
  )
}
