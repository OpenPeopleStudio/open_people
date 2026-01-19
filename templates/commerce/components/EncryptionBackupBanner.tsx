'use client'

import { useState } from 'react'
import { useEncryption } from './EncryptionProvider'

export default function EncryptionBackupBanner() {
  const { needsBackup, dismissBackupReminder, createRecoveryBackup } = useEncryption()
  const [recoveryData, setRecoveryData] = useState<{ code: string; backup: string } | null>(null)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)

  const handleCreateRecovery = async () => {
    setRecoveryError(null)
    try {
      const data = await createRecoveryBackup()
      setRecoveryData(data)
      setShowRecoveryModal(true)
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : 'Unable to create recovery code')
      setShowRecoveryModal(true)
    }
  }

  const handleCopyRecoveryCode = async () => {
    if (!recoveryData?.code) return
    try {
      await navigator.clipboard.writeText(recoveryData.code)
    } catch (err) {
      setRecoveryError(err instanceof Error ? err.message : 'Failed to copy recovery code')
    }
  }

  const handleDownloadRecoveryFile = () => {
    if (!recoveryData) return
    const contents = `Recovery code: ${recoveryData.code}\n\nBackup:\n${recoveryData.backup}\n`
    const blob = new Blob([contents], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '709exclusive-recovery.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!needsBackup) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2m-2 0h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Keep chat secure
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Save a recovery code so you can restore secure chat if you switch devices.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleCreateRecovery}
                  className="px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Save recovery code
                </button>
                <button
                  onClick={dismissBackupReminder}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={dismissBackupReminder}
              className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recovery code</h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Save this code to restore secure chat if you switch devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecoveryModal(false)
                  setRecoveryData(null)
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            {recoveryData ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3 font-mono text-sm text-[var(--text-primary)]">
                  {recoveryData.code}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyRecoveryCode}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    Copy code
                  </button>
                  <button
                    onClick={handleDownloadRecoveryFile}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Download backup
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-[var(--text-muted)]">
                Unable to create a recovery code right now.
              </div>
            )}

            {recoveryError && (
              <div className="mt-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                <p className="text-sm text-[var(--error)]">{recoveryError}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
