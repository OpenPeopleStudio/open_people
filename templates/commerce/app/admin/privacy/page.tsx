'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/lib/supabaseClient'
import { useE2EEncryption } from '@/hooks/useE2EEncryption'
import { usePresence } from '@/hooks/usePresence'
import EncryptionSettings from '../../../../components/EncryptionSettings'
import KeyVerification from '../../../../components/KeyVerification'
import KeyBackup from '../../../../components/KeyBackup'
import Button from '../../../../components/ui/Button'
import Surface from '../../../../components/ui/Surface'

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string
}

export default function PrivacyPage() {
  const [adminId, setAdminId] = useState<string | null>(null)
  const [showEncryptionSettings, setShowEncryptionSettings] = useState(false)
  const [showFullKeyVerification, setShowFullKeyVerification] = useState(false)
  const [showKeyBackup, setShowKeyBackup] = useState(false)
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null)
  const [lastRotationAt, setLastRotationAt] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [password, setPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showInfoMenu, setShowInfoMenu] = useState(false)
  const [activeInfoView, setActiveInfoView] = useState<'device' | 'team' | 'debug' | null>(null)

  const {
    isInitialized,
    isInitializing,
    fingerprint,
    shortFingerprint,
    publicKey,
    error: encryptionError,
    keyPairs,
    isLocked,
    lockKeys,
    unlockKeys,
    rotateKeys,
    resetSessions,
    updateDeviceLabel,
    backupKeys,
    restoreKeys,
    createRecoveryBackup,
  } = useE2EEncryption(adminId)

  const adminUserIds = adminUsers.map(u => u.id)
  const { presenceData, getPresence, formatLastSeen } = usePresence(adminUserIds)

  useEffect(() => {
    const getAdminId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdminId(user.id)
      }
    }
    getAdminId()
  }, [])

  useEffect(() => {
    const loadAdminUsers = async () => {
      const response = await fetch('/api/admin/messages/users')
      if (response.ok) {
        const data = await response.json()
        const admins = (data.users || []).filter((u: AdminUser) => 
          ['admin', 'owner', 'staff'].includes(u.role)
        )
        setAdminUsers(admins)
      }
    }
    loadAdminUsers()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastBackupAt(localStorage.getItem('709e2e:lastBackupAt'))
      setLastRotationAt(localStorage.getItem('709e2e:lastRotationAt'))
    }
  }, [])

  useEffect(() => {
    if (!showKeyBackup && typeof window !== 'undefined') {
      setLastBackupAt(localStorage.getItem('709e2e:lastBackupAt'))
    }
  }, [showKeyBackup])

  const activeKey = keyPairs.find(k => k.publicKey === publicKey)

  // Calculate backup freshness
  const backupAge = lastBackupAt ? Date.now() - new Date(lastBackupAt).getTime() : null
  const backupDaysOld = backupAge ? Math.floor(backupAge / (1000 * 60 * 60 * 24)) : null
  const needsBackup = !lastBackupAt || (backupDaysOld && backupDaysOld > 30)

  const qrData = publicKey && shortFingerprint ? JSON.stringify({
    type: '709e2e',
    version: 1,
    publicKey: publicKey,
    fingerprint: shortFingerprint,
  }) : ''

  const copyFingerprint = async (fp: string) => {
    await navigator.clipboard.writeText(fp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleQuickLock = async () => {
    if (!password) return
    setActionLoading(true)
    setActionMessage(null)
    try {
      await lockKeys(password)
      setPassword('')
      setActionMessage({ text: 'Encryption locked successfully', type: 'success' })
      setTimeout(() => setActionMessage(null), 3000)
    } catch (error) {
      setActionMessage({ 
        text: error instanceof Error ? error.message : 'Failed to lock', 
        type: 'error' 
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleQuickUnlock = async () => {
    if (!password) return
    setActionLoading(true)
    setActionMessage(null)
    try {
      await unlockKeys(password)
      setPassword('')
      setActionMessage({ text: 'Encryption unlocked successfully', type: 'success' })
      setTimeout(() => setActionMessage(null), 3000)
    } catch (error) {
      setActionMessage({ 
        text: error instanceof Error ? error.message : 'Failed to unlock', 
        type: 'error' 
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleQuickRotate = async () => {
    if (!confirm('Rotate encryption keys? This will generate new keys and invalidate old sessions.')) return
    setActionLoading(true)
    setActionMessage(null)
    try {
      await rotateKeys()
      if (typeof window !== 'undefined') {
        localStorage.setItem('709e2e:lastRotationAt', new Date().toISOString())
        setLastRotationAt(new Date().toISOString())
      }
      setActionMessage({ text: 'Keys rotated successfully', type: 'success' })
      setTimeout(() => setActionMessage(null), 3000)
    } catch (error) {
      setActionMessage({ 
        text: error instanceof Error ? error.message : 'Failed to rotate keys', 
        type: 'error' 
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateRecovery = async () => {
    setActionLoading(true)
    setActionMessage(null)
    try {
      const data = await createRecoveryBackup()
      if (typeof window !== 'undefined') {
        localStorage.setItem('709e2e:lastBackupAt', new Date().toISOString())
        setLastBackupAt(new Date().toISOString())
      }
      // Download recovery file
      const contents = `Recovery code: ${data.code}\n\nBackup:\n${data.backup}\n`
      const blob = new Blob([contents], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = '709exclusive-recovery.txt'
      link.click()
      URL.revokeObjectURL(url)
      
      setActionMessage({ text: 'Recovery code created and downloaded', type: 'success' })
      setTimeout(() => setActionMessage(null), 3000)
    } catch (error) {
      setActionMessage({ 
        text: error instanceof Error ? error.message : 'Failed to create recovery', 
        type: 'error' 
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Privacy & Encryption</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage end-to-end encryption and monitor admin activity
        </p>
      </div>

      {/* Status Overview - Clickable Button */}
      <Surface padding="lg">
        <button
          onClick={() => setShowEncryptionSettings(true)}
          className="w-full text-left mb-6 p-4 rounded-lg border border-transparent hover:border-[var(--accent)]/30 hover:bg-[var(--bg-tertiary)] transition-all"
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isInitialized && !isLocked
                ? 'bg-[var(--success)]/10 text-[var(--success)]'
                : isLocked
                  ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                  : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                {isInitialized && !isLocked ? 'Encryption Active' : isLocked ? 'Encryption Locked' : 'Encryption Inactive'}
                
                {/* Status Badges */}
                {isLocked && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 rounded-full">
                    Locked
                  </span>
                )}
                {needsBackup && isInitialized && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20 rounded-full">
                    No backup
                  </span>
                )}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {isInitialized && !isLocked
                  ? 'Your messages are protected with end-to-end encryption'
                  : isLocked
                    ? 'Enter your passphrase to unlock encryption'
                    : isInitializing
                      ? 'Setting up encryption...'
                      : 'Set up encryption to secure your messages'}
              </p>
              {encryptionError && (
                <div className="mt-2 p-2 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                  <p className="text-sm text-[var(--error)]">{encryptionError}</p>
                </div>
              )}
            </div>
            <svg className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Quick Lock/Unlock - Show under status when locked */}
        {isInitialized && isLocked && (
          <div className="mb-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Unlock Encryption</h4>
                <p className="text-xs text-[var(--text-muted)]">Enter passphrase to access secure messages</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passphrase"
                className="flex-1 px-4 py-3.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-base font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickUnlock()
                  }
                }}
              />
              <button
                onClick={handleQuickUnlock}
                disabled={!password || actionLoading}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-muted)] hover:from-[var(--accent-hover)] hover:to-[var(--accent)] text-white font-semibold text-sm shadow-[0_4px_12px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_16px_rgba(168,85,247,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {actionLoading ? 'Unlocking...' : 'Unlock'}
              </button>
            </div>
          </div>
        )}

        {/* Action Messages */}
        {actionMessage && (
          <div className={`mb-4 p-3 rounded-lg border ${
            actionMessage.type === 'success'
              ? 'bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]'
              : 'bg-[var(--error)]/10 border-[var(--error)]/20 text-[var(--error)]'
          }`}>
            <p className="text-sm">{actionMessage.text}</p>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          {/* Main Action Buttons - Single Row */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handleQuickRotate}
              variant="secondary"
              disabled={!isInitialized || isLocked || actionLoading}
              className="flex-col h-auto py-3"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs font-semibold">Rotate Keys</span>
            </Button>
            
            <Button
              onClick={handleCreateRecovery}
              variant="secondary"
              disabled={!isInitialized || isLocked || actionLoading}
              className="flex-col h-auto py-3"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="text-xs font-semibold">Recovery Code</span>
            </Button>
            
            <Button
              onClick={() => setShowKeyBackup(true)}
              variant="ghost"
              disabled={!isInitialized || isLocked}
              className="flex-col h-auto py-3"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs font-semibold">Manual Backup</span>
            </Button>
          </div>

          {/* Info Button with Dropdown - Below */}
          <div className="relative">
            <Button
              onClick={() => setShowInfoMenu(!showInfoMenu)}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">Device & Team Info</span>
              <svg className={`w-4 h-4 transition-transform ${showInfoMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            
            {showInfoMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setActiveInfoView('device')
                    setShowInfoMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 rounded-t-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Device Status
                </button>
                <button
                  onClick={() => {
                    setActiveInfoView('team')
                    setShowInfoMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Team Activity
                </button>
                <button
                  onClick={() => {
                    setActiveInfoView('debug')
                    setShowInfoMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors rounded-b-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Debug & Diagnostics
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Lock - Show when NOT locked */}
        {isInitialized && !isLocked && (
          <div className="mt-6 pt-6 border-t border-[var(--border-primary)]">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Lock Encryption</h4>
                <p className="text-xs text-[var(--text-muted)]">Lock with passphrase for extra security</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create passphrase"
                className="flex-1 px-4 py-3.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent text-base font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickLock()
                  }
                }}
              />
              <button
                onClick={handleQuickLock}
                disabled={!password || actionLoading}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--success)] to-emerald-500 hover:from-emerald-400 hover:to-[var(--success)] text-white font-semibold text-sm shadow-[0_4px_12px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_16px_rgba(34,197,94,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {actionLoading ? 'Locking...' : 'Lock'}
              </button>
            </div>
          </div>
        )}
      </Surface>

      {/* Key Verification - Inline QR Code & Fingerprint */}
      {isInitialized && !isLocked && (
        <Surface padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Verify Keys</h3>
            <Button
              onClick={() => setShowFullKeyVerification(true)}
              variant="ghost"
              size="sm"
            >
              Advanced Verification
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="mb-3">
                <p className="text-sm font-medium text-[var(--text-primary)] text-center mb-2">Your QR Code</p>
                <p className="text-xs text-[var(--text-muted)] text-center">Share with teammates to verify</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                {qrData ? (
                  <QRCodeSVG 
                    value={qrData} 
                    size={160}
                    level="M"
                  />
                ) : (
                  <div className="w-[160px] h-[160px] flex items-center justify-center text-gray-400">
                    Generating...
                  </div>
                )}
              </div>
            </div>

            {/* Fingerprints */}
            <div className="flex flex-col justify-center space-y-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">
                  Short Fingerprint
                </label>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-center">
                  <span className="text-[var(--text-primary)] tracking-wider">
                    {shortFingerprint || 'Loading...'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide block mb-1">
                  Full Fingerprint
                </label>
                <button
                  onClick={() => fingerprint && copyFingerprint(fingerprint)}
                  className="w-full p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-xs text-left hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <span className="text-[var(--text-secondary)] break-all block">
                    {fingerprint || 'Loading...'}
                  </span>
                  <span className="block mt-2 text-[var(--text-muted)] text-xs">
                    {copied ? '✓ Copied!' : 'Click to copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)]">
              <strong className="text-[var(--text-secondary)]">How to verify:</strong> Show this QR code or fingerprint to a teammate in person or via video call. They can scan your QR code or compare the fingerprint to confirm your identity.
            </p>
          </div>
        </Surface>
      )}

      {/* Device Info & Status Badges */}
      {activeInfoView === 'device' && isInitialized && activeKey && (
        <Surface padding="lg">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Device Status</h3>
            <button
              onClick={() => setActiveInfoView(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              isLocked
                ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20'
                : 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
            }`}>
              {isLocked ? 'Locked' : 'Active'}
            </span>
            {lastBackupAt && !needsBackup && (
              <span className="px-2 py-1 text-xs font-semibold bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 rounded-full">
                Backed up
              </span>
            )}
            {needsBackup && (
              <span className="px-2 py-1 text-xs font-semibold bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20 rounded-full">
                Needs backup
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Device Name</p>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                {activeKey.deviceLabel || 'This device'}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Created</p>
              <p className="text-sm text-[var(--text-muted)]">
                {new Date(activeKey.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Last Backup</p>
              <p className="text-sm text-[var(--text-muted)]">
                {lastBackupAt ? (
                  <>
                    {backupDaysOld === 0 ? 'Today' : `${backupDaysOld}d ago`}
                  </>
                ) : (
                  <span className="text-[var(--error)]">Never</span>
                )}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Last Rotation</p>
              <p className="text-sm text-[var(--text-muted)]">
                {lastRotationAt 
                  ? new Date(lastRotationAt).toLocaleDateString()
                  : 'Not yet'}
              </p>
            </div>
          </div>
        </Surface>
      )}

      {/* Team Activity */}
      {activeInfoView === 'team' && (
        <Surface padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Team Activity</h3>
              <span className="text-xs text-[var(--text-muted)]">
                {adminUsers.filter(u => getPresence(u.id).isOnline).length} online
              </span>
            </div>
            <button
              onClick={() => setActiveInfoView(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {adminUsers.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">Loading team members...</p>
            ) : (
              adminUsers.map(user => {
                const presence = getPresence(user.id)
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-blue)]/20 flex items-center justify-center text-xs font-semibold text-[var(--text-primary)]">
                          {(user.full_name || user.email)?.[0]?.toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-tertiary)] ${
                          presence.isOnline
                            ? 'bg-[var(--success)] shadow-[0_0_6px_rgba(34,197,94,0.5)]'
                            : 'bg-[var(--text-muted)]'
                        }`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {presence.isOnline ? 'Online now' : formatLastSeen(presence.lastActiveAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-[var(--text-muted)] capitalize">
                      {user.role}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </Surface>
      )}

      {/* Debug Panel */}
      {activeInfoView === 'debug' && isInitialized && (
        <Surface padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Debug & Diagnostics</h3>
            <button
              onClick={() => setActiveInfoView(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">Initialization Status</p>
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  {isInitialized ? 'Initialized' : isInitializing ? 'Initializing...' : 'Not initialized'}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">Public Key</p>
                <p className="text-sm text-[var(--text-primary)] font-mono truncate">
                  {publicKey ? `${publicKey.slice(0, 20)}...` : 'None'}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">Key Pairs</p>
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  {keyPairs.length} device{keyPairs.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">Encryption Error</p>
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  {encryptionError || 'None'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-primary)]">
              <p className="text-xs text-[var(--text-muted)] mb-2">Device Info</p>
              <div className="p-3 bg-[var(--bg-primary)] rounded-lg font-mono text-xs text-[var(--text-secondary)] overflow-x-auto">
                <pre>{JSON.stringify({
                  initialized: isInitialized,
                  locked: isLocked,
                  deviceCount: keyPairs.length,
                  hasPublicKey: !!publicKey,
                  fingerprint: shortFingerprint || 'N/A'
                }, null, 2)}</pre>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowKeyBackup(true)}
                variant="ghost"
                size="sm"
                disabled={isLocked}
              >
                Manual Backup
              </Button>
              <Button
                onClick={async () => {
                  if (confirm('Reset all sessions? This will force re-key all conversations.')) {
                    await resetSessions()
                    setActionMessage({ text: 'Sessions reset', type: 'success' })
                    setTimeout(() => setActionMessage(null), 3000)
                  }
                }}
                variant="ghost"
                size="sm"
                disabled={isLocked}
              >
                Reset Sessions
              </Button>
            </div>
          </div>
        </Surface>
      )}

      {/* Modals */}
      {showEncryptionSettings && (
        <EncryptionSettings
          isOpen={showEncryptionSettings}
          onClose={() => setShowEncryptionSettings(false)}
          keyPairs={keyPairs}
          isLocked={isLocked}
          onLock={lockKeys}
          onUnlock={unlockKeys}
          onRotate={rotateKeys}
          onResetSessions={resetSessions}
          onUpdateDeviceLabel={updateDeviceLabel}
          lastBackupAt={lastBackupAt}
        />
      )}

      {showFullKeyVerification && (
        <KeyVerification
          myFingerprint={fingerprint}
          myShortFingerprint={shortFingerprint}
          myPublicKey={publicKey}
          isInitialized={isInitialized}
          error={encryptionError}
          onClose={() => setShowFullKeyVerification(false)}
        />
      )}

      {showKeyBackup && (
        <KeyBackup
          onBackup={backupKeys}
          onRestore={restoreKeys}
          lastBackupAt={lastBackupAt}
          onClose={() => setShowKeyBackup(false)}
        />
      )}
    </div>
  )
}
