'use client'

import { useMemo, useState } from 'react'
import type { StoredKeyPair } from '@/lib/crypto/e2e'

interface EncryptionSettingsProps {
  isOpen: boolean
  onClose: () => void
  keyPairs: StoredKeyPair[]
  isLocked: boolean
  onLock: (password: string) => Promise<void>
  onUnlock: (password: string) => Promise<void>
  onRotate: () => Promise<void>
  onResetSessions: () => Promise<void>
  onUpdateDeviceLabel: (label: string) => Promise<void>
  lastBackupAt?: string | null
}

function formatDate(value?: number) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function EncryptionSettings({
  isOpen,
  onClose,
  keyPairs,
  isLocked,
  onLock,
  onUnlock,
  onRotate,
  onResetSessions,
  onUpdateDeviceLabel,
  lastBackupAt,
}: EncryptionSettingsProps) {
  const [labelInput, setLabelInput] = useState('')
  const [lockPassword, setLockPassword] = useState('')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeKey = useMemo(
    () => keyPairs.find((key) => key.isActive) || null,
    [keyPairs]
  )

  if (!isOpen) return null

  const handleLock = async () => {
    if (!lockPassword || lockPassword.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onLock(lockPassword)
      setLockPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock keys')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!unlockPassword) {
      setError('Enter your passphrase to unlock keys.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onUnlock(unlockPassword)
      setUnlockPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock keys')
    } finally {
      setLoading(false)
    }
  }

  const handleRotate = async () => {
    setLoading(true)
    setError(null)
    try {
      await onRotate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate keys')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      await onResetSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLabel = async () => {
    const label = labelInput.trim()
    if (!label) return
    setLoading(true)
    setError(null)
    try {
      await onUpdateDeviceLabel(label)
      setLabelInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update label')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Security & device settings
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Manage how this device protects messages. No crypto knowledge required.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          {/* Device Name */}
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">Device name</p>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Current: <span className="text-[var(--text-primary)] font-medium">{activeKey?.deviceLabel || 'This device'}</span>
            </p>
            <div className="flex gap-2">
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="MacBook Pro, Office iMac, etc."
                className="flex-1"
              />
              <button
                onClick={handleUpdateLabel}
                disabled={loading || !labelInput.trim()}
                className="btn-secondary text-sm"
              >
                Update
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Helps you recognize where your secure messages are stored
            </p>
          </div>

          {/* Fix Connection Issues */}
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">Fix connection issues</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">
              Use these if secure messages stop working or you changed devices
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRotate}
                disabled={loading || isLocked}
                className="btn-primary text-sm"
              >
                Reset Keys
              </button>
              <button
                onClick={handleResetSessions}
                disabled={loading || isLocked}
                className="btn-secondary text-sm"
              >
                Reconnect Chats
              </button>
            </div>
          </div>

          {/* Security Checklist */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Security Checklist</p>
            <div className="space-y-3">
              <div className={`flex items-start gap-3 p-3 rounded-lg ${
                !isLocked ? 'bg-[var(--warning)]/5 border border-[var(--warning)]/20' : 'bg-[var(--success)]/5 border border-[var(--success)]/20'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {isLocked ? (
                    <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {isLocked ? 'Passphrase protection enabled' : 'Add passphrase protection'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {isLocked ? 'Your keys require a passphrase to unlock' : 'Use the lock/unlock control on the main privacy page'}
                  </p>
                </div>
              </div>

              <div className={`flex items-start gap-3 p-3 rounded-lg ${
                lastBackupAt ? 'bg-[var(--success)]/5 border border-[var(--success)]/20' : 'bg-[var(--warning)]/5 border border-[var(--warning)]/20'
              }`}>
                <div className="flex-shrink-0 mt-0.5">
                  {lastBackupAt ? (
                    <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {lastBackupAt ? 'Backup created' : 'Create a backup'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {lastBackupAt
                      ? `Last backup: ${new Date(lastBackupAt).toLocaleDateString()}`
                      : 'Save a recovery code to restore keys if you switch devices'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Verify with teammates</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Compare fingerprints to ensure secure communication
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-3">How It Works</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex gap-3 bg-[var(--bg-primary)] rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-0.5">
                    Keys Generated on Your Device
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Created in your browser, never leave your device
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-[var(--bg-primary)] rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-0.5">
                    Messages Encrypted Before Sending
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Only you and recipient can decrypt
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-[var(--bg-primary)] rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-0.5">
                    Backup for Device Changes
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Recovery codes restore keys
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-[var(--bg-primary)] rounded-lg p-3 border border-[var(--border-primary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-0.5">
                    Verify Fingerprints
                  </h4>
                  <p className="text-xs text-[var(--text-muted)]">
                    Compare to detect tampering
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recognized devices */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Recognized devices</p>
            <div className="space-y-2">
              {keyPairs.map((key) => (
                <div
                  key={key.id}
                  className="border border-[var(--border-primary)] rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      {key.deviceLabel || 'Unknown device'}
                      {key.isActive ? ' (active)' : ''}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Created {formatDate(key.createdAt)} · Last used {formatDate(key.lastUsedAt)}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {key.privateKey ? 'Unlocked' : key.encryptedPrivateKey ? 'Locked' : 'Unavailable'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
