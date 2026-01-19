'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { useEncryption } from '../../../components/EncryptionProvider'
import KeyBackup from '../../../components/KeyBackup'
import KeyVerification from '../../../components/KeyVerification'
import { useTenant } from '@/context/TenantContext'

export default function AccountSettingsPage() {
  const router = useRouter()
  const { id: tenantId, featureFlags } = useTenant()
  const eligibleOrderStatuses = ['pending', 'paid', 'fulfilled', 'shipped']
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [showKeyBackup, setShowKeyBackup] = useState(false)
  const [showKeyVerification, setShowKeyVerification] = useState(false)
  const [hasPurchase, setHasPurchase] = useState(false)
  const [purchaseLoaded, setPurchaseLoaded] = useState(false)
  const [isStaffUser, setIsStaffUser] = useState(false)
  const [locationOptIn, setLocationOptIn] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)

  const {
    isInitialized: encryptionReady,
    hasKeys,
    fingerprint,
    shortFingerprint,
    error: encryptionError,
    backupKeys,
    restoreKeys,
  } = useEncryption()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/account/login')
        return
      }
      setUserId(user.id)
      setEmail(user.email || '')
      setFullName(user.user_metadata?.full_name || '')

      let ordersQuery = supabase
        .from('orders')
        .select('id, status')
        .eq('customer_id', user.id)

      if (tenantId) {
        ordersQuery = ordersQuery.eq('tenant_id', tenantId)
      }

      const { data: orders } = await ordersQuery

      const hasEligible = (orders || []).some((order) =>
        eligibleOrderStatuses.includes(order.status)
      )
      setHasPurchase(hasEligible)
      setPurchaseLoaded(true)

      let profileQuery = supabase
        .from('709_profiles')
        .select('role, staff_location_opt_in')
        .eq('id', user.id)

      if (tenantId) {
        profileQuery = profileQuery.eq('tenant_id', tenantId)
      }

      const { data: profile } = await profileQuery.single()

      const role = profile?.role || null
      setIsStaffUser(['staff', 'admin', 'owner'].includes(role || ''))
      setLocationOptIn(Boolean(profile?.staff_location_opt_in))

      setPageLoading(false)
    }
    loadUser()
  }, [router, tenantId])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Profile updated successfully!')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (signInError) {
        setError('Current password is incorrect')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setMessage('Password updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleLocationSharing = async () => {
    setSavingLocation(true)
    setLocationError(null)
    setLocationMessage(null)

    try {
      if (!userId) {
        setLocationError('Unable to resolve user')
        setSavingLocation(false)
        return
      }
      const updates = { staff_location_opt_in: !locationOptIn }
      let query = supabase
        .from('709_profiles')
        .update(updates)
        .eq('id', userId)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { error } = await query
      if (error) {
        setLocationError(error.message)
      } else {
        setLocationOptIn(!locationOptIn)
        setLocationMessage(!locationOptIn ? 'Location sharing enabled.' : 'Location sharing disabled.')
      }
    } catch {
      setLocationError('Unable to update location sharing preference')
    } finally {
      setSavingLocation(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 md:pt-28 md:pb-24">
        <div className="container max-w-2xl">
          <div className="mb-8">
            <Link href="/account" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              ← Back to Account
            </Link>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Account Settings</h1>
          </div>

          <div className="space-y-8">
            {/* Profile */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Profile</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label>Email</label>
                  <input type="email" value={email} disabled className="opacity-60" />
                  <p className="text-xs text-[var(--text-muted)] mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Account Status */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Account Status</h2>
              {!purchaseLoaded ? (
                <p className="text-sm text-[var(--text-muted)]">Checking order history…</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      hasPurchase
                        ? 'bg-[var(--success)]/15 text-[var(--success)]'
                        : 'bg-[var(--warning)]/15 text-[var(--warning)]'
                    }`}>
                      {hasPurchase ? 'Buyer' : 'Window shopper'}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {hasPurchase
                        ? 'Messaging is unlocked.'
                        : 'Messaging unlocks after your first order (pending counts).'}
                    </span>
                  </div>
                  {!hasPurchase && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                      <Link href="/shop" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">
                        Browse products →
                      </Link>
                      <Link href="/account/orders" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        View orders
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
                    <p className="text-sm text-[var(--error)]">{error}</p>
                  </div>
                )}
                {message && (
                  <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-md">
                    <p className="text-sm text-[var(--success)]">{message}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {isStaffUser && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Location Sharing</h2>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Opt in to share your delivery location with admins. You can disable anytime.
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={toggleLocationSharing}
                    disabled={savingLocation}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      locationOptIn
                        ? 'bg-[var(--success)] text-white hover:bg-[var(--success)]/90'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                    } ${savingLocation ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {locationOptIn ? 'Sharing enabled' : 'Enable sharing'}
                  </button>
                  <span className="text-xs text-[var(--text-muted)]">
                    {locationOptIn ? 'Your location can be shared when tracked.' : 'Not sharing location.'}
                  </span>
                </div>
                {locationOptIn && (
                  <Link
                    href="/staff/location"
                    className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Start live location tracking →
                  </Link>
                )}
                {locationError && (
                  <div className="mt-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
                    <p className="text-sm text-[var(--error)]">{locationError}</p>
                  </div>
                )}
                {locationMessage && (
                  <div className="mt-4 p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-md">
                    <p className="text-sm text-[var(--success)]">{locationMessage}</p>
                  </div>
                )}
              </div>
            )}

            {featureFlags.messages !== false && featureFlags.e2e_encryption !== false && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Message Security</h2>
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  Your messages with 709exclusive are end-to-end encrypted. Only you and our team can read them.
                </p>

                {encryptionError ? (
                  <div className="p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-lg mb-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--warning)]">Encryption unavailable:</span> {encryptionError}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Your browser may not support secure storage. Messages will still be sent but won&apos;t be encrypted.
                    </p>
                  </div>
                ) : !encryptionReady ? (
                  <div className="flex items-center gap-3 p-4 bg-[var(--bg-tertiary)] rounded-lg mb-4">
                    <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-[var(--text-muted)]">Setting up encryption...</p>
                  </div>
                ) : hasKeys ? (
                  <>
                    {/* Encryption Status */}
                    <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-[var(--success)]">Encryption active</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Your encryption keys are set up on this device.
                      </p>
                    </div>

                    {/* Key Fingerprint */}
                    <div className="mb-4">
                      <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Your Key Fingerprint</label>
                      <div className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-lg font-mono text-sm text-[var(--text-secondary)]">
                        {shortFingerprint || 'Loading...'}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        This fingerprint verifies your encryption key. You can compare it with support to ensure secure communication.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowKeyBackup(true)}
                        className="btn-secondary text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Backup Keys
                      </button>
                      <button
                        onClick={() => setShowKeyVerification(true)}
                        className="btn-secondary text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        View Full Key
                      </button>
                    </div>

                    {/* Backup Info */}
                    <div className="mt-6 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                      <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Why backup your keys?</h4>
                      <ul className="text-xs text-[var(--text-muted)] space-y-1">
                        <li>• Read encrypted messages on other devices</li>
                        <li>• Restore access if you clear browser data</li>
                        <li>• Keep access when switching browsers</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                    <p className="text-sm text-[var(--text-muted)]">
                      No encryption keys found. Keys will be generated when you first use messages.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sign Out */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sign Out</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">Sign out of your account on this device.</p>
              <button onClick={handleSignOut} className="btn-secondary">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Key Backup Modal */}
      {showKeyBackup && featureFlags.messages !== false && featureFlags.e2e_encryption !== false && (
        <KeyBackup
          onBackup={backupKeys}
          onRestore={restoreKeys}
          onClose={() => setShowKeyBackup(false)}
        />
      )}

      {/* Key Verification Modal */}
      {showKeyVerification && featureFlags.messages !== false && featureFlags.e2e_encryption !== false && (
        <KeyVerification
          myFingerprint={fingerprint}
          myShortFingerprint={shortFingerprint}
          myPublicKey={null}
          isInitialized={encryptionReady}
          onClose={() => setShowKeyVerification(false)}
        />
      )}
    </div>
  )
}
