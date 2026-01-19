'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../@/lib/supabaseClient'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'

type PageState = 'loading' | 'no-token' | 'expired' | 'error' | 'ready'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent double-initialization in StrictMode
    if (initialized.current) return
    initialized.current = true

    const processAuth = async () => {
      try {
        const hash = window.location.hash
        const code = searchParams.get('code')
        
        // PKCE flow - exchange code for session
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              setPageState('expired')
            } else {
              setError(error.message)
              setPageState('error')
            }
            return
          }
          window.history.replaceState(null, '', window.location.pathname)
          setPageState('ready')
          return
        }
        
        // Implicit flow - hash contains tokens
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const expiresAt = params.get('expires_at')
          
          // Check if token expired
          if (expiresAt) {
            const expTime = parseInt(expiresAt, 10) * 1000
            if (Date.now() > expTime) {
              setPageState('expired')
              return
            }
          }
          
          if (accessToken && refreshToken) {
            // Set the session
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (error) {
              // If "aborted" error, try getting the session instead
              // as Supabase may have already processed it
              if (error.message.includes('aborted')) {
                const { data } = await supabase.auth.getSession()
                if (data.session) {
                  window.history.replaceState(null, '', window.location.pathname)
                  setPageState('ready')
                  return
                }
              }
              setError(error.message)
              setPageState('error')
              return
            }
            
            window.history.replaceState(null, '', window.location.pathname)
            setPageState('ready')
            return
          }
        }
        
        // No tokens in URL - check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setPageState('ready')
        } else {
          setPageState('no-token')
        }
        
      } catch (err) {
        console.error('Auth processing error:', err)
        // On error, try checking if session exists anyway
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setPageState('ready')
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setPageState('error')
        }
      }
    }

    // Small delay to ensure we're fully client-side
    const timer = setTimeout(processAuth, 50)
    return () => clearTimeout(timer)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
      } else {
        setMessage('Password updated successfully! Redirecting...')
        setTimeout(() => router.push('/account'), 2000)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Render content based on state
  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-10 h-10 mx-auto border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--text-muted)]">Verifying reset link...</p>
          </div>
        )

      case 'no-token':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Reset Your Password</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              To reset your password, request a reset link from the login page.
            </p>
            <Link href="/account/login" className="btn-primary">
              Go to Login
            </Link>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--warning)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Link Expired</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              This password reset link has expired. Reset links are valid for 1 hour.
            </p>
            <Link href="/account/login" className="btn-primary">
              Request New Link
            </Link>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Something Went Wrong</h1>
            <p className="text-[var(--text-secondary)] mb-4">
              We couldn&apos;t verify your reset link.
            </p>
            {error && (
              <p className="text-sm text-[var(--error)] mb-6 p-3 bg-[var(--error)]/10 rounded-lg">
                {error}
              </p>
            )}
            <Link href="/account/login" className="btn-primary">
              Request New Link
            </Link>
          </div>
        )

      case 'ready':
        return (
          <div>
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set New Password</h1>
              <p className="text-[var(--text-secondary)] mt-2">Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label>New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">At least 6 characters</p>
              </div>

              <div>
                <label>Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
                  <p className="text-sm text-[var(--error)]">{error}</p>
                </div>
              )}

              {message && (
                <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
                  <p className="text-sm text-[var(--success)]">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center pt-24 pb-16">
        <div className="w-full max-w-md px-6">
          {renderContent()}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-16">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
