'use client'

import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Surface from '../../../components/ui/Surface'

interface EncryptionLockScreenProps {
  onUnlock: (password: string) => Promise<void>
  error?: string | null
}

export default function EncryptionLockScreen({ onUnlock, error }: EncryptionLockScreenProps) {
  const [password, setPassword] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setUnlocking(true)
    setUnlockError(null)

    try {
      await onUnlock(password)
      setPassword('')
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Failed to unlock')
    } finally {
      setUnlocking(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Surface padding="lg" className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--warning)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Encryption Locked
          </h2>
          
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Your encryption keys are protected with a passphrase. Enter your passphrase to view encrypted messages and sensitive information.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {unlockError && (
          <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
            <p className="text-sm text-[var(--error)]">{unlockError}</p>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Passphrase
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your passphrase"
              className="w-full"
              autoFocus
              disabled={unlocking}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!password || unlocking}
          >
            {unlocking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Unlocking...
              </>
            ) : (
              'Unlock Encryption'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            What's protected?
          </h3>
          <ul className="space-y-2 text-xs text-[var(--text-muted)]">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Encrypted customer messages and attachments</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Customer profiles and sensitive contact information</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Internal team communications and group chats</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <p className="text-xs text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">Security tip:</strong> If you forgot your passphrase, you'll need to use your recovery code or reset your encryption keys (which will lose access to old encrypted messages).
          </p>
        </div>
      </Surface>
    </div>
  )
}
