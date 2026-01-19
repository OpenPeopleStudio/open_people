'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabaseClient'
import Button from '../../../components/ui/Button'

interface KeyVerificationProps {
  myFingerprint: string | null
  myShortFingerprint: string | null
  myPublicKey: string | null
  theirFingerprint?: string | null
  theirShortFingerprint?: string | null
  theirName?: string
  theirId?: string
  isVerified?: boolean
  onVerify?: () => void
  onResetVerification?: () => void
  onClose: () => void
  isInitialized?: boolean
  error?: string | null
}

export default function KeyVerification({
  myFingerprint,
  myShortFingerprint,
  myPublicKey,
  theirFingerprint,
  theirShortFingerprint,
  theirName,
  theirId,
  isVerified = false,
  onVerify,
  onResetVerification,
  onClose,
  isInitialized = true,
  error = null,
}: KeyVerificationProps) {
  const [activeTab, setActiveTab] = useState<'my-key' | 'scan' | 'verify'>('my-key')
  const [copied, setCopied] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState<{
    publicKey: string
    fingerprint: string
    userId?: string
  } | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerElementId = 'qr-reader'

  // Check if we're still loading
  const isLoading = !isInitialized && !error && !myPublicKey

  // Generate QR data when keys are available
  const qrData = useMemo(() => {
    if (!myPublicKey || !myShortFingerprint) return ''
    return JSON.stringify({
      type: '709e2e',
      version: 1,
      publicKey: myPublicKey,
      fingerprint: myShortFingerprint,
    })
  }, [myPublicKey, myShortFingerprint])

  const copyFingerprint = async (fingerprint: string) => {
    await navigator.clipboard.writeText(fingerprint)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startScanning = async () => {
    setScanning(true)
    setScanError(null)
    setScannedData(null)

    try {
      const scanner = new Html5Qrcode(scannerElementId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success - process the scanned QR code
          try {
            const parsed = JSON.parse(decodedText)
            if (parsed.type === '709e2e' && parsed.publicKey && parsed.fingerprint) {
              setScannedData({
                publicKey: parsed.publicKey,
                fingerprint: parsed.fingerprint,
              })
              stopScanning()
            } else {
              setScanError('Invalid QR code format')
            }
          } catch {
            setScanError('Could not parse QR code')
          }
        },
        () => {
          // Ignore decode errors (just means no QR code in frame)
        }
      )
    } catch (err) {
      console.error('Scanner error:', err)
      setScanError('Could not access camera. Please check permissions.')
      setScanning(false)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error)
      scannerRef.current = null
    }
    setScanning(false)
  }

  const verifyScannedKey = async () => {
    if (!scannedData) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setScanError('Not authenticated')
        return
      }

      // Find the user with this public key
      const { data: profiles } = await supabase
        .from('709_profiles')
        .select('id, full_name, email')
        .eq('public_key', scannedData.publicKey)
        .limit(1)

      if (!profiles || profiles.length === 0) {
        setScanError('Could not find user with this public key')
        return
      }

      const verifiedUser = profiles[0]

      // Store verification
      const { error: insertError } = await supabase
        .from('709_verified_contacts')
        .upsert({
          user_id: user.id,
          verified_user_id: verifiedUser.id,
          verified_public_key: scannedData.publicKey,
          verified_fingerprint: scannedData.fingerprint,
          verified_short_fingerprint: scannedData.fingerprint,
          verified_method: 'qr_scan',
          verified_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,verified_user_id'
        })

      if (insertError) {
        setScanError('Failed to save verification')
        console.error(insertError)
        return
      }

      setVerificationStatus(`✓ Verified ${verifiedUser.full_name || verifiedUser.email}`)
      setTimeout(() => {
        setScannedData(null)
        setVerificationStatus(null)
        setActiveTab('my-key')
      }, 2000)
    } catch (err) {
      console.error('Verification error:', err)
      setScanError('Failed to verify contact')
    }
  }

  const markAsVerified = async () => {
    if (!theirId || !theirFingerprint || !theirShortFingerprint) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get their public key
      const { data: profile } = await supabase
        .from('709_profiles')
        .select('public_key')
        .eq('id', theirId)
        .single()

      if (!profile?.public_key) {
        console.error('Could not find public key for user')
        return
      }

      // Store verification
      await supabase
        .from('709_verified_contacts')
        .upsert({
          user_id: user.id,
          verified_user_id: theirId,
          verified_public_key: profile.public_key,
          verified_fingerprint: theirFingerprint,
          verified_short_fingerprint: theirShortFingerprint,
          verified_method: 'manual',
          verified_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,verified_user_id'
        })

      if (onVerify) onVerify()
    } catch (err) {
      console.error('Failed to mark as verified:', err)
    }
  }

  const resetVerification = async () => {
    if (!theirId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('709_verified_contacts')
        .delete()
        .eq('user_id', user.id)
        .eq('verified_user_id', theirId)

      if (onResetVerification) onResetVerification()
    } catch (err) {
      console.error('Failed to reset verification:', err)
    }
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Key Verification
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
            onClick={() => {
              setActiveTab('my-key')
              stopScanning()
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'my-key'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            My Key
          </button>
          <button
            onClick={() => {
              setActiveTab('scan')
              stopScanning()
            }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'scan'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            Scan QR
          </button>
          {theirFingerprint && (
            <button
              onClick={() => {
                setActiveTab('verify')
                stopScanning()
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'verify'
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Verify {theirName}
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)] font-medium mb-1">Encryption Error</p>
              <p className="text-xs text-[var(--text-muted)]">{error}</p>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Try refreshing the page or check if your browser supports IndexedDB.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-[var(--text-muted)]">Initializing encryption keys...</p>
              <p className="text-xs text-[var(--text-muted)] mt-2">This may take a few seconds</p>
            </div>
          )}

          {/* My Key Tab */}
          {!isLoading && activeTab === 'my-key' && (
            <>
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-lg">
                  {qrData ? (
                    <QRCodeSVG 
                      value={qrData} 
                      size={180}
                      level="M"
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-400">
                      {error ? 'Keys unavailable' : 'Generating...'}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-sm text-[var(--text-muted)] mb-4">
                Share this QR code or fingerprint to verify your identity
              </p>

              {/* Short Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Short Fingerprint
                </label>
                <div className="mt-1 p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-center">
                  <span className="text-[var(--text-primary)] tracking-wider">
                    {myShortFingerprint || 'Loading...'}
                  </span>
                </div>
              </div>

              {/* Full Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Full Fingerprint
                </label>
                <button
                  onClick={() => myFingerprint && copyFingerprint(myFingerprint)}
                  className="mt-1 w-full p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-xs text-left hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <span className="text-[var(--text-secondary)] break-all">
                    {myFingerprint || 'Loading...'}
                  </span>
                  <span className="block mt-2 text-[var(--text-muted)] text-xs">
                    {copied ? '✓ Copied!' : 'Click to copy'}
                  </span>
                </button>
              </div>

              <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)]">
                  <strong className="text-[var(--text-secondary)]">How to verify:</strong> Compare this fingerprint 
                  with what others see when they view your profile. If they match, your messages are truly end-to-end encrypted.
                </p>
              </div>
            </>
          )}

          {/* Scan QR Tab */}
          {!isLoading && activeTab === 'scan' && (
            <>
              {!scanning && !scannedData && (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    Scan Contact's QR Code
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-6">
                    Ask them to show their QR code from the verification screen
                  </p>
                  <Button onClick={startScanning} variant="primary">
                    Start Camera
                  </Button>
                </div>
              )}

              {scanning && (
                <div>
                  <div id={scannerElementId} className="rounded-lg overflow-hidden mb-4"></div>
                  <Button onClick={stopScanning} variant="secondary" className="w-full">
                    Stop Scanning
                  </Button>
                </div>
              )}

              {scanError && (
                <div className="mt-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                  <p className="text-sm text-[var(--error)]">{scanError}</p>
                </div>
              )}

              {scannedData && (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    QR Code Scanned
                  </h3>
                  <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Fingerprint</p>
                    <p className="text-sm font-mono text-[var(--text-primary)]">{scannedData.fingerprint}</p>
                  </div>
                  {verificationStatus ? (
                    <p className="text-sm text-[var(--success)]">{verificationStatus}</p>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={verifyScannedKey} variant="primary" className="flex-1">
                        Verify Contact
                      </Button>
                      <Button onClick={() => setScannedData(null)} variant="ghost">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Verify Their Key Tab */}
          {!isLoading && activeTab === 'verify' && (
            <>
              {/* Verify Their Key */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="font-medium text-[var(--text-primary)]">{theirName}</h3>
              </div>

              {/* Their Short Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Their Short Fingerprint
                </label>
                <div className="mt-1 p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-center">
                  <span className="text-[var(--text-primary)] tracking-wider">
                    {theirShortFingerprint || 'Not available'}
                  </span>
                </div>
              </div>

              {/* Their Full Fingerprint */}
              <div className="mb-4">
                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  Their Full Fingerprint
                </label>
                <button
                  onClick={() => theirFingerprint && copyFingerprint(theirFingerprint)}
                  className="mt-1 w-full p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-xs text-left hover:bg-[var(--bg-primary)] transition-colors"
                >
                  <span className="text-[var(--text-secondary)] break-all">
                    {theirFingerprint || 'Not available'}
                  </span>
                  <span className="block mt-2 text-[var(--text-muted)] text-xs">
                    {copied ? '✓ Copied!' : 'Click to copy'}
                  </span>
                </button>
              </div>

              <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
                <p className="text-xs text-[var(--success)]">
                  <strong>To verify:</strong> Ask {theirName} to show you their fingerprint in person or via 
                  a trusted channel (phone call, video). If it matches what you see here, your conversation is secure.
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                {isVerified ? (
                  <>
                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-[var(--success)]/20 text-[var(--success)]">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verified
                    </span>
                    <Button
                      onClick={resetVerification}
                      variant="ghost"
                      size="sm"
                    >
                      Reset
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={markAsVerified}
                    variant="primary"
                    className="w-full"
                  >
                    Mark as Verified
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
