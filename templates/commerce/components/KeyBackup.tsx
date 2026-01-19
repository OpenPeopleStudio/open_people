'use client'

import { useState } from 'react'

interface KeyBackupProps {
  onBackup: (password: string) => Promise<string>
  onRestore: (backupData: string, password: string) => Promise<void>
  onClose: () => void
  lastBackupAt?: string | null
}

export default function KeyBackup({ onBackup, onRestore, onClose, lastBackupAt }: KeyBackupProps) {
  const [mode, setMode] = useState<'backup' | 'restore'>('backup')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [backupData, setBackupData] = useState('')
  const [exportedData, setExportedData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleBackup = async () => {
    const hasLetter = /[A-Za-z]/.test(password)
    const hasNumber = /\d/.test(password)
    if (password.length < 10 || !hasLetter || !hasNumber) {
      setError('Use at least 10 characters with letters and numbers')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await onBackup(password)
      setExportedData(data)
      setSuccess('Keys exported successfully! Save this backup in a secure location.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!backupData.trim()) {
      setError('Please paste your backup data')
      return
    }
    if (!password) {
      setError('Please enter your backup password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onRestore(backupData.trim(), password)
      setSuccess('Keys restored successfully!')
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed - check your password')
    } finally {
      setLoading(false)
    }
  }

  const copyBackup = async () => {
    await navigator.clipboard.writeText(exportedData)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadBackup = () => {
    const blob = new Blob([exportedData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `709exclusive-keys-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            🔑 Key Backup & Recovery
          </h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-primary)]">
          <button
            onClick={() => { setMode('backup'); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'backup'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Backup Keys
          </button>
          <button
            onClick={() => { setMode('restore'); setError(null); setSuccess(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'restore'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Restore Keys
          </button>
        </div>

        <div className="p-6">
          {lastBackupAt && (
            <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-xs text-[var(--text-muted)]">
                Last backup: {new Date(lastBackupAt).toLocaleString()}
              </p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
              <p className="text-sm text-[var(--success)]">{success}</p>
            </div>
          )}

          {mode === 'backup' ? (
            <>
              {!exportedData ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Create an encrypted backup of your encryption keys. You&apos;ll need this backup to 
                    decrypt messages on a new device.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Backup Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a strong password"
                        className="w-full"
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Use 10+ characters with letters and numbers.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full"
                      />
                    </div>

                    <button
                      onClick={handleBackup}
                      disabled={loading || !password || !confirmPassword}
                      className="btn-primary w-full"
                    >
                      {loading ? 'Creating Backup...' : 'Create Encrypted Backup'}
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg">
                    <p className="text-xs text-[var(--warning)]">
                      <strong>Important:</strong> If you lose your backup and get logged out, you won&apos;t 
                      be able to decrypt old messages. Store this backup securely.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Your encrypted backup is ready. Save it securely!
                  </p>

                  <div className="mb-4">
                    <textarea
                      readOnly
                      value={exportedData}
                      className="w-full h-32 font-mono text-xs resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={copyBackup} className="btn-secondary flex-1">
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                    <button onClick={downloadBackup} className="btn-primary flex-1">
                      Download
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Restore your encryption keys from a previous backup to access your encrypted messages.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    Backup Data
                  </label>
                  <textarea
                    value={backupData}
                    onChange={(e) => setBackupData(e.target.value)}
                    placeholder="Paste your backup data here..."
                    className="w-full h-32 font-mono text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">
                    Backup Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your backup password"
                    className="w-full"
                  />
                </div>

                <button
                  onClick={handleRestore}
                  disabled={loading || !backupData || !password}
                  className="btn-primary w-full"
                >
                  {loading ? 'Restoring...' : 'Restore Keys'}
                </button>
              </div>

              <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)]">
                  <strong className="text-[var(--text-secondary)]">Note:</strong> Restoring keys will 
                  replace your current keys. Make sure to backup current keys first if needed.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
